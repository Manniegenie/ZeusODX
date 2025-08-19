// app/user/BankAccountsScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import naijaFlag from '../../components/icons/naija-flag.png';
import { useBankAccounts } from '../../hooks/usebankAccount';

const BankAccountsScreen = () => {
  const router = useRouter();

  const {
    maskedAccounts,
    summary,
    loading,
    error,
    deletingId,
    refetch,
    deleteAccount,
  } = useBankAccounts({ auto: true });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const accounts = maskedAccounts; // convenience alias
  const canAddMore = summary?.canAddMore !== false;

  const selectedDeleting = useMemo(
    () => Boolean(selectedAccountId && deletingId === selectedAccountId),
    [selectedAccountId, deletingId]
  );

  const handleAddNewAccount = () => {
    if (!canAddMore) {
      Alert.alert(
        'Limit reached',
        `You can only add up to ${summary?.maxAllowed ?? 10} bank accounts.`
      );
      return;
    }
    router.push('/profile/add-bank');
  };

  const handleAccountOptions = (accountId: string) => {
    setSelectedAccountId(accountId);
    setShowDeleteModal(true);
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccountId) return;
    const res = await deleteAccount(selectedAccountId);
    if (res?.success) {
      setShowDeleteModal(false);
      setSelectedAccountId(null);
    } else {
      Alert.alert('Delete failed', res?.message || 'Unable to delete bank account.');
    }
  };

  const handleCancelDelete = () => {
    if (selectedDeleting) return; // prevent closing while deleting
    setShowDeleteModal(false);
    setSelectedAccountId(null);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Bank Accounts</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Description Section */}
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionText}>
              Here are all the bank details you added for crypto to cash payment.
            </Text>
          </View>

          {/* Loading */}
          {loading && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" />
              <Text style={{ color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 14 }}>
                Loading accounts…
              </Text>
            </View>
          )}

          {/* Error */}
          {!loading && error && (
            <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 8, padding: 12 }}>
              <Text style={{ color: '#991B1B', fontFamily: Typography.regular, fontSize: 14, marginBottom: 8 }}>
                {error.message || 'Could not load bank accounts'}
              </Text>
              <TouchableOpacity style={{ alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#EF4444', borderRadius: 6 }} onPress={refetch}>
                <Text style={{ color: '#fff', fontFamily: Typography.medium, fontSize: 14 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bank Accounts List */}
          <View style={styles.accountsSection}>
            {!loading && accounts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No bank accounts added yet</Text>
                <Text style={styles.emptyStateSubtext}>Add your first bank account to get started</Text>
              </View>
            ) : (
              accounts.map((account) => (
                <View key={account.id} style={styles.accountCard}>
                  <View style={styles.accountHeader}>
                    <View style={styles.accountInfo}>
                      <Image source={naijaFlag} style={styles.flagIcon} />
                      <View style={styles.accountDetails}>
                        <Text style={styles.accountNumber}>{account.maskedNumber || account.accountNumber}</Text>
                        <Text style={styles.bankName}>{account.bankName}</Text>
                        <Text style={styles.accountHolderName}>{account.accountName}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.optionsButton}
                      onPress={() => handleAccountOptions(account.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.optionsIcon}>⋮</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Add New Account Button */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.addButton, !canAddMore && { opacity: 0.6 }]}
            onPress={handleAddNewAccount}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>
              {canAddMore ? 'Add new bank account' : 'Account limit reached'}
            </Text>
          </TouchableOpacity>
          {!loading && (
            <Text style={{ marginTop: 8, textAlign: 'center', color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 12 }}>
            </Text>
          )}
        </View>
      </SafeAreaView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalContent}>
              <Text style={styles.deleteModalTitle}>Delete Bank Account</Text>
              <Text style={styles.deleteModalMessage}>
                Are you sure you want to delete this bank account? This action cannot be undone.
              </Text>

              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelDelete}
                  activeOpacity={selectedDeleting ? 1 : 0.7}
                  disabled={selectedDeleting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDeleteAccount}
                  activeOpacity={selectedDeleting ? 1 : 0.7}
                  disabled={selectedDeleting}
                >
                  {selectedDeleting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20,
  },
  backButtonText: { fontSize: 20, color: Colors.text.primary, fontWeight: '500' },
  headerTitle: {
    position: 'absolute',
    left: 0, right: 0,
    color: '#35297F',
    fontFamily: Typography.medium,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    pointerEvents: 'none',
  },
  headerSpacer: { width: 40, height: 40 },

  descriptionSection: { paddingHorizontal: 16, paddingBottom: 24 },
  descriptionText: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },

  accountsSection: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyStateText: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },

  accountCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  accountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  flagIcon: { width: 20, height: 15, marginRight: 12, resizeMode: 'contain' },
  accountDetails: { flex: 1 },
  accountNumber: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bankName: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountHolderName: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 12,
    fontWeight: '600',
  },

  optionsButton: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  optionsIcon: { color: Colors.text.secondary, fontSize: 18, fontWeight: 'bold' },

  bottomSection: { paddingHorizontal: 16, paddingBottom: 34, paddingTop: 16 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent', borderWidth: 1, borderColor: '#35297F',
    borderRadius: 8, paddingVertical: 16, paddingHorizontal: 20,
  },
  addButtonIcon: { color: '#35297F', fontSize: 18, fontWeight: '600', marginRight: 8 },
  addButtonText: { color: '#35297F', fontFamily: Typography.medium, fontSize: 16, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  deleteModalContainer: { backgroundColor: Colors.background, borderRadius: 12, marginHorizontal: 20, maxWidth: 400, width: '100%' },
  deleteModalContent: { padding: 24 },
  deleteModalTitle: {
    color: Colors.text.primary,
    fontFamily: Typography.medium,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteModalMessage: {
    color: Colors.text.secondary,
    fontFamily: Typography.regular,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteModalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1, backgroundColor: '#F8F9FA', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  cancelButtonText: { color: Colors.text.primary, fontFamily: Typography.medium, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  deleteButton: { flex: 1, backgroundColor: '#FF4444', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16 },
  deleteButtonText: { color: '#FFFFFF', fontFamily: Typography.medium, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});

export default BankAccountsScreen;
