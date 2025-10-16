import React from 'react';
import {
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
  console.log('ProviderSelectionModal rendered with visible:', visible);
  
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

  const renderProviderOption = ({ item }: { item: ElectricityProvider }) => (
    <TouchableOpacity
      style={styles.providerOptionItem}
      onPress={() => handleProviderSelect(item)}
    >
      <View style={styles.providerOptionLeft}>
        <View style={styles.providerIcon}>
          <Image source={item.icon} style={styles.providerIconImage} />
        </View>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{item.name}</Text>
          {item.region && (
            <Text style={styles.providerRegion}>{item.region}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

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
                <Text style={styles.modalTitle}>Choose provider</Text>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={providers}
                renderItem={renderProviderOption}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={styles.providerList}
                style={styles.scrollableList}
              />
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
    height: '50%' 
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
  providerRegion: { 
    fontFamily: Typography.regular, 
    fontSize: 12, 
    color: Colors.text.secondary 
  },
});

export default ProviderSelectionModal;