import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { useDataPlans } from '../hooks/useDataPlans';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = 393;
const MODAL_HEIGHT = 537;

const DataPlansModal = ({
  visible,
  onClose,
  onSelectPlan,
  selectedPlan = null,
  networkId = '', // Network ID to fetch plans for (mtn, airtel, glo, 9mobile, smile)
  networkName = '',
  loading: externalLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('daily');

  // Use the useDataPlans hook
  const {
    loading: plansLoading,
    error: plansError,
    getDataPlans,
    hasDataPlans,
    getModalFormattedPlans,
    getCachedDataPlans,
    clearErrors,
    getErrorAction,
    getUserFriendlyMessage,
    isLoadingForNetwork
  } = useDataPlans();

  // Fetch plans when modal opens and network is available
  useEffect(() => {
    if (visible && networkId && !hasDataPlans(networkId)) {
      console.log(`📋 Modal opened, fetching plans for ${networkId}`);
      getDataPlans(networkId);
    } else if (visible && networkId && hasDataPlans(networkId)) {
      console.log(`📋 Modal opened, using cached plans for ${networkId}`);
    }
  }, [visible, networkId, getDataPlans, hasDataPlans]);

  // Clear search and reset tab when modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setActiveTab('daily');
      clearErrors();
    }
  }, [visible, clearErrors]);

  // Tab configuration
  const tabs = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'other', label: 'Other plans' }
  ];

  // Get current plans based on active tab and search
  const getCurrentPlans = () => {
    let tabPlans = [];

    if (networkId) {
      // Get formatted plans using the hook
      const allFormattedPlans = getModalFormattedPlans(networkId);
      tabPlans = allFormattedPlans[activeTab] || [];
    }
    
    // Apply search filter if there's a query
    if (searchQuery.trim()) {
      tabPlans = tabPlans.filter(plan => 
        plan.data?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.duration?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.formattedPrice?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.price?.toString().includes(searchQuery.toLowerCase())
      );
    }
    
    return tabPlans;
  };

  const currentPlans = getCurrentPlans();
  const isLoading = plansLoading || externalLoading || isLoadingForNetwork(networkId);

  const handlePlanSelect = (plan) => {
    console.log('📋 Plan selected in modal:', plan);
    onSelectPlan(plan);
    onClose();
  };

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    setSearchQuery(''); // Clear search when switching tabs
  };

  const handleRetryFetch = () => {
    if (networkId) {
      clearErrors();
      getDataPlans(networkId);
    }
  };

  // Get display content based on state
  const getDisplayContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#35297F" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      );
    }

    if (plansError) {
      const errorAction = getErrorAction(plansError);
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {getUserFriendlyMessage(plansError, 'Failed to load data plans')}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetryFetch}
          >
            <Text style={styles.retryButtonText}>
              {errorAction?.actionText || 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!networkId) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please select a network first</Text>
        </View>
      );
    }

    if (currentPlans.length === 0) {
      const hasAnyPlans = networkId ? getCachedDataPlans(networkId).length > 0 : false;
      
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? 'No plans found for your search' 
              : hasAnyPlans 
                ? `No ${activeTab} plans available` 
                : 'No data plans available for this network'}
          </Text>
          {searchQuery && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchText}>Clear search</Text>
            </TouchableOpacity>
          )}
          {!hasAnyPlans && !searchQuery && networkId && (
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleRetryFetch}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.plansGrid}>
        {currentPlans.map((plan, index) => {
          // Generate a unique key using plan id or fallback to index
          const planKey = plan.id || plan.variationId || `plan-${index}`;
          const isSelected = selectedPlan?.id === plan.id || 
                           selectedPlan?.variationId === plan.id ||
                           selectedPlan?.variationId === plan.variationId;
          
          return (
            <TouchableOpacity
              key={planKey}
              style={[
                styles.planCard,
                isSelected && styles.planCardSelected
              ]}
              onPress={() => handlePlanSelect(plan)}
              activeOpacity={0.8}
            >
              <Text style={styles.planData}>
                {plan.data || plan.dataAllowance || 'N/A'}
              </Text>
              <Text style={styles.planDuration}>
                {plan.duration || plan.validity || 'N/A'}
              </Text>
              <Text style={styles.planPrice}>
                {plan.formattedPrice || `₦${plan.price || 0}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Debug logging for current plans
  useEffect(() => {
    if (visible && networkId) {
      console.log('📋 Modal debug info:', {
        networkId,
        activeTab,
        currentPlansCount: currentPlans.length,
        hasDataPlans: hasDataPlans(networkId),
        cachedPlansCount: getCachedDataPlans(networkId).length,
        isLoading,
        plansError
      });
    }
  }, [visible, networkId, activeTab, currentPlans.length, hasDataPlans, getCachedDataPlans, isLoading, plansError]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>
                  {networkName ? `${networkName} Data Plans` : 'Choose Data plan'}
                </Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search plans..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading && !plansError && networkId}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearSearchIcon}
                      onPress={() => setSearchQuery('')}
                    >
                      <Text style={styles.clearSearchIconText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Tabs */}
              <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.tab,
                      activeTab === tab.id && styles.activeTab
                    ]}
                    onPress={() => handleTabPress(tab.id)}
                    activeOpacity={0.7}
                    disabled={isLoading || plansError || !networkId}
                  >
                    <Text style={[
                      styles.tabText,
                      activeTab === tab.id && styles.activeTabText,
                      (isLoading || plansError || !networkId) && styles.tabTextDisabled
                    ]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Plans Grid */}
              <ScrollView 
                style={styles.plansContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.plansContent}
              >
                {getDisplayContent()}
              </ScrollView>
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
    height: MODAL_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    position: 'absolute',
    top: 317,
    left: (SCREEN_WIDTH - MODAL_WIDTH) / 2,
    overflow: 'hidden',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '500',
  },

  // Search styles
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    opacity: 0.5,
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontFamily: Typography.regular || 'System',
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 0,
  },
  clearSearchIcon: {
    padding: 4,
  },
  clearSearchIconText: {
    color: '#6B7280',
    fontSize: 14,
  },

  // Tabs styles
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 24,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#35297F',
  },
  tabText: {
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontWeight: '400',
  },
  activeTabText: {
    color: '#35297F',
    fontWeight: '500',
  },
  tabTextDisabled: {
    opacity: 0.5,
  },

  // Plans styles
  plansContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  plansContent: {
    paddingBottom: 20,
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  planCard: {
    width: '31%',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 65,
    justifyContent: 'center',
  },
  planCardSelected: {
    backgroundColor: '#F8F7FF',
  },
  planData: {
    color: '#111827',
    fontFamily: Typography.medium || 'System',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 3,
  },
  planDuration: {
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 3,
  },
  planPrice: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Loading and empty states
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    color: '#6B7280',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9CA3AF',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#DC2626',
    fontFamily: Typography.regular || 'System',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#35297F',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '600',
  },
  clearSearchButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearSearchText: {
    color: '#35297F',
    fontFamily: Typography.medium || 'System',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DataPlansModal;