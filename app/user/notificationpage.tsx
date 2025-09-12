import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';

const NotificationScreen = () => {
  const router = useRouter();

  // Sample notifications data - replace with your actual data
  const notifications = [
    {
      id: 1,
      title: "TGIF. Let the weekend flex begin",
      message: "Bring your crypto, we'll bring the best rates and instant payout.",
      subtitle: "Sounds like a fair trade, right?",
      date: "Fri June 06 2025",
      isRead: false,
    },
    {
      id: 2,
      title: "Transaction Completed",
      message: "Your crypto exchange has been processed successfully.",
      subtitle: "Check your wallet for the updated balance.",
      date: "Thu June 05 2025",
      isRead: true,
    },
    {
      id: 3,
      title: "Market Alert",
      message: "Bitcoin has reached a new milestone! Great time to trade.",
      subtitle: "Don't miss out on this opportunity.",
      date: "Wed June 04 2025",
      isRead: false,
    },
  ];

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity style={styles.notificationCard} activeOpacity={0.8}>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        
        <Text style={styles.notificationMessage}>{item.message}</Text>
        
        {item.subtitle && (
          <Text style={styles.notificationSubtitle}>{item.subtitle}</Text>
        )}
        
        <Text style={styles.notificationDate}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#F3F2FF" barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()} 
            activeOpacity={0.7}
            delayPressIn={0}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Notifications List */}
        <View style={styles.content}>
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F2FF',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  backButton: {
    width: 48,  // Increased from 40
    height: 48, // Increased from 40
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.02)', // Very subtle background instead of transparent
    overflow: 'hidden', // Better Android performance
  },
  backButtonText: {
    fontSize: 20,
    color: '#1F2937',
    fontWeight: '500',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 18,
    fontWeight: '600',
    color: '#35297F',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  headerSpacer: {
    width: 48, // Updated to match new back button width
    height: 48, // Updated to match new back button height
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#35297F',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    lineHeight: 18,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#35297F',
    marginLeft: 8,
    marginTop: 6,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  notificationDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default NotificationScreen;