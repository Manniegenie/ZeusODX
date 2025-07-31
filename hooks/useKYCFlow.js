// hooks/useKYCFlow.js
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useQoreIdSdk } from '@qore-id/react-native-qoreid-sdk';
import KYCService from '../services/KYCService';

export const useKYCFlow = () => {
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState(null);
  const [currentProcess, setCurrentProcess] = useState(null);
  const [detailedLimits, setDetailedLimits] = useState(null);

  // Handle OCR results from QoreID SDK
  const handleOCRResult = async (ocrData) => {
    console.log('🔍 OCR Result received:', ocrData);
    
    try {
      if (!currentProcess?.customerReference) {
        throw new Error('No active KYC process found');
      }

      setLoading(true);

      // Send OCR data to backend for processing
      const response = await KYCService.processOCRResults(
        currentProcess.customerReference,
        ocrData
      );

      if (response.success) {
        // Show success message with details
        const confidence = (response.data.confidence * 100).toFixed(1);
        const status = response.data.kycStatus;
        
        Alert.alert(
          '✅ KYC Processing Complete',
          `Status: ${status}\nConfidence: ${confidence}%${
            response.data.updatedLimits 
              ? `\n\n🎉 New Limits:\nDaily: ₦${response.data.updatedLimits.newLimits.daily.toLocaleString()}\nMonthly: ₦${response.data.updatedLimits.newLimits.monthly.toLocaleString()}`
              : ''
          }`,
          [
            {
              text: 'View Details',
              onPress: () => showKYCResults(response.data)
            },
            { text: 'OK' }
          ]
        );

        // Reload KYC status and limits
        await Promise.all([
          loadKYCStatus(),
          loadDetailedLimits()
        ]);

      } else {
        Alert.alert('❌ Processing Failed', response.error || 'Please try again');
      }

    } catch (error) {
      console.error('💥 Error processing OCR results:', error);
      Alert.alert('❌ Error', error.message || 'Failed to process KYC results');
    } finally {
      setLoading(false);
      setCurrentProcess(null);
    }
  };

  // QoreID SDK hook
  const { launchQoreId } = useQoreIdSdk({
    onResult: handleOCRResult,
  });

  // Load KYC status
  const loadKYCStatus = async () => {
    try {
      const response = await KYCService.getKYCStatus();
      if (response.success) {
        setKycStatus(response.data);
        console.log('📊 KYC Status loaded:', response.data);
      }
    } catch (error) {
      console.error('❌ Error loading KYC status:', error);
    }
  };

  // Load detailed limits
  const loadDetailedLimits = async () => {
    try {
      const response = await KYCService.getDetailedLimits();
      if (response.success) {
        setDetailedLimits(response.data);
        console.log('💰 Detailed limits loaded:', response.data);
      }
    } catch (error) {
      console.error('❌ Error loading detailed limits:', error);
    }
  };

  // Show KYC results
  const showKYCResults = (kycData) => {
    const extractedInfo = kycData.extractedInfo;
    let message = `Level: ${kycData.kycLevel}\nStatus: ${kycData.kycStatus}\nConfidence: ${(kycData.confidence * 100).toFixed(1)}%\n\n`;
    
    if (extractedInfo) {
      message += '📄 Extracted Information:\n';
      if (extractedInfo.firstName) message += `Name: ${extractedInfo.firstName} ${extractedInfo.lastName}\n`;
      if (extractedInfo.dateOfBirth) message += `DOB: ${extractedInfo.dateOfBirth}\n`;
      if (extractedInfo.licenseNumber) message += `License: ${extractedInfo.licenseNumber}\n`;
      if (extractedInfo.vinNumber) message += `VIN: ${extractedInfo.vinNumber}\n`;
      if (extractedInfo.ninNumber) message += `NIN: ${extractedInfo.ninNumber}\n`;
      if (extractedInfo.passportNumber) message += `Passport: ${extractedInfo.passportNumber}\n`;
      if (extractedInfo.address) message += `Address: ${extractedInfo.address}\n`;
    }

    Alert.alert('📋 KYC Results', message);
  };

  // Start KYC process
  const startKYC = async (kycLevel, documentType) => {
    try {
      setLoading(true);
      
      console.log(`🚀 Starting KYC Level ${kycLevel} with document type: ${documentType}`);
      
      const response = await KYCService.initiateKYC(kycLevel, documentType);
      
      if (response.success) {
        setCurrentProcess(response.data);
        console.log('🎯 KYC initiated, launching QoreID SDK...');
        
        // Launch QoreID SDK with backend configuration
        launchQoreId(response.data.sdkConfig);
      } else {
        Alert.alert('❌ Error', response.error || 'Failed to start KYC process');
        setLoading(false);
      }
    } catch (error) {
      console.error('💥 Error starting KYC:', error);
      Alert.alert('❌ Error', error.message || 'Failed to start KYC process');
      setLoading(false);
    }
  };

  // Validate transaction
  const validateTransaction = async (amount, currency = 'NGNB', transactionType = 'WITHDRAWAL') => {
    try {
      const response = await KYCService.validateTransaction(amount, currency, transactionType);
      return response;
    } catch (error) {
      console.error('❌ Transaction validation error:', error);
      throw error;
    }
  };

  // Get KYC level status
  const getKYCLevelStatus = (level) => {
    if (!kycStatus?.kyc) return 'not_submitted';
    return kycStatus.kyc[`level${level}`]?.status || 'not_submitted';
  };

  // Check if KYC level is completed
  const isKYCLevelCompleted = (level) => {
    return getKYCLevelStatus(level) === 'approved';
  };

  // Check if user can start KYC level
  const canStartKYCLevel = (level) => {
    if (level === 1) return true;
    return isKYCLevelCompleted(level - 1);
  };

  // Load data on hook initialization
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        loadKYCStatus(),
        loadDetailedLimits()
      ]);
    };
    
    loadInitialData();
  }, []);

  return {
    // State
    loading,
    kycStatus,
    currentProcess,
    detailedLimits,
    
    // Actions
    startKYC,
    validateTransaction,
    loadKYCStatus,
    loadDetailedLimits,
    
    // Helpers
    getKYCLevelStatus,
    isKYCLevelCompleted,
    canStartKYCLevel,
    showKYCResults
  };
};