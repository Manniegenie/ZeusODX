const express = require('express');
const mongoose = require('mongoose');
const onrampService = require('../services/onramppriceservice');
const { sendSwapCompletionNotification } = require('../services/notificationService');

const router = express.Router();

function mongoSupportsTransactions() {
  try {
    const connection = mongoose.connection;
    if (!connection?.client?.topology) {
      return false;
    }

    const options = connection.client?.s?.options || {};
    if (options.replicaSet) {
      return true;
    }

    const topologyType = connection.client.topology?.description?.type;
    if (topologyType && topologyType !== 'Single' && topologyType !== 'Unknown') {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

// Optimized caching
const ngnzQuoteCache = new Map();
const userCache = new Map();

async function executeNGNZSwap(userId, quote, correlationId, systemContext, useTransactions = mongoSupportsTransactions()) {
  const startTime = new Date();
  const supportsTransactions = Boolean(useTransactions && mongoSupportsTransactions());

  let session = null;
  let fromKey;
  let toKey;
  let swapReference;
  let userBefore;

  if (supportsTransactions) {
    session = await mongoose.startSession();
    session.startTransaction();
  } else if (!useTransactions) {
    logger.warn('Proceeding with NGNZ swap execution without MongoDB transactions.', {
      userId,
      correlationId,
    });
  }

  try {
    const { sourceCurrency, targetCurrency, amount, amountReceived, flow, type } = quote;

    fromKey = `${sourceCurrency.toLowerCase()}Balance`;
    toKey = `${targetCurrency.toLowerCase()}Balance`;
    swapReference = `NGNZ_SWAP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    userBefore = await User.findById(userId)
      .select(`${fromKey} ${toKey} lastBalanceUpdate portfolioLastUpdated`)
      .lean();

    const updateOptions = {
      new: true,
      runValidators: true,
      ...(supportsTransactions && session ? { session } : {}),
    };

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        [fromKey]: { $gte: amount },
      },
      {
        $inc: {
          [fromKey]: -amount,
          [toKey]: amountReceived,
        },
        $set: {
          lastBalanceUpdate: new Date(),
          portfolioLastUpdated: new Date(),
        },
      },
      updateOptions,
    );

    if (!updatedUser) {
      throw new Error(`Balance update failed - insufficient ${sourceCurrency} balance or user not found`);
    }

    userCache.delete(`user_balance_${userId}`);

    const swapOutTransaction = new Transaction({
      userId,
      type: 'SWAP',
      currency: sourceCurrency,
      amount: -amount,
      status: 'SUCCESSFUL',
      source: 'INTERNAL',
      reference: swapReference,
      obiexTransactionId: `${swapReference}_OUT`,
      narration: `NGNZ ${flow}: Swap ${amount} ${sourceCurrency} to ${amountReceived} ${targetCurrency}`,
      completedAt: new Date(),
      metadata: {
        swapDirection: 'OUT',
        swapType: type,
        flow,
        exchangeRate: amountReceived / amount,
        relatedTransactionRef: swapReference,
        fromCurrency: sourceCurrency,
        toCurrency: targetCurrency,
        fromAmount: amount,
        toAmount: amountReceived,
        correlationId,
      },
    });

    const swapInTransaction = new Transaction({
      userId,
      type: 'SWAP',
      currency: targetCurrency,
      amount: amountReceived,
      status: 'SUCCESSFUL',
      source: 'INTERNAL',
      reference: swapReference,
      obiexTransactionId: `${swapReference}_IN`,
      narration: `NGNZ ${flow}: Swap ${amount} ${sourceCurrency} to ${amountReceived} ${targetCurrency}`,
      completedAt: new Date(),
      metadata: {
        swapDirection: 'IN',
        swapType: type,
        flow,
        exchangeRate: amountReceived / amount,
        relatedTransactionRef: swapReference,
        fromCurrency: sourceCurrency,
        toCurrency: targetCurrency,
        fromAmount: amount,
        toAmount: amountReceived,
        correlationId,
      },
    });

    try {
      if (supportsTransactions && session) {
        await swapOutTransaction.save({ session });
        await swapInTransaction.save({ session });
      } else {
        await Transaction.create([swapOutTransaction, swapInTransaction], { ordered: true });
      }
    } catch (transactionError) {
      if (!(supportsTransactions && session) && userBefore) {
        const revertData = {
          [fromKey]: userBefore?.[fromKey] ?? 0,
          [toKey]: userBefore?.[toKey] ?? 0,
          lastBalanceUpdate: userBefore?.lastBalanceUpdate ?? new Date(),
          portfolioLastUpdated: userBefore?.portfolioLastUpdated ?? new Date(),
        };

        try {
          await User.updateOne({ _id: userId }, { $set: revertData });
          userCache.delete(`user_balance_${userId}`);
        } catch (revertError) {
          logger.error('Failed to revert user balances after transaction save failure', {
            userId,
            correlationId,
            error: revertError.message,
          });
        }
      }
      throw transactionError;
    }

    if (supportsTransactions && session) {
      await session.commitTransaction();
      session.endSession();
    }

    const swapResult = {
      success: true,
      reference: swapReference,
      swapId: swapReference,
      amount,
      amountReceived,
      sourceCurrency,
      targetCurrency,
      flow,
      type,
      userBefore,
      userAfter: {
        fromBalance: updatedUser[fromKey],
        toBalance: updatedUser[toKey],
      },
      processingMs: new Date() - startTime,
      correlationId,
    };

    logger.info('NGNZ swap executed successfully', swapResult);
    return swapResult;
  } catch (error) {
    if (supportsTransactions && session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        logger.error('Failed to abort MongoDB transaction for NGNZ swap', {
          correlationId,
          error: abortError.message,
        });
      }
      session.endSession();
    }

    if (!supportsTransactions && userBefore && fromKey && toKey) {
      const revertData = {
        [fromKey]: userBefore?.[fromKey] ?? 0,
        [toKey]: userBefore?.[toKey] ?? 0,
        lastBalanceUpdate: userBefore?.lastBalanceUpdate ?? new Date(),
        portfolioLastUpdated: userBefore?.portfolioLastUpdated ?? new Date(),
      };

      try {
        await User.updateOne({ _id: userId }, { $set: revertData });
        userCache.delete(`user_balance_${userId}`);
      } catch (revertError) {
        logger.error('Failed to revert user balances after NGNZ swap error', {
          userId,
          correlationId,
          error: revertError.message,
        });
      }
    }

    if (supportsTransactions && /Transaction numbers are only allowed/i.test(error.message)) {
      logger.warn('Retrying NGNZ swap execution without MongoDB transactions', {
        correlationId,
        userId,
        originalError: error.message,
      });
      return executeNGNZSwap(userId, quote, correlationId, systemContext, false);
    }

    logger.error('NGNZ swap execution failed', {
      error: error.stack,
      correlationId,
      userId,
      quote,
    });
    throw error;
  }
}
