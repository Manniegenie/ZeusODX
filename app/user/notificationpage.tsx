import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNotifications } from '../../hooks/usenotification';
import { notificationService } from '../../services/notificationApiService';

// Icons
import backIcon from '../../components/icons/backy.png';

interface Notification {
  id: string;
  title: string;
  message: string;
  subtitle?: string | null;
  date: string;
  timestamp: string;
  isRead: boolean;
  type?: string;
  data?: any;
}

const NotificationScreen = () => {
  const router = useRouter();
  const { clearBadge, setupListeners, removeListeners, isEnabled } = useNotifications();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      const response = await notificationService.getNotifications({
        limit: 50,
        skip: 0,
        unreadOnly: false,
      });

      if (response?.success && response?.data) {
        setNotifications(response.data);
      } else {
        setError('Failed to load notifications');
        setNotifications([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
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
    } catch (err) {
      // Silently fail - notification is still marked as read locally
      console.error('Failed to mark notification as read:', err);
    }
  }, [notifications, clearBadge]);

  /**
   * Handle notification press
   */
  const handleNotificationPress = useCallback((notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  }, [markAsRead]);

  /**
   * Pull to refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(true);
    clearBadge();
  }, [fetchNotifications, clearBadge]);

  // Fetch notifications on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  // Clear badge when screen opens
  useEffect(() => {
    clearBadge();
  }, [clearBadge]);

  // Setup notification listeners while on this screen
  useEffect(() => {
    if (isEnabled) {
      setupListeners(
        // When notification received while on this screen
        (notification) => {
          // Add the new notification to the top of the list
          const newNotification: Notification = {
            id: Date.now().toString(),
            title: notification.request.content.title || 'New Notification',
            message: notification.request.content.body || '',
            subtitle: notification.request.content.data?.subtitle || null,
            date: new Date().toLocaleDateString('en-US', { 
              weekday: 'short', 
              year: 'numeric', 
              month: 'short', 
              day: '2-digit' 
            }),
            timestamp: new Date().toISOString(),
            isRead: false,
            type: notification.request.content.data?.type || 'CUSTOM',
            data: notification.request.content.data || {},
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          clearBadge();
        },
        // When notification tapped
        (response) => {
          // Handle notification tap if needed
        }
      );
    }

    // Cleanup listeners when leaving screen
    return () => {
      removeListeners();
    };
  }, [isEnabled, setupListeners, removeListeners, clearBadge]);

  /**
   * Render notification item
   */
  const renderNotificationItem = useCallback(({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={styles.notificationCard} 
      activeOpacity={0.8}
      onPress={() => handleNotificationPress(item)}
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
  ), [handleNotificationPress]);

  /**
   * Empty state
   */
  const renderEmptyState = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#35297F" />
          <Text style={styles.emptyStateMessage}>Loading notifications...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Error</Text>
          <Text style={styles.emptyStateMessage}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchNotifications()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>No Notifications</Text>
        <Text style={styles.emptyStateMessage}>
          You're all caught up! We'll notify you when something new happens.
        </Text>
      </View>
    );
  }, [loading, error, fetchNotifications]);

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
            keyExtractor={(item) => item.id}
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
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#35297F',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotificationScreen;
