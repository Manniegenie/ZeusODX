// components/ProfessionalSplashScreen.tsx
// Reduced to 2-second splash with single red lightning animation

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
      }, 200); // Reduced delay for smooth transition
    }
  }, [animationReady, isAppReady, onAnimationComplete]);

  useEffect(() => {
    startAnimation();
    
    // ✅ REDUCED: 2-second splash duration
    const minimumSplashTime = 2000; // Reduced from 3000ms
    
    // ✅ REDUCED: Maximum splash duration as safety net
    const maxSplashTime = 3000; // Reduced from 8000ms
    
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
    // ✅ FASTER: Background pulse with shorter duration
    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundPulse, {
          toValue: 1.02,
          duration: 1500, // Reduced from 3000ms
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(backgroundPulse, {
          toValue: 1,
          duration: 1500, // Reduced from 3000ms
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ✅ FASTER: Start lightning immediately
    setTimeout(() => {
      setShowLightning(true);
    }, 100); // Reduced from 200ms

    // ✅ FASTER: Main logo animation sequence
    Animated.sequence([
      // ✅ REDUCED: Smaller initial delay
      Animated.delay(150), // Reduced from 400ms
      
      // ✅ FASTER: Logo entrance
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500, // Reduced from 800ms
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 120, // Increased for faster spring
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      
    ]).start(() => {
      // ✅ FASTER: Mark animation as ready much sooner
      setTimeout(() => {
        setAnimationReady(true);
      }, 500); // Reduced from 1500ms
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
            speed={1.5} // ✅ FASTER: Increased speed for quicker animation
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