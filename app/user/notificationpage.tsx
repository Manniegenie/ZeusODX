import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNotifications } from '../../hooks/usenotification';

// Icons
import backIcon from '../../components/icons/backy.png';

const NotificationScreen = () => {
  const router = useRouter();
  const { clearBadge, setupListeners, removeListeners, isEnabled } = useNotifications();
  
  const [refreshing, setRefreshing] = useState(false);

  // Sample notifications data - replace with your actual API call
  const [notifications, setNotifications] = useState([
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
  ]);

  // Clear badge when screen opens
  useEffect(() => {
    clearBadge();
  }, []);

  // Setup notification listeners while on this screen
  useEffect(() => {
    if (isEnabled) {
      setupListeners(
        // When notification received while on this screen
        (notification) => {
          console.log('📨 Notification received on NotificationScreen:', notification);
          
          // Add the new notification to the top of the list
          const newNotification = {
            id: Date.now(),
            title: notification.request.content.title || 'New Notification',
            message: notification.request.content.body || '',
            subtitle: notification.request.content.data?.subtitle || '',
            date: new Date().toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: '2-digit' 
            }),
            isRead: false,
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          
          // Clear badge since user is viewing notifications
          clearBadge();
        },
        // When notification tapped (shouldn't happen while on this screen, but just in case)
        (response) => {
          console.log('👆 Notification tapped on NotificationScreen:', response);
        }
      );
    }

    // Cleanup listeners when leaving screen
    return () => {
      removeListeners();
    };
  }, [isEnabled]);

  // Mark notification as read
  const handleNotificationPress = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, isRead: true }
          : notif
      )
    );
    
    // Clear badge if all notifications are read
    const allRead = notifications.every(n => n.id === notificationId || n.isRead);
    if (allRead) {
      clearBadge();
    }
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    
    // TODO: Replace with your actual API call to fetch notifications
    // Example:
    // try {
    //   const response = await fetch('YOUR_API_ENDPOINT/notifications');
    //   const data = await response.json();
    //   setNotifications(data);
    // } catch (error) {
    //   console.error('Error fetching notifications:', error);
    // }
    
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      clearBadge();
    }, 1000);
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.notificationCard} 
      activeOpacity={0.8}
      onPress={() => handleNotificationPress(item.id)}
    >
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

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateMessage}>
        You're all caught up! We'll notify you when something new happens.
      </Text>
    </View>
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
            <Image source={backIcon} style={styles.backIcon} />
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
            contentContainerStyle={[
              styles.listContainer,
              notifications.length === 0 && styles.emptyListContainer
            ]}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#35297F"
                colors={['#35297F']}
              />
            }
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
    width: 40,
    height: 40,
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 20,
  },
  backIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
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
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationScreen;