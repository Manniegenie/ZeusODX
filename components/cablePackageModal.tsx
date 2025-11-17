import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ImageSourcePropType,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { ms, s } from 'react-native-size-matters';
import { Typography } from '../constants/Typography';
import { useCableTvPackages } from '../hooks/useCabletvpackages';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_WIDTH = SCREEN_WIDTH;

// Import cable TV provider icons
const DstvIcon = require('../components/icons/Dstv.png');
const GotvIcon = require('../components/icons/Gotv.png');
const StarTimesIcon = require('../components/icons/StarTimes.png');
const ShowmaxIcon = require('../components/icons/Showmax.png');
const SearchIcon = require('../components/icons/lens-icon.png');

// Provider icon mapping
const providerIcons: Record<string, ImageSourcePropType> = {
  'dstv': DstvIcon,
  'gotv': GotvIcon,
  'startimes': StarTimesIcon,
  'showmax': ShowmaxIcon,
};

interface CableTvPackage {
  variationId: string;
  variation_id?: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  formattedPrice: string;
  formattedChannels: string;
  channels: number;
  features: string[];
  category: string;
  subscriptionType: string;
  provider: string;
  serviceName: string;
  availability: string;
  originalPackage?: any;
}

interface Provider {
  id: string;
  name: string;
}

interface CablePackageModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPackage: (pkg: CableTvPackage) => void;
  selectedPackage?: CableTvPackage | null;
  provider?: Provider | null;
}

const CablePackageModal: React.FC<CablePackageModalProps> = ({
  visible,
  onClose,
  onSelectPackage,
  selectedPackage,
  provider
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const {
    loading,
    error,
    getCableTvPackages,
    getCachedCableTvPackages,
    searchCableTvPackages,
    getAvailableCategories,
    isLoadingForProvider,
    getUserFriendlyMessage,
    clearErrors
  } = useCableTvPackages();

  const getSafeProperty = useCallback((obj: any, property: string, fallback: any = '') => {
    try {
      if (!obj || typeof obj !== 'object') return fallback;
      return obj[property] ?? fallback;
    } catch (error) {
      console.warn(`Error accessing property ${property}:`, error);
      return fallback;
    }
  }, []);

  const debugPackageData = useCallback((packages: any[]) => {
    if (packages.length > 0) {
      const samplePackage = packages[0];
      console.log('🔍 CablePackageModal - Sample package structure:', {
        samplePackage,
        totalPackages: packages.length,
        variationIdFormats: packages.slice(0, 3).map(pkg => ({
          variationId: getSafeProperty(pkg, 'variationId'),
          variation_id: getSafeProperty(pkg, 'variation_id'),
          id: getSafeProperty(pkg, 'id'),
          name: getSafeProperty(pkg, 'name'),
          price: getSafeProperty(pkg, 'price')
        }))
      });
    }
  }, [getSafeProperty]);

  useEffect(() => {
    if (visible && provider?.id) {
      console.log('🔍 CablePackageModal opened for provider:', provider.id);
      loadPackages();
    }
  }, [visible, provider?.id]);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSelectedCategory('all');
      clearErrors();
    }
  }, [visible, clearErrors]);

  const loadPackages = async () => {
    if (!provider?.id) return;
    
    try {
      console.log('📦 Loading packages for provider:', provider.id);
      const result = await getCableTvPackages(provider.id);
      
      if (result.success) {
        console.log('✅ Packages loaded successfully for:', provider.id);
      } else if (result.error) {
        console.error('❌ Failed to load packages:', result.error, result.message);
        
        if (['NETWORK_ERROR', 'SERVICE_ERROR', 'INVALID_SERVICE_ID'].includes(result.error)) {
          Alert.alert(
            'Error Loading Packages',
            getUserFriendlyMessage(result.error, result.message),
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Retry', onPress: loadPackages }
            ]
          );
        }
      }
    } catch (err) {
      console.error('Error loading cable TV packages:', err);
      Alert.alert(
        'Error',
        'Failed to load cable TV packages. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: loadPackages }
        ]
      );
    }
  };

  const getFilteredPackages = useCallback((): CableTvPackage[] => {
    if (!provider?.id) return [];
    
    let packages = getCachedCableTvPackages(provider.id);
    
    if (packages.length > 0) {
      debugPackageData(packages);
    }
    
    if (searchQuery.trim()) {
      packages = searchCableTvPackages(provider.id, searchQuery);
    }
    
    if (selectedCategory !== 'all') {
      packages = packages.filter(pkg => pkg.category === selectedCategory);
    }
    
    packages.sort((a, b) => a.price - b.price);
    
    return packages;
  }, [provider?.id, searchQuery, selectedCategory, getCachedCableTvPackages, searchCableTvPackages, debugPackageData]);

  const handlePackageSelect = useCallback((pkg: any) => {
    console.log('📦 Raw package selected in modal:', pkg);
    
    if (!pkg) {
      console.error('Package is null or undefined');
      Alert.alert(
        'Invalid Package',
        'No package data received. Please try selecting another package.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const extractVariationId = () => {
        const candidates = [
          getSafeProperty(pkg, 'variationId'),
          getSafeProperty(pkg, 'variation_id'),
          getSafeProperty(pkg, 'id'),
          getSafeProperty(pkg, 'originalData.variationId'),
          getSafeProperty(pkg, 'originalData.variation_id'),
          getSafeProperty(pkg, 'originalData.id')
        ];
        
        for (const candidate of candidates) {
          if (candidate && typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
          }
          if (typeof candidate === 'number' && candidate > 0) {
            return candidate.toString();
          }
        }
        
        return null;
      };

      const variationId = extractVariationId();

      console.log('🔍 Variation ID extraction results:', {
        variationId,
        available_fields: {
          variationId: getSafeProperty(pkg, 'variationId'),
          variation_id: getSafeProperty(pkg, 'variation_id'),
          id: getSafeProperty(pkg, 'id'),
          originalData: pkg.originalData ? 'Present' : 'Missing'
        }
      });

      if (!variationId) {
        console.error('❌ No variation_id found in package:', pkg);
        Alert.alert(
          'Invalid Package',
          'Selected package is missing required identification. Please try selecting another package.',
          [{ text: 'OK' }]
        );
        return;
      }

      const extractSafeString = (value: any, fallback: string = ''): string => {
        if (value === null || value === undefined) return fallback;
        return typeof value === 'string' ? value : String(value);
      };

      const extractSafeNumber = (value: any, fallback: number = 0): number => {
        if (value === null || value === undefined) return fallback;
        const num = typeof value === 'number' ? value : parseFloat(value);
        return isNaN(num) ? fallback : num;
      };

      const extractSafeArray = (value: any, fallback: any[] = []): any[] => {
        if (Array.isArray(value)) return value;
        return fallback;
      };

      const normalizedPackage: CableTvPackage = {
        variationId: variationId,
        variation_id: variationId,
        id: variationId,
        
        name: extractSafeString(
          getSafeProperty(pkg, 'name') || 
          getSafeProperty(pkg, 'package_bouquet') || 
          getSafeProperty(pkg, 'description')
        ) || 'Unknown Package',
        
        description: extractSafeString(
          getSafeProperty(pkg, 'description') || 
          getSafeProperty(pkg, 'package_bouquet') || 
          getSafeProperty(pkg, 'name')
        ),
        
        price: extractSafeNumber(getSafeProperty(pkg, 'price')),
        
        formattedPrice: extractSafeString(
          getSafeProperty(pkg, 'formattedPrice') || 
          getSafeProperty(pkg, 'price_formatted')
        ) || `₦${extractSafeNumber(getSafeProperty(pkg, 'price')).toLocaleString()}`,
        
        formattedChannels: extractSafeString(
          getSafeProperty(pkg, 'formattedChannels')
        ) || `${extractSafeNumber(getSafeProperty(pkg, 'channels'), 0)}+ channels`,
        
        channels: extractSafeNumber(getSafeProperty(pkg, 'channels'), 0),
        
        features: extractSafeArray(getSafeProperty(pkg, 'features')),
        
        category: extractSafeString(
          getSafeProperty(pkg, 'category'), 'standard'
        ),
        
        subscriptionType: extractSafeString(
          getSafeProperty(pkg, 'subscriptionType') || 
          getSafeProperty(pkg, 'duration'), '1 Month'
        ),
        
        provider: extractSafeString(
          getSafeProperty(pkg, 'provider') || 
          getSafeProperty(pkg, 'service_id'), provider?.id || ''
        ),
        
        serviceName: extractSafeString(
          getSafeProperty(pkg, 'serviceName') || 
          getSafeProperty(pkg, 'service_name'), provider?.name || ''
        ),
        
        availability: extractSafeString(
          getSafeProperty(pkg, 'availability'), 'available'
        ),
        
        originalPackage: pkg
      };

      if (normalizedPackage.price <= 0) {
        console.error('❌ Invalid price in package:', pkg);
        Alert.alert(
          'Invalid Package',
          'Selected package has invalid pricing. Please try selecting another package.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (!normalizedPackage.name || normalizedPackage.name === 'Unknown Package') {
        console.warn('⚠️ Package has no proper name:', pkg);
      }

      console.log('📦 Normalized package being sent to parent:', {
        variationId: normalizedPackage.variationId,
        variation_id: normalizedPackage.variation_id,
        name: normalizedPackage.name,
        price: normalizedPackage.price,
        formattedPrice: normalizedPackage.formattedPrice,
        provider: normalizedPackage.provider,
        originalPackage: '[Original Package Object]'
      });

      if (typeof onSelectPackage === 'function') {
        onSelectPackage(normalizedPackage);
        setSearchQuery('');
        setSelectedCategory('all');
      } else {
        console.warn('onSelectPackage prop is not provided or is not a function');
        Alert.alert(
          'Selection Error',
          'Unable to select package. Please try again.',
          [{ text: 'OK' }]
        );
      }

    } catch (error) {
      console.error('❌ Error in handlePackageSelect:', error);
      Alert.alert(
        'Selection Error',
        'An error occurred while selecting the package. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [getSafeProperty, onSelectPackage, provider]);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    onClose();
  }, [onClose]);

  const filteredPackages = getFilteredPackages();
  const availableCategories = provider?.id ? getAvailableCategories(provider.id) : [];
  const isProviderLoading = provider?.id ? isLoadingForProvider(provider.id) : false;

  const renderCategoryFilter = () => {
    if (availableCategories.length <= 1) return null;

    const categories = [
      { id: 'all', name: 'All Packages' },
      ...availableCategories.map(cat => ({
        id: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1)
      }))
    ];

    return (
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipSelected
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category.id && styles.categoryChipTextSelected
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.loadingText}>Loading {provider?.name} packages...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Unable to Load Packages</Text>
      <Text style={styles.errorMessage}>
        {error ? getUserFriendlyMessage(error) : 'Something went wrong'}
      </Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={loadPackages}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPackageFeatures = (features: string[]) => {
    if (features.length === 0) return null;
    
    return (
      <View style={styles.featuresContainer}>
        {features.slice(0, 2).map((feature, index) => (
          <View key={index} style={styles.featureChip}>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
        {features.length > 2 && (
          <Text style={styles.moreFeatures}>+{features.length - 2} more</Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Choose Package</Text>
                  {provider && (
                    <Text style={styles.providerSubtitle}>{provider.name}</Text>
                  )}
                </View>
                <TouchableOpacity 
                  onPress={handleClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Image source={SearchIcon} style={styles.searchIcon} resizeMode="contain" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search packages..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    editable={!isProviderLoading}
                  />
                </View>
              </View>

              {/* Category Filter */}
              {renderCategoryFilter()}

              {/* Content */}
              {isProviderLoading ? (
                renderLoadingState()
              ) : error && filteredPackages.length === 0 ? (
                renderErrorState()
              ) : (
                <ScrollView 
                  style={styles.packagesContainer} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.packagesContent}
                >
                  {filteredPackages.length > 0 ? (
                    filteredPackages.map((pkg) => {
                      const packageKey = pkg.variationId || 
                                        pkg.variation_id || 
                                        pkg.id || 
                                        `pkg-${pkg.name}-${pkg.price}`;
                      
                      return (
                        <TouchableOpacity
                          key={packageKey}
                          style={[
                            styles.packageOption,
                            selectedPackage?.variationId === pkg.variationId && styles.packageOptionSelected
                          ]}
                          onPress={() => handlePackageSelect(pkg)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.packageIconContainer}>
                            <Image 
                              source={providerIcons[provider?.id || 'dstv']}
                              style={styles.packageProviderIcon}
                              resizeMode="contain"
                            />
                          </View>
                          
                          <View style={styles.packageDetails}>
                            <Text style={styles.packageName}>{pkg.name}</Text>
                            <Text style={styles.packageChannels}>{pkg.formattedChannels}</Text>
                            {renderPackageFeatures(pkg.features)}
                          </View>
                          
                          <View style={styles.packagePriceContainer}>
                            <Text style={styles.packagePrice}>{pkg.formattedPrice}</Text>
                            <Text style={styles.packageSubscription}>{pkg.subscriptionType}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>
                        {searchQuery.trim() 
                          ? `No packages found for "${searchQuery}"` 
                          : 'No packages available'
                        }
                      </Text>
                      {searchQuery.trim() && (
                        <TouchableOpacity 
                          style={styles.clearSearchButton}
                          onPress={() => setSearchQuery('')}
                        >
                          <Text style={styles.clearSearchText}>Clear search</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </ScrollView>
              )}
              
              {/* Bottom Safe Area */}
              <SafeAreaView style={styles.bottomSafeArea} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContainer: {
    width: MODAL_WIDTH,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: s(16),
    borderTopRightRadius: s(16),
    position: 'absolute',
    top: 150,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ms(20),
    paddingTop: 20,
    paddingBottom: 16,
  },
  
  titleContainer: {
    flex: 1,
  },
  
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Typography.medium || 'System',
  },
  
  providerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    marginTop: 2,
  },
  
  closeButton: {
    padding: ms(4),
  },
  
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  searchContainer: {
    paddingHorizontal: ms(20),
    paddingBottom: 16,
  },
  
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: s(8),
    paddingHorizontal: ms(12),
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  searchIcon: {
    width: s(16),
    height: 16,
    marginRight: ms(8),
    tintColor: '#9CA3AF',
  },
  
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontFamily: Typography.regular || 'System',
  },
  
  categoryContainer: {
    paddingBottom: 16,
  },
  
  categoryScrollContent: {
    paddingHorizontal: ms(20),
  },
  
  categoryChip: {
    paddingHorizontal: ms(12),
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: s(16),
    marginRight: ms(8),
  },
  
  categoryChipSelected: {
    backgroundColor: '#6366F1',
  },
  
  categoryChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    marginTop: 12,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ms(40),
    paddingVertical: 40,
  },
  
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  
  retryButton: {
    paddingHorizontal: ms(20),
    paddingVertical: ms(10),
    backgroundColor: '#6366F1',
    borderRadius: s(8),
  },
  
  retryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    fontFamily: Typography.medium || 'System',
  },
  
  packagesContainer: {
    flex: 1,
    paddingHorizontal: ms(20),
  },
  
  packagesContent: {
    paddingBottom: 20,
  },
  
  packageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  
  packageOptionSelected: {
    backgroundColor: '#F8F7FF',
    borderRadius: 8,
    marginHorizontal: -10,
    paddingHorizontal: 10,
    borderBottomColor: 'transparent',
  },
  
  packageIconContainer: {
    width: s(32),
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ms(12),
    backgroundColor: '#F9FAFB',
    borderRadius: s(6),
  },
  
  packageProviderIcon: {
    width: s(20),
    height: 20,
  },
  
  packageDetails: {
    flex: 1,
  },
  
  packageName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    fontFamily: 'Bricolage Grotesque',
    lineHeight: 18,
    marginBottom: 2,
  },
  
  packageChannels: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    marginBottom: 4,
  },
  
  featuresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  
  featureChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#EEF2FF',
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 2,
  },
  
  featureText: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '500',
  },
  
  moreFeatures: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  
  packagePriceContainer: {
    alignItems: 'flex-end',
  },
  
  packagePrice: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    fontFamily: 'Bricolage Grotesque',
    lineHeight: 18,
  },
  
  packageSubscription: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    marginTop: 1,
  },
  
  noResultsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  
  noResultsText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    textAlign: 'center',
    marginBottom: 12,
  },
  
  clearSearchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  
  clearSearchText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  bottomSafeArea: {
    backgroundColor: '#FFFFFF',
  },
});

export default CablePackageModal;