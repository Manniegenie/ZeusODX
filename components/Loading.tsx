import React from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const Loading = () => {
  return (
    <View style={styles.fullScreenOverlay}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999, // For Android
  },
});

export default Loading;
