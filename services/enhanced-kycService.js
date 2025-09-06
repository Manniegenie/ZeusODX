// services/kycService.js
import { apiClient } from './apiClient';

const DEBUG_KYC = true;
const dbg = (...args) => { if (DEBUG_KYC) console.log('[kycService]', ...args); };

const PATHS = {
  bvnVerify: '/enhanced-kyc/bvn',
  digitalAddress: '/enhanced-kyc/address',
};

function shapeKycResult(resp) {
  const data = resp?.data || {};
  const ok = resp?.status >= 200 && resp?.status < 300;
  const payload = data?.data || data || {};
  // Expected shape from your routes:
  // {
  //   success: true,
  //   message: '... submitted',
  //   data: { kycId, partnerJobId, smileJobId, status, jobComplete }
  // }
  return {
    success: ok && !!data?.success,
    message: data?.message || (ok ? 'OK' : 'Failed'),
    data: {
      kycId: payload?.kycId ?? null,
      partnerJobId: payload?.partnerJobId ?? null,
      smileJobId: payload?.smileJobId ?? null,
      status: payload?.status ?? null,
      jobComplete: typeof payload?.jobComplete === 'boolean' ? payload.jobComplete : null,
    },
    raw: data,
  };
}

function shapeError(err, fallbackMsg) {
  const status = err?.response?.status;
  const rdata = err?.response?.data;
  const message = rdata?.message || err?.message || fallbackMsg || 'Request failed';
  return {
    success: false,
    error: status === 401 ? 'UNAUTHORIZED' : 'REQUEST_FAILED',
    status,
    message,
    details: rdata || err?.toString?.(),
  };
}

export const kycService = {
  /**
   * Submit Enhanced KYC (BVN).
   * @param {{ bvn: string, firstName?: string, lastName?: string, dob?: string, phoneNumber?: string }} body
   */
  async verifyBVN(body = {}) {
    try {
      dbg('POST', PATHS.bvnVerify, body);
      const resp = await apiClient.post(PATHS.bvnVerify, body);
      const shaped = shapeKycResult(resp);
      if (!shaped.success) dbg('❌ BVN verify unexpected shape', shaped);
      else dbg('✓ BVN submitted', shaped.data);
      return shaped;
    } catch (err) {
      const shaped = shapeError(err, 'BVN verification failed');
      dbg('❌ BVN verify error', shaped);
      return shaped;
    }
  },

  /**
   * Submit Digital Address Verification (no images).
   * @param {{
   *  country?: string, idType?: string,
   *  addressLine1: string, addressLine2?: string,
   *  city?: string, state?: string, postalCode?: string, phoneNumber?: string
   * }} body
   */
  async verifyDigitalAddress(body = {}) {
    try {
      dbg('POST', PATHS.digitalAddress, body);
      const resp = await apiClient.post(PATHS.digitalAddress, body);
      const shaped = shapeKycResult(resp);
      if (!shaped.success) dbg('❌ Address verify unexpected shape', shaped);
      else dbg('✓ Address submitted', shaped.data);
      return shaped;
    } catch (err) {
      const shaped = shapeError(err, 'Digital address verification failed');
      dbg('❌ Address verify error', shaped);
      return shaped;
    }
  },
};
