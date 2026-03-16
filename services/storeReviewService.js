import * as StoreReview from 'expo-store-review';

export const storeReviewService = {
  async requestStoreReviewIfNeeded() {
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      }
    } catch (e) {
      // silently fail - review prompt is non-critical
    }
  },
};
