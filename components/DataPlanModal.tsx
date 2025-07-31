import React, { useState, useEffect, useCallback } from 'react';
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

interface DataPlan {
  id?: string;
  variationId?: string;
  variation_id?: string;
  data?: string;
  dataAllowance?: string;
  duration?: string;
  validity?: string;
  price?: number;
  formattedPrice?: string;
  originalPlan?: any;
}

interface DataPlansModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPlan: (plan: any) => void;
  selectedPlan?: DataPlan | null;
  networkId?: string;
  networkName?: string;
  loading?: boolean;
}

const DataPlansModal: React.FC<DataPlansModalProps> = ({
  visible,
  onClose,
  onSelectPlan,
  selectedPlan = null,
  networkId = '',
  networkName = '',
  loading: externalLoading = false
}) => {
  const [activeTab, setActiveTab] = useState('daily');

  // Safe hook usage with error boundaries
  const {
    loading: plansLoading = false,
    error: plansError = null,
    getDataPlans,
    hasDataPlans,
    getModalFormattedPlans,
    getCachedDataPlans,
    clearErrors,
    getErrorAction,
    getUserFriendlyMessage,
    isLoadingForNetwork
  } = useDataPlans() || {};

  // Safe function wrappers
  const safeGetDataPlans = useCallback((id: string) => {
    try {
      if (getDataPlans && typeof getDataPlans === 'function') {
        return getDataPlans(id);
      }
    } catch (error) {
      console.error('Error calling getDataPlans:', error);
    }
  }, [getDataPlans]);

  const safeHasDataPlans = useCallback((id: string): boolean => {
    try {
      if (hasDataPlans && typeof hasDataPlans === 'function') {
        return hasDataPlans(id);
      }
      return false;
    } catch (error) {
      console.error('Error calling hasDataPlans:', error);
      return false;
    }
  }, [hasDataPlans]);

  const safeGetModalFormattedPlans = useCallback((id: string) => {
    try {
      if (getModalFormattedPlans && typeof getModalFormattedPlans === 'function') {
        return getModalFormattedPlans(id);
      }
      return { daily: [], weekly: [], monthly: [], other: [] };
    } catch (error) {
      console.error('Error calling getModalFormattedPlans:', error);
      return { daily: [], weekly: [], monthly: [], other: [] };
    }
  }, [getModalFormattedPlans]);

  const safeGetCachedDataPlans = useCallback((id: string): DataPlan[] => {
    try {
      if (getCachedDataPlans && typeof getCachedDataPlans === 'function') {
        return getCachedDataPlans(id) || [];
      }
      return [];
    } catch (error) {
      console.error('Error calling getCachedDataPlans:', error);
      return [];
    }
  }, [getCachedDataPlans]);

  const safeClearErrors = useCallback(() => {
    try {
      if (clearErrors && typeof clearErrors === 'function') {
        clearErrors();
      }
    } catch (error) {
      console.error('Error calling clearErrors:', error);
    }
  }, [clearErrors]);

  const safeIsLoadingForNetwork = useCallback((id: string): boolean => {
    try {
      if (isLoadingForNetwork && typeof isLoadingForNetwork === 'function') {
        return isLoadingForNetwork(id);
      }
      return false;
    } catch (error) {
      console.error('Error calling isLoadingForNetwork:', error);
      return false;
    }
  }, [isLoadingForNetwork]);

  // Fetch plans when modal opens and network is available
  useEffect(() => {
    if (!visible || !networkId) return;

    try {
      if (!safeHasDataPlans(networkId)) {
        console.log(`📋 Modal opened, fetching plans for ${networkId}`);
        safeGetDataPlans(networkId);
      } else {
        console.log(`📋 Modal opened, using cached plans for ${networkId}`);
      }
    } catch (error) {
      console.error('Error in useEffect for fetching plans:', error);
    }
  }, [visible, networkId, safeGetDataPlans, safeHasDataPlans]);

  // Clear and reset tab when modal opens
  useEffect(() => {
    if (visible) {
      setActiveTab('daily');
      safeClearErrors();
    }
  }, [visible, safeClearErrors]);

  // Tab configuration
  const tabs = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'other', label: 'Other plans' }
  ];

  // Safe plan property access
  const getSafePlanProperty = (plan: any, property: string, fallback: any = '') => {
    try {
      if (!plan || typeof plan !== 'object') return fallback;
      return plan[property] ?? fallback;
    } catch (error) {
      console.warn(`Error accessing plan property ${property}:`, error);
      return fallback;
    }
  };

  // Get current plans based on active tab
  const getCurrentPlans = useCallback((): DataPlan[] => {
    try {
      let tabPlans: DataPlan[] = [];

      if (networkId) {
        const allFormattedPlans = safeGetModalFormattedPlans(networkId);
        tabPlans = Array.isArray(allFormattedPlans[activeTab]) ? allFormattedPlans[activeTab] : [];
      }
      
      return tabPlans;
    } catch (error) {
      console.error('Error getting current plans:', error);
      return [];
    }
  }, [networkId, activeTab, safeGetModalFormattedPlans]);

  const currentPlans = getCurrentPlans();
  const isLoading = plansLoading || externalLoading || safeIsLoadingForNetwork(networkId);

  const handlePlanSelect = useCallback((plan: DataPlan) => {
    try {
      console.log('📋 Plan selected in modal:', plan);
      
      if (!plan) {
        console.error('Plan is null or undefined');
        return;
      }

      // Create a safe plan object for the parent component
      const safePlan = {
        id: getSafePlanProperty(plan, 'id') || getSafePlanProperty(plan, 'variationId'),
        variationId: getSafePlanProperty(plan, 'variationId') || getSafePlanProperty(plan, 'id'),
        data: getSafePlanProperty(plan, 'data') || getSafePlanProperty(plan, 'dataAllowance'),
        duration: getSafePlanProperty(plan, 'duration') || getSafePlanProperty(plan, 'validity'),
        price: getSafePlanProperty(plan, 'price', 0),
        formattedPrice: getSafePlanProperty(plan, 'formattedPrice') || `₦${getSafePlanProperty(plan, 'price', 0)}`,
        originalPlan: plan // Include the original plan data for the parent component
      };

      onSelectPlan(safePlan);
      onClose();
    } catch (error) {
      console.error('Error handling plan selection:', error);
    }
  }, [onSelectPlan, onClose]);

  const handleTabPress = useCallback((tabId: string) => {
    try {
      setActiveTab(tabId);
    } catch (error) {
      console.error('Error handling tab press:', error);
    }
  }, []);

  const handleRetryFetch = useCallback(() => {
    try {
      if (networkId) {
        safeClearErrors();
        safeGetDataPlans(networkId);
      }
    } catch (error) {
      console.error('Error handling retry fetch:', error);
    }
  }, [networkId, safeClearErrors, safeGetDataPlans]);

  // Get display content based on state
  const getDisplayContent = () => {
    try {
      if (isLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#35297F" />
            <Text style={styles.loadingText}>Loading plans...</Text>
          </View>
        );
      }

      if (plansError) {
        const errorAction = getErrorAction ? getErrorAction(plansError) : null;
        const errorMessage = getUserFriendlyMessage ? 
          getUserFriendlyMessage(plansError, 'Failed to load data plans') : 
          'Failed to load data plans';

        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
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
        const hasAnyPlans = networkId ? safeGetCachedDataPlans(networkId).length > 0 : false;
        
        return (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {hasAnyPlans 
                ? `No ${activeTab} plans available` 
                : 'No data plans available for this network'}
            </Text>
            {!hasAnyPlans && networkId && (
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
            try {
              // Generate a unique key using plan id or fallback to index
              const planId = getSafePlanProperty(plan, 'id') || 
                           getSafePlanProperty(plan, 'variationId') || 
                           getSafePlanProperty(plan, 'variation_id');
              const planKey = planId || `plan-${index}`;
              
              const isSelected = selectedPlan && (
                selectedPlan.id === planId || 
                selectedPlan.variationId === planId ||
                selectedPlan.variationId === getSafePlanProperty(plan, 'variationId')
              );
              
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
                    {getSafePlanProperty(plan, 'data') || 
                     getSafePlanProperty(plan, 'dataAllowance') || 
                     'N/A'}
                  </Text>
                  <Text style={styles.planDuration}>
                    {getSafePlanProperty(plan, 'duration') || 
                     getSafePlanProperty(plan, 'validity') || 
                     'N/A'}
                  </Text>
                  <Text style={styles.planPrice}>
                    {getSafePlanProperty(plan, 'formattedPrice') || 
                     `₦${getSafePlanProperty(plan, 'price', 0)}`}
                  </Text>
                </TouchableOpacity>
              );
            } catch (error) {
              console.error(`Error rendering plan at index ${index}:`, error);
              return null;
            }
          })}
        </View>
      );
    } catch (error) {
      console.error('Error getting display content:', error);
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>An error occurred while displaying plans</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetryFetch}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // Debug logging for current plans
  useEffect(() => {
    if (visible && networkId) {
      try {
        console.log('📋 Modal debug info:', {
          networkId,
          activeTab,
          currentPlansCount: currentPlans.length,
          hasDataPlans: safeHasDataPlans(networkId),
          cachedPlansCount: safeGetCachedDataPlans(networkId).length,
          isLoading,
          plansError
        });
      } catch (error) {
        console.error('Error in debug logging:', error);
      }
    }
  }, [visible, networkId, activeTab, currentPlans.length, safeHasDataPlans, safeGetCachedDataPlans, isLoading, plansError]);

  // Safe modal close handler
  const handleModalClose = useCallback(() => {
    try {
      onClose();
    } catch (error) {
      console.error('Error closing modal:', error);
    }
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleModalClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleModalClose}>
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
                  onPress={handleModalClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
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
});

export default DataPlansModal;