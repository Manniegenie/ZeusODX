import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { Typography } from '../constants/Typography';
import { useBetting } from '../hooks/useBetting';
import DefaultBettingIcon from './DefaultBettingIcon';

// Import betting provider icons (fallback) - these may not exist
// @ts-ignore
import Bet9jaIcon from '../components/icons/bet9ja.jpeg';
// @ts-ignore
import BetkingIcon from '../components/icons/betking.jpeg';
// @ts-ignore
import BetwayIcon from '../components/icons/betway.png';
// @ts-ignore
import OnexbetIcon from '../components/icons/1xbet.png';
// @ts-ignore
import LivescoreBetIcon from '../components/icons/livescore.png';
// @ts-ignore
import NaijaBetIcon from '../components/icons/naijabet.jpeg';
// @ts-ignore
// @ts-ignore
import MerryBetIcon from '../components/icons/merrybet.png';
// @ts-ignore
import NairaBetIcon from '../components/icons/nairabet.png';
// @ts-ignore
import BangBetIcon from '../components/icons/bangbet.png';
// @ts-ignore
import BetLandIcon from '../components/icons/betland.png';
// @ts-ignore
import BetLionIcon from '../components/icons/betlion.png';
// @ts-ignore
import CloudBetIcon from '../components/icons/cloudbet.png';
// @ts-ignore
import SupaBetIcon from '../components/icons/supabet.png';

interface BettingProvider {
  id: string;
  name: string;
  displayName: string;
  slug: string;
  category: string;
  logo?: string;
  hasLogo: boolean;
  icon?: any; // For fallback icons
}

interface BettingProviderSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectProvider: (provider: BettingProvider) => void;
  selectedProvider?: BettingProvider | null;
}

const BettingProviderSelectionModal: React.FC<BettingProviderSelectionModalProps> = ({
  visible,
  onClose,
  onSelectProvider,
  selectedProvider
}) => {
  const { getBettingProviders, getStaticBettingProviders } = useBetting();
  const [providers, setProviders] = useState<BettingProvider[]>([]);
  const [loading, setLoading] = useState(false);

  // Fallback icon mapping for providers without logos
  const fallbackIcons: { [key: string]: any } = {
    'bet9ja': Bet9jaIcon,
    'betking': BetkingIcon,
    'betway': BetwayIcon,
    '1xbet': OnexbetIcon,
    'livescorebet': LivescoreBetIcon,
    'naijabet': NaijaBetIcon,
    'merrybet': MerryBetIcon,
    'nairabet': NairaBetIcon,
    'bangbet': BangBetIcon,
    'betland': BetLandIcon,
    'betlion': BetLionIcon,
    'cloudbet': CloudBetIcon,
    'supabet': SupaBetIcon
  };

  // Fetch providers when modal opens
  useEffect(() => {
    if (visible) {
      fetchProviders();
    }
  }, [visible]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const fetchedProviders = await getBettingProviders();
      
      console.log('🎰 BettingProviderModal: Fetched providers:', {
        count: fetchedProviders.length,
        providers: fetchedProviders.map(p => ({ id: p.id, name: p.name, slug: p.slug }))
      });
      
      // Add fallback icons to providers
      const providersWithIcons = fetchedProviders.map(provider => ({
        ...provider,
        icon: fallbackIcons[provider.id.toLowerCase()] || null
      }));
      
      console.log('🎰 BettingProviderModal: Providers with icons:', {
        count: providersWithIcons.length,
        providers: providersWithIcons.map(p => ({ id: p.id, name: p.name, hasIcon: !!p.icon }))
      });
      
      // Debug: Check for any filtering or issues
      console.log('🎰 BettingProviderModal: Setting providers state:', {
        count: providersWithIcons.length,
        allProviderIds: providersWithIcons.map(p => p.id),
        allProviderNames: providersWithIcons.map(p => p.name)
      });
      
      setProviders(providersWithIcons);
    } catch (error) {
      console.error('Failed to fetch providers, using fallback:', error);
      // Use static providers as fallback
      const staticProviders = getStaticBettingProviders();
      const providersWithIcons = staticProviders.map(provider => ({
        ...provider,
        icon: fallbackIcons[provider.id.toLowerCase()] || null
      }));
      setProviders(providersWithIcons);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (provider: BettingProvider) => {
    onSelectProvider(provider);
    onClose();
  };

  const renderProviderOption = ({ item }: { item: BettingProvider }) => {
    console.log('🎰 BettingProviderModal: Rendering provider:', {
      id: item.id,
      name: item.name,
      displayName: item.displayName
    });
    
    return (
      <TouchableOpacity
        style={styles.providerOptionItem}
        onPress={() => handleProviderSelect(item)}
      >
        <View style={styles.providerOptionLeft}>
          <View style={styles.providerIcon}>
            {item.hasLogo && item.logo ? (
              <Image 
                source={{ uri: item.logo }} 
                style={styles.providerIconImage} 
                resizeMode="contain" 
              />
            ) : item.icon ? (
              <Image 
                source={item.icon} 
                style={styles.providerIconImage} 
                resizeMode="contain" 
              />
            ) : (
              <DefaultBettingIcon 
                name={item.displayName || item.name} 
                size={40}
              />
            )}
          </View>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{item.displayName || item.name}</Text>
          </View>
        </View>
        {selectedProvider?.id === item.id && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedCheckmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Choose Betting Provider
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Loading providers...</Text>
                </View>
              ) : (
                <>
                  {console.log('🎰 BettingProviderModal: Rendering providers:', {
                    count: providers.length,
                    providers: providers.map(p => ({ id: p.id, name: p.name }))
                  })}
                  <FlatList
                    data={providers}
                    renderItem={renderProviderOption}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={styles.providerList}
                    style={styles.scrollableList}
                    onLayout={() => {
                      console.log('🎰 BettingProviderModal: FlatList onLayout - providers count:', providers.length);
                    }}
                    onContentSizeChange={() => {
                      console.log('🎰 BettingProviderModal: FlatList content size changed - providers count:', providers.length);
                    }}
                  />
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalContent: { 
    backgroundColor: Colors.surface, 
    borderTopLeftRadius: Layout.borderRadius.xl, 
    borderTopRightRadius: Layout.borderRadius.xl, 
    padding: Layout.spacing.lg, 
    height: '85%' 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Layout.spacing.lg 
  },
  modalTitle: { 
    fontFamily: Typography.bold, 
    fontSize: 18, 
    color: Colors.text.primary 
  },
  closeButton: { 
    fontSize: 16, 
    color: Colors.text.secondary, 
    padding: Layout.spacing.sm 
  },
  providerList: { 
    paddingBottom: Layout.spacing.lg 
  },
  scrollableList: { 
    flex: 1 
  },
  providerOptionItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Layout.spacing.md, 
    paddingHorizontal: Layout.spacing.sm, 
    backgroundColor: '#F8F9FA', 
    marginBottom: Layout.spacing.sm, 
    borderRadius: Layout.borderRadius.md 
  },
  providerOptionLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Layout.spacing.md, 
    flex: 1 
  },
  providerIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    overflow: 'hidden' 
  },
  providerIconImage: { 
    width: 40, 
    height: 40, 
    resizeMode: 'cover' 
  },
  providerInfo: { 
    flex: 1 
  },
  providerName: { 
    fontFamily: Typography.medium, 
    fontSize: 14, 
    color: Colors.text.primary 
  },
  providerCategory: { 
    fontFamily: Typography.regular, 
    fontSize: 12, 
    color: Colors.text.secondary 
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#35297F',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  selectedCheckmark: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
  },
});

export default BettingProviderSelectionModal;
