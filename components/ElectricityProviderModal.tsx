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

// Import provider icons
import AbaIcon from '../components/icons/Aba.png';
import AbujaceIcon from '../components/icons/Abuja.png';
import BeninIcon from '../components/icons/Benin.png';
import EkoIcon from '../components/icons/Eko.png';
import EnuguIcon from '../components/icons/Enugu.png';
import IbadanIcon from '../components/icons/Ibadan.png';
import IkejaIcon from '../components/icons/Ikeja.png';
import JosIcon from '../components/icons/Jos.png';
import KadunaIcon from '../components/icons/Kaduna.png';
import PortharcourIcon from '../components/icons/Port-Harcourt.png';
import KanoIcon from '../components/icons/Kano.png';
import YolaIcon from '../components/icons/Yola.png';

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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalWrapper}>
        <SafeAreaView style={styles.container}>
          <StatusBar backgroundColor={Colors.surface} barStyle="dark-content" />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose provider</Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              activeOpacity={0.7}
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
    opacity: 1,
    alignSelf: 'center',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.surface || '#FFFFFF',
  },
  
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
  closeButtonText: {
    color: Colors.text?.secondary || '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },

  // Scroll view styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Provider item styles
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
  
  // Provider icon styles
  providerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    marginRight: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  providerIcon: {
    width: 32,
    height: 32,
  },

  // Provider info styles
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

  // Selected indicator styles
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
