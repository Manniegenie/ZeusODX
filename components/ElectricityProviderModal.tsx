import React from 'react';
import {
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import BaseModal from './ui/BaseModal';

// Import provider icons
// @ts-ignore
import AbaIcon from './icons/Aba.png';
// @ts-ignore
import AbujaceIcon from './icons/Abuja.png';
// @ts-ignore
import BeninIcon from './icons/Benin.png';
// @ts-ignore
import EkoIcon from './icons/Eko.png';
// @ts-ignore
import EnuguIcon from './icons/Enugu.png';
// @ts-ignore
import IbadanIcon from './icons/Ibadan.png';
// @ts-ignore
import IkejaIcon from './icons/Ikeja.png';
// @ts-ignore
import JosIcon from './icons/Jos.png';
// @ts-ignore
import KadunaIcon from './icons/Kaduna.png';
// @ts-ignore
import PortharcourIcon from './icons/Port-Harcourt.png';
// @ts-ignore
import KanoIcon from './icons/Kano.png';
// @ts-ignore
import YolaIcon from './icons/Yola.png';

interface ElectricityProvider {
  id: string;
  name: string;
  icon: any;
  region?: string;
}

interface ProviderSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectProvider: (provider: ElectricityProvider) => void;
  selectedProvider?: ElectricityProvider | null;
}

const ProviderSelectionModal: React.FC<ProviderSelectionModalProps> = ({
  visible,
  onClose,
  onSelectProvider,
  selectedProvider
}) => {
  // Provider list with icons
  const providers: ElectricityProvider[] = [
    { id: 'aba-electric', name: 'Aba Electricity', icon: AbaIcon, region: 'Abia' },
    { id: 'abuja-electric', name: 'Abuja Electricity', icon: AbujaceIcon, region: 'FCT' },
    { id: 'benin-electric', name: 'Benin Electricity', icon: BeninIcon, region: 'Edo' },
    { id: 'eko-electric', name: 'Eko Electricity', icon: EkoIcon, region: 'Lagos' },
    { id: 'enugu-electric', name: 'Enugu Electricity', icon: EnuguIcon, region: 'Enugu' },
    { id: 'ibadan-electric', name: 'Ibadan Electricity', icon: IbadanIcon, region: 'Oyo' },
    { id: 'ikeja-electric', name: 'Ikeja Electric', icon: IkejaIcon, region: 'Lagos' },
    { id: 'jos-electric', name: 'Jos Electricity', icon: JosIcon, region: 'Plateau' },
    { id: 'kaduna-electric', name: 'Kaduna Electricity', icon: KadunaIcon, region: 'Kaduna' },
    { id: 'kano-electric', name: 'Kano Electricity', icon: KanoIcon, region: 'Kano' },
    { id: 'kedco-electric', name: 'Kedco Electricity', icon: KanoIcon, region: 'Kano' },
    { id: 'portharcourt-electric', name: 'Port Harcourt Electricity', icon: PortharcourIcon, region: 'Rivers' },
    { id: 'yola-electric', name: 'Yola Electricity', icon: YolaIcon, region: 'Adamawa' }
  ];

  const handleProviderSelect = (provider: ElectricityProvider) => {
    onSelectProvider(provider);
    onClose();
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      type="bottom"
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose provider</Text>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
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
                <Image 
                  source={provider.icon} 
                  style={styles.providerIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                {provider.region && (
                  <Text style={styles.providerRegion}>{provider.region}</Text>
                )}
              </View>
              {selectedProvider?.id === provider.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedCheckmark}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    maxHeight: '80%',
  },
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
  closeButtonText: {
    color: Colors.text?.secondary || '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
    minHeight: 72,
  },
  providerItemSelected: {
    backgroundColor: '#F8F7FF',
  },
  providerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginRight: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  providerIcon: {
    width: 32,
    height: 32,
  },
  providerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  providerName: {
    color: Colors.text?.primary || '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  providerRegion: {
    color: Colors.text?.secondary || '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
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
  selectedCheckmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ProviderSelectionModal;