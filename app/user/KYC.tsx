// screens/KYCScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { useKYCFlow } from '../hooks/useKYCFlow';

interface DocumentButtonProps {
  documentType: string;
  label: string;
  icon: string;
  onPress: () => void;
  disabled: boolean;
}

const KYCScreen: React.FC = () => {
  const {
    loading,
    kycStatus,
    detailedLimits,
    currentProcess,
    startKYC,
    loadKYCStatus,
    loadDetailedLimits,
    getKYCLevelStatus,
    isKYCLevelCompleted,
    canStartKYCLevel
  } = useKYCFlow();

  const [refreshing, setRefreshing] = React.useState<boolean>(false);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadKYCStatus(),
        loadDetailedLimits()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₦${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'approved': return '#34C759';
      case 'pending': return '#FF9500';
      case 'under_review': return '#007AFF';
      case 'rejected': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'approved': return '✅';
      case 'pending': return '⏳';
      case 'under_review': return '👀';
      case 'rejected': return '❌';
      default: return '⚪';
    }
  };

  const handleStartKYC = (level: number, documentType: string): void => {
    Alert.alert(
      '📄 Document Verification',
      `You will now scan your ${documentType.toLowerCase().replace('_', ' ')} for KYC Level ${level} verification.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => startKYC(level, documentType)
        }
      ]
    );
  };

  const DocumentButton: React.FC<DocumentButtonProps> = ({ documentType, label, icon, onPress, disabled }) => (
    <TouchableOpacity
      style={[
        styles.documentButton,
        disabled && styles.buttonDisabled
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonIcon}>{icon}</Text>
      <Text style={styles.buttonText}>{label}</Text>
      <Text style={styles.buttonSubtext}>Tap to scan {label.toLowerCase()}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>🔐 KYC Verification</Text>
        <Text style={styles.subtitle}>Verify your identity to increase transaction limits</Text>

        {/* Current Status Card */}
        {kycStatus && (
          <View style={styles.statusCard}>
            <Text style={styles.cardTitle}>📊 Current Status</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>KYC Level:</Text>
              <Text style={styles.statusValue}>{kycStatus.currentKycLevel}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[styles.statusValue, { color: getStatusColor(kycStatus.kycStatus) }]}>
                {getStatusIcon(kycStatus.kycStatus)} {kycStatus.kycStatus}
              </Text>
            </View>
          </View>
        )}

        {/* Limits Card */}
        {detailedLimits && (
          <View style={styles.limitsCard}>
            <Text style={styles.cardTitle}>💰 Transaction Limits</Text>
            
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Daily Limit:</Text>
              <Text style={styles.limitValue}>
                {formatCurrency(detailedLimits.limits.daily)}
              </Text>
            </View>
            
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Daily Used:</Text>
              <Text style={[styles.limitValue, { color: '#FF9500' }]}>
                {formatCurrency(detailedLimits.currentSpending.daily)}
              </Text>
            </View>
            
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Daily Remaining:</Text>
              <Text style={[styles.limitValue, { color: '#34C759' }]}>
                {formatCurrency(detailedLimits.remaining.daily)}
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>
                Daily Usage: {detailedLimits.utilizationPercentage.daily}%
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(100, parseFloat(detailedLimits.utilizationPercentage.daily))}%`,
                      backgroundColor: parseFloat(detailedLimits.utilizationPercentage.daily) > 80 ? '#FF3B30' : '#34C759'
                    }
                  ]} 
                />
              </View>
            </View>

            {detailedLimits.upgradeInfo.canUpgrade && (
              <Text style={styles.upgradeText}>
                💡 {detailedLimits.upgradeInfo.upgradeRecommendation}
              </Text>
            )}
          </View>
        )}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {currentProcess ? '📸 Processing Document...' : '🚀 Initiating KYC...'}
            </Text>
          </View>
        )}

        {/* KYC Level 1 */}
        <View style={styles.levelCard}>
          <Text style={styles.levelTitle}>
            {getStatusIcon(getKYCLevelStatus(1))} Level 1 - Basic Verification
          </Text>
          <Text style={styles.levelDescription}>Email and phone verification</Text>
          <Text style={[styles.levelStatus, { color: getStatusColor(getKYCLevelStatus(1)) }]}>
            Status: {getKYCLevelStatus(1)}
          </Text>
          
          {isKYCLevelCompleted(1) ? (
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>✅ Completed</Text>
              <Text style={styles.limitText}>Daily Limit: ₦50,000</Text>
            </View>
          ) : (
            <Text style={styles.requirementText}>
              ℹ️ Complete email and phone verification in settings
            </Text>
          )}
        </View>

        {/* KYC Level 2 */}
        <View style={styles.levelCard}>
          <Text style={styles.levelTitle}>
            {getStatusIcon(getKYCLevelStatus(2))} Level 2 - Identity Verification
          </Text>
          <Text style={styles.levelDescription}>Government ID document verification</Text>
          <Text style={[styles.levelStatus, { color: getStatusColor(getKYCLevelStatus(2)) }]}>
            Status: {getKYCLevelStatus(2)}
          </Text>
          
          {isKYCLevelCompleted(2) ? (
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>✅ Completed</Text>
              <Text style={styles.limitText}>Daily Limit: ₦5,000,000</Text>
              {kycStatus?.kyc?.level2?.documentType && (
                <Text style={styles.documentInfo}>
                  📄 Document: {kycStatus.kyc.level2.documentType}
                </Text>
              )}
            </View>
          ) : canStartKYCLevel(2) ? (
            <View>
              <Text style={styles.documentTitle}>📄 Select Document Type:</Text>
              
              <DocumentButton
                documentType="DRIVERS_LICENSE"
                label="Driver's License"
                icon="🚗"
                onPress={() => handleStartKYC(2, 'DRIVERS_LICENSE')}
                disabled={loading}
              />
              
              <DocumentButton
                documentType="VOTERS_CARD"
                label="Voter's Card"
                icon="🗳️"
                onPress={() => handleStartKYC(2, 'VOTERS_CARD')}
                disabled={loading}
              />
              
              <DocumentButton
                documentType="NIN"
                label="NIN Slip"
                icon="🆔"
                onPress={() => handleStartKYC(2, 'NIN')}
                disabled={loading}
              />
              
              <DocumentButton
                documentType="PASSPORT"
                label="Passport"
                icon="📘"
                onPress={() => handleStartKYC(2, 'PASSPORT')}
                disabled={loading}
              />
            </View>
          ) : (
            <Text style={styles.requirementText}>
              ⚠️ Complete Level 1 first
            </Text>
          )}
        </View>

        {/* KYC Level 3 */}
        <View style={styles.levelCard}>
          <Text style={styles.levelTitle}>
            {getStatusIcon(getKYCLevelStatus(3))} Level 3 - Enhanced Verification
          </Text>
          <Text style={styles.levelDescription}>Address and source of funds verification</Text>
          <Text style={[styles.levelStatus, { color: getStatusColor(getKYCLevelStatus(3)) }]}>
            Status: {getKYCLevelStatus(3)}
          </Text>
          
          {isKYCLevelCompleted(3) ? (
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>✅ Completed</Text>
              <Text style={styles.limitText}>Daily Limit: ₦20,000,000</Text>
            </View>
          ) : canStartKYCLevel(3) ? (
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={() => handleStartKYC(3, 'ENHANCED')}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>🚀 Start Level 3</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.requirementText}>
              ⚠️ Complete Level 2 first
            </Text>
          )}
        </View>

        {/* Recent KYC Records */}
        {kycStatus?.recentRecords && kycStatus.recentRecords.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.cardTitle}>📝 Recent KYC Attempts</Text>
            {kycStatus.recentRecords.slice(0, 3).map((record: any, index: number) => (
              <View key={record.id} style={styles.historyItem}>
                <Text style={styles.historyText}>
                  Level {record.level} - {record.status}
                  {record.confidence && ` (${(record.confidence * 100).toFixed(0)}%)`}
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(record.submittedAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  limitsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#666',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  limitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  limitLabel: {
    fontSize: 16,
    color: '#666',
  },
  limitValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressContainer: {
    marginTop: 15,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  upgradeText: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 15,
    textAlign: 'center',
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  levelDescription: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  levelStatus: {
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '600',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  documentButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'left',
  },
  buttonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    position: 'absolute',
    bottom: 5,
    right: 15,
  },
  primaryButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  completedContainer: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
  },
  completedText: {
    fontSize: 18,
    color: '#34C759',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  limitText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  documentInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  requirementText: {
    fontSize: 14,
    color: '#FF9500',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 15,
    backgroundColor: '#FFF9F0',
    borderRadius: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
});

export default KYCScreen;