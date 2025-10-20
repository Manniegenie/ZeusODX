import { Platform, StatusBar } from 'react-native';

/**
 * Configure edge-to-edge display for Android 15+ compatibility
 * This ensures the app displays correctly with edge-to-edge enabled
 * Uses modern Android 15+ APIs instead of deprecated ones
 */
export const configureEdgeToEdge = () => {
  if (Platform.OS === 'android') {
    // For Android 15+, use modern edge-to-edge APIs
    // Avoid deprecated StatusBar.setTranslucent() - use transparent background instead
    StatusBar.setBackgroundColor('transparent', true);
    
    // Set status bar style for better visibility
    StatusBar.setBarStyle('dark-content', true);
    
    // For Android 15+, the system handles edge-to-edge automatically
    // when edgeToEdgeEnabled is true in app.json
    // No need for deprecated APIs like setTranslucent()
  }
};

/**
 * Get safe area insets for edge-to-edge handling
 * This helps components adjust their layout for edge-to-edge display
 */
export const getEdgeToEdgeInsets = () => {
  if (Platform.OS === 'android') {
    return {
      top: 0, // Status bar height will be handled by SafeAreaView
      bottom: 0, // Navigation bar height will be handled by SafeAreaView
      left: 0,
      right: 0,
    };
  }
  
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
};

/**
 * Modern Android 15+ edge-to-edge configuration
 * This function provides the latest edge-to-edge setup for Android 15+
 */
export const configureModernEdgeToEdge = () => {
  if (Platform.OS === 'android') {
    // Use only modern, non-deprecated APIs for Android 15+
    StatusBar.setBackgroundColor('transparent', true);
    StatusBar.setBarStyle('dark-content', true);
    
    // For Android 15+, edge-to-edge is handled by the system
    // when edgeToEdgeEnabled is true in app.json
    // No deprecated APIs needed
  }
};
