// components/ProfessionalSplashScreen.tsx
// Lottie animation as fullscreen splash screen element

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface ProfessionalSplashScreenProps {
  onAnimationComplete?: () => void;
  isAppReady?: boolean;
}

function ProfessionalSplashScreen(props: ProfessionalSplashScreenProps) {
  const { onAnimationComplete, isAppReady = false } = props;
  
  const animationOpacity = useRef(new Animated.Value(0)).current;
  const animationScale = useRef(new Animated.Value(0.95)).current;

  // Main lightning animation ref
  const lightningAnimation = useRef<LottieView>(null);

  const [animationReady, setAnimationReady] = useState(false);

  // Complete splash when both animation and app are ready
  useEffect(() => {
    if (animationReady && isAppReady) {
      setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 200);
    }
  }, [animationReady, isAppReady, onAnimationComplete]);

  useEffect(() => {
    startAnimation();
    
    // 3-second splash duration
    const minimumSplashTime = 3000;
    
    // Maximum splash duration as safety net
    const maxSplashTime = 4000;
    
    const minTimeout = setTimeout(() => {
      // Minimum splash time reached
    }, minimumSplashTime);

    const maxTimeout = setTimeout(() => {
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, maxSplashTime);

    return () => {
      clearTimeout(minTimeout);
      clearTimeout(maxTimeout);
    };
  }, [onAnimationComplete]);

  const startAnimation = () => {
    // Main animation entrance
    Animated.sequence([
      // Small initial delay
      Animated.delay(200),
      
      // Animation entrance
      Animated.parallel([
        Animated.timing(animationOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(animationScale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
    ]).start(() => {
      // Mark animation as ready after a longer delay for 3-second duration
      setTimeout(() => {
        setAnimationReady(true);
      }, 1000);
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#35297F" barStyle="light-content" />
      
      {/* Fullscreen Main Lightning Animation */}
      <Animated.View
        style={[
          styles.fullscreenAnimationContainer,
          {
            opacity: animationOpacity,
            transform: [{ scale: animationScale }],
          }
        ]}
      >
        <LottieView
          ref={lightningAnimation}
          source={require('../assets/animations/Splash-Screen.json')}
          style={styles.fullscreenAnimation}
          autoPlay={true}
          loop={true}
          speed={1.0}
          resizeMode="cover"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#35297F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenAnimationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenAnimation: {
    width: width,
    height: height,
  },
});

export default ProfessionalSplashScreen;