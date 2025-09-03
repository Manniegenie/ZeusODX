import { NativeModules, Platform } from 'react-native';

const { ZendeskChatModule } = NativeModules;

class ZendeskService {
  
  /**
   * Initialize Zendesk Chat SDK
   * @param {string} accountKey - Your Zendesk account key
   * @param {string} appId - Your Zendesk app ID (optional)
   */
  static initialize(accountKey, appId = '') {
    if (!ZendeskChatModule) {
      console.warn('Zendesk Chat Module not available');
      return;
    }
    
    console.log('🟢 Initializing Zendesk Chat SDK...');
    ZendeskChatModule.initialize(accountKey, appId);
  }
  
  /**
   * Set visitor information before starting chat
   * @param {Object} visitorInfo - Visitor information
   * @param {string} visitorInfo.name - Visitor name
   * @param {string} visitorInfo.email - Visitor email
   * @param {string} visitorInfo.phoneNumber - Visitor phone number
   */
  static setVisitorInfo({ name = '', email = '', phoneNumber = '' }) {
    if (!ZendeskChatModule) {
      console.warn('Zendesk Chat Module not available');
      return;
    }
    
    console.log('🟢 Setting visitor info:', { name, email, phoneNumber });
    ZendeskChatModule.setVisitorInfo(name, email, phoneNumber);
  }
  
  /**
   * Start chat with Zendesk support
   * @returns {Promise<boolean>} - Success status
   */
  static async startChat() {
    if (!ZendeskChatModule) {
      console.warn('Zendesk Chat Module not available');
      return Promise.reject(new Error('Module not available'));
    }
    
    try {
      console.log('🟢 Starting Zendesk chat...');
      const result = await ZendeskChatModule.startChat();
      console.log('✅ Chat started successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to start chat:', error);
      throw error;
    }
  }
  
  /**
   * Check if Zendesk module is available
   * @returns {boolean} - Availability status
   */
  static isAvailable() {
    return !!ZendeskChatModule;
  }
}

export default ZendeskService;