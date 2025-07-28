import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Image,
  StatusBar
} from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';

// Import betting provider icons
import Bet9jaIcon from '../components/icons/bet9ja.jpeg';
import BetkingIcon from '../components/icons/betking.jpeg';
import BetwayIcon from '../components/icons/betway.png';
import OnexbetIcon from '../components/icons/1xbet.png';
import LivescoreBetIcon from '../components/icons/livescore.png';
import NaijaBetIcon from '../components/icons/naijabet.jpeg';
import MsportIcon from '../components/icons/msport.png';
import MerryBetIcon from '../components/icons/merrybet.png';
import NairaBetIcon from '../components/icons/nairabet.png';
import BangBetIcon from '../components/icons/bangbet.png';
import BetLandIcon from '../components/icons/betland.png';
import BetLionIcon from '../components/icons/betlion.png';
import CloudBetIcon from '../components/icons/cloudbet.png';
import SupaBetIcon from '../components/icons/supabet.png';

interface BettingProvider {
  id: string;
  name: string;
  icon: any;
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
  const providers: BettingProvider[] = [
    { id: 'bet9ja', name: 'Bet9ja', icon: Bet9jaIcon },
    { id: 'betking', name: 'BetKing', icon: BetkingIcon },
    { id: 'betway', name: 'BetWay', icon: BetwayIcon },
    { id: '1xbet', name: '1xBet', icon: OnexbetIcon },
    { id: 'livescorebet', name: 'LiveScoreBet', icon: LivescoreBetIcon },
    { id: 'naijabet', name: 'NaijaBet', icon: NaijaBetIcon },
    { id: 'msport', name: 'MSport', icon: MsportIcon },
    { id: 'merrybet', name: 'MerryBet', icon: MerryBetIcon },
    { id: 'nairabet', name: 'NairaBet', icon: NairaBetIcon },
    { id: 'bangbet', name: 'BangBet', icon: BangBetIcon },
    { id: 'betland', name: 'BetLand', icon: BetLandIcon },
    { id: 'betlion', name: 'BetLion', icon: BetLionIcon },
    { id: 'cloudbet', name: 'CloudBet', icon: CloudBetIcon },
    { id: 'supabet', name: 'SupaBet', icon: SupaBetIcon }
  ];

  const handleProviderSelect = (provider: BettingProvider) => {
    onSelectProvider(provider);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalWrapper}>
        <SafeAreaView style={styles.container}>
          <StatusBar backgroundColor={Colors.surface} barStyle="dark-content" />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose Betting Provider</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Provider List */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {providers.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={[
                  styles.providerItem,
                  selectedProvider?.id === provider.id && styles.providerItemSelected
                ]}
                onPress={() => handleProviderSelect(provider)}
                activeOpacity={0.8}
              >
                <View style={styles.providerIconContainer}>
                  <Image source={provider.icon} style={styles.providerIcon} resizeMode="contain" />
                </View>
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                </View>
                {selectedProvider?.id === provider.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedCheckmark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    position: 'absolute',
    top: 224,
    left: 1,
    width: 393,
    height: 630,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignSelf: 'center',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  container: { flex: 1, backgroundColor: Colors.surface || '#FFFFFF' },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },
  closeButtonText: { color: Colors.text?.secondary || '#6B7280', fontSize: 16, fontWeight: '500' },

  // Scroll view
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 24 },

  // Provider items
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    minHeight: 72,
  },
  providerItemSelected: { backgroundColor: '#F8F7FF' },

  providerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginRight: 16,
  },
  providerIcon: { width: 32, height: 32 },

  providerInfo: { flex: 1, justifyContent: 'center' },
  providerName: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
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
});

export default BettingProviderSelectionModal;
