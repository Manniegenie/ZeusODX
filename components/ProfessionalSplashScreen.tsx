// components/ProfessionalSplashScreen.tsx
// Simplified splash with single red lightning animation

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import LottieView from 'lottie-react-native';

const appLogo = require('../components/icons/logo.png');
const { width, height } = Dimensions.get('window');

interface ProfessionalSplashScreenProps {
  onAnimationComplete?: () => void;
  isAppReady?: boolean;
}

function ProfessionalSplashScreen(props: ProfessionalSplashScreenProps) {
  const { onAnimationComplete, isAppReady = false } = props;
  
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const backgroundPulse = useRef(new Animated.Value(1)).current;

  // Single lightning animation ref
  const lightningAnimation = useRef<LottieView>(null);

  const [showLightning, setShowLightning] = useState(false);
  const [animationReady, setAnimationReady] = useState(false);

  // Complete splash when both animation and app are ready
  useEffect(() => {
    if (animationReady && isAppReady) {
      setTimeout(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 500); // Small delay for smooth transition
    }
  }, [animationReady, isAppReady, onAnimationComplete]);

  useEffect(() => {
    startAnimation();
    
    // Minimum splash duration for good UX (even if loading finishes early)
    const minimumSplashTime = 3000;
    
    // Maximum splash duration as safety net
    const maxSplashTime = 8000;
    
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
    // Background pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundPulse, {
          toValue: 1.02,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(backgroundPulse, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Start lightning early - even before logo
    setTimeout(() => {
      setShowLightning(true);
    }, 200); // Lightning starts after just 200ms

    // Main logo animation sequence
    Animated.sequence([
      // Small initial delay
      Animated.delay(400),
      
      // Phase 1: Logo entrance (now happens with lightning already playing)
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
    ]).start(() => {
      // Mark animation as ready after logo entrance completes
      setTimeout(() => {
        setAnimationReady(true);
      }, 1500); // Reduced from 2500ms since lightning started earlier
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#35297F" barStyle="light-content" />
      
      {/* Background */}
      <Animated.View 
        style={[
          styles.background,
          {
            transform: [{ scale: backgroundPulse }]
          }
        ]}
      />

      {/* Logo with enhanced glow */}
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }
          ]}
        >
          <View style={styles.logo}>
            <Image 
              source={appLogo} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
      </View>

      {/* Red lightning animation */}
      {showLightning && (
        <View style={styles.lightningContainer}>
          <LottieView
            ref={lightningAnimation}
            source={require('../assets/animations/zeus-lightning.json')} // Update this path to match your file
            style={styles.lightning}
            autoPlay={true}
            loop={true}
            speed={1.0}
          />
        </View>
      )}
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
  background: {
    position: 'absolute',
    width: width * 1.5,
    height: height * 1.5,
    backgroundColor: '#2A1F6B',
    borderRadius: width,
    opacity: 0.15,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10, // Above lightning
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15, // Highest priority
  },
  logo: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    // Removed glow effects to fix the issue
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  // Lightning animation styles
  lightningContainer: {
    position: 'absolute',
    width: width,
    height: height,
    left: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Behind the logo
  },
  lightning: {
    width: 300,
    height: 300,
    opacity: 0.8,
  },
});

export default ProfessionalSplashScreen;