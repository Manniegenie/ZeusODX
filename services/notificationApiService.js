import { apiClient } from './apiClient';

export const notificationService = {
  /**
   * Get user notifications
   * @param {Object} options - Query options
   * @param {number} options.limit - Number of notifications to return
   * @param {number} options.skip - Number of notifications to skip
   * @param {boolean} options.unreadOnly - Only return unread notifications
   * @returns {Promise<Object>} Response with notifications array
   */
  async getNotifications(options = {}) {
    const { limit = 50, skip = 0, unreadOnly = false } = options;
    
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (skip) params.append('skip', skip.toString());
    if (unreadOnly) params.append('unreadOnly', 'true');
    
    const queryString = params.toString();
    const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(endpoint);
  },

  /**
   * Get unread notification count
   * @returns {Promise<Object>} Response with count
   */
  async getUnreadCount() {
    return apiClient.get('/notifications/unread-count');
  },

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} Response
   */
  async markAsRead(notificationId) {
    return apiClient.put(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<Object>} Response
   */
  async markAllAsRead() {
    return apiClient.put('/notifications/read-all');
  }
};
