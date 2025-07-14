import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image
} from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { useRouter } from 'expo-router';

interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  icon: string;
}

interface CryptoAssetListProps {
  showHeader?: boolean;
  maxItems?: number;
  onAssetPress?: (asset: CryptoAsset) => void;
}

export default function CryptoAssetList({ 
  showHeader = false, 
  maxItems,
  onAssetPress 
}: CryptoAssetListProps) {
  const router = useRouter();

  const cryptoAssets: CryptoAsset[] = [
    {
      id: 'btc',
      name: 'Bitcoin',
      symbol: 'BTC',
      price: '108,054.64 USD',
      change: '+2.32%',
      isPositive: true,
      icon: '../../components/icons/bitcoin.png'
    },
    {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      price: '3,384.44 USD',
      change: '+1.10%',
      isPositive: true,
      icon: '../components/icons/ethereum.png'
    },
    {
      id: 'usdt',
      name: 'USD Tether',
      symbol: 'USDT',
      price: '1 USD',
      change: '0%',
      isPositive: true,
      icon: '../components/icons/usdt.png'
    },
    {
      id: 'ngn',
      name: 'Nigeria Naira',
      symbol: 'NGN',
      price: '1,600NGN',
      change: '0%',
      isPositive: true,
      icon: '../components/icons/naira.png'
    },
    {
      id: 'sol',
      name: 'Solana',
      symbol: 'SOL',
      price: '145.05 USD',
      change: '+5.23%',
      isPositive: true,
      icon: '../components/icons/solana.png'
    },
    {
      id: 'bsc',
      name: 'Binance Smart Chain',
      symbol: 'BSC/BNB',
      price: '700.68 USD',
      change: '+1.45%',
      isPositive: true,
      icon: '../components/icons/bnb.png'
    },
    {
      id: 'matic',
      name: 'Matic',
      symbol: 'MATIC',
      price: '0.45 USD',
      change: '-2.10%',
      isPositive: false,
      icon: '../components/icons/matic.png'
    },
    {
      id: 'xrp',
      name: 'XRP',
      symbol: 'XRP',
      price: '2.12 USD',
      change: '+4.56%',
      isPositive: true,
      icon: '../components/icons/xrp.png'
    },
    {
      id: 'ada',
      name: 'ADA',
      symbol: 'ADA',
      price: '0.9499 USD',
      change: '+1.32%',
      isPositive: true,
      icon: '../components/icons/ada.png'
    },
    {
      id: 'doge',
      name: 'Dogecoin',
      symbol: 'DOGE',
      price: '0.3843 USD',
      change: '+7.45%',
      isPositive: true,
      icon: '../components/icons/doge.png'
    },
    {
      id: 'ton',
      name: 'Ton',
      symbol: 'TON',
      price: '5.24 USD',
      change: '+3.21%',
      isPositive: true,
      icon: '../components/icons/ton.png'
    },
    {
      id: 'ltc',
      name: 'Litecoin',
      symbol: 'LTC',
      price: '99.12 USD',
      change: '+0.85%',
      isPositive: true,
      icon: '../components/icons/litecoin.png'
    },
    {
      id: 'avax',
      name: 'Avalanche',
      symbol: 'AVAX',
      price: '42.56 USD',
      change: '+2.14%',
      isPositive: true,
      icon: '../components/icons/avalanche.png'
    },
    {
      id: 'usdc',
      name: 'USDC',
      symbol: 'USDC(ERC20)',
      price: '0.9999 USD',
      change: '+0.01%',
      isPositive: true,
      icon: '../components/icons/usdc.png'
    }
  ];

  // Limit items if maxItems is specified
  const displayAssets = maxItems ? cryptoAssets.slice(0, maxItems) : cryptoAssets;

  const handleAssetPress = (asset: CryptoAsset) => {
    if (onAssetPress) {
      onAssetPress(asset);
    } else {
      router.push(`/trading/${asset.id}`);
    }
  };

  const renderAssetItem = ({ item }: { item: CryptoAsset }) => (
    <TouchableOpacity 
      style={styles.assetItem} 
      onPress={() => handleAssetPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.assetLeft}>
        <View style={styles.iconContainer}>
          {/* Placeholder for crypto icon - replace with actual icons */}
          <View style={styles.iconPlaceholder}>
            <Text style={styles.iconText}>{item.symbol.charAt(0)}</Text>
          </View>
        </View>
        <View style={styles.assetInfo}>
          <Text style={styles.assetName}>{item.name}</Text>
          <Text style={styles.assetSymbol}>{item.symbol}</Text>
        </View>
      </View>
      
      <View style={styles.assetRight}>
        <Text style={styles.assetPrice}>{item.price}</Text>
        <Text style={[
          styles.assetChange,
          item.isPositive ? styles.positiveChange : styles.negativeChange
        ]}>
          {item.change}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Trade Coins</Text>
            <Text style={styles.subtitle}>
              Select any of the crypto assets to deposit{'\n'}and convert to cash instantly
            </Text>
          </View>
          
          {/* User Avatar with Image */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>JU</Text>
            </View>
            <Image 
              source={require('../assets/images/whatsappicon.png')} // Replace with your image
              style={styles.speechBubbleImage}
              resizeMode="contain"
            />
          </View>
        </View>
      )}

      {/* Assets List - Always Scrollable */}
      <FlatList
        data={displayAssets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        style={styles.flatList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontFamily: Typography.bold,
    fontSize: 24,
    lineHeight: 28,
    color: Colors.primaryText,
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.surface,
    fontFamily: Typography.medium,
    fontSize: 14,
  },
  speechBubbleImage: {
    position: 'absolute',
    top: -40,
    width: 100,
    height: 40,
  },
  flatList: {
    flex: 1,
  },
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: Layout.spacing.md,
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: Colors.surface,
    fontFamily: Typography.bold,
    fontSize: 16,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  assetSymbol: {
    fontFamily: Typography.regular,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetPrice: {
    fontFamily: Typography.medium,
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  assetChange: {
    fontFamily: Typography.regular,
    fontSize: 14,
  },
  positiveChange: {
    color: '#4CAF50',
  },
  negativeChange: {
    color: '#F44336',
  },
});