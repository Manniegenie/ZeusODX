import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { Layout } from '../constants/Layout';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.userName}>Welcome to ZeusODX</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileText}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>$12,540.50</Text>
          <Text style={styles.balanceChange}>+2.4% today</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>💸</Text>
              </View>
              <Text style={styles.actionText}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>💰</Text>
              </View>
              <Text style={styles.actionText}>Receive</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>🔄</Text>
              </View>
              <Text style={styles.actionText}>Convert</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>💳</Text>
              </View>
              <Text style={styles.actionText}>Buy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactions}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsList}>
            <View style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <Text style={styles.transactionEmoji}>₿</Text>
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>Bitcoin Purchase</Text>
                <Text style={styles.transactionDate}>Today, 2:30 PM</Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={styles.transactionValue}>+0.0045 BTC</Text>
                <Text style={styles.transactionUsd}>$210.50</Text>
              </View>
            </View>

            <View style={styles.transactionItem}>
              <View style={[styles.transactionIcon, { backgroundColor: Colors.ethereum }]}>
                <Text style={styles.transactionEmoji}>Ξ</Text>
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>Ethereum Sale</Text>
                <Text style={styles.transactionDate}>Yesterday, 11:45 AM</Text>
              </View>
              <View style={styles.transactionAmount}>
                <Text style={[styles.transactionValue, { color: Colors.error }]}>-0.25 ETH</Text>
                <Text style={styles.transactionUsd}>$456.75</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
  },
  greeting: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
  },
  userName: {
    ...Typography.styles.h2,
    color: Colors.text.primary,
  },
  profileButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileText: {
    fontSize: 18,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    padding: Layout.spacing.xl,
    borderRadius: Layout.borderRadius.xl,
    marginBottom: Layout.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceLabel: {
    ...Typography.styles.body,
    color: Colors.text.secondary,
    marginBottom: Layout.spacing.sm,
  },
  balanceAmount: {
    ...Typography.styles.display,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.xs,
  },
  balanceChange: {
    ...Typography.styles.caption,
    color: Colors.success,
  },
  quickActions: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    ...Typography.styles.h3,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.lg,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 60,
    height: 60,
    backgroundColor: Colors.surface,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionText: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
  transactions: {
    marginBottom: Layout.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  seeAllText: {
    ...Typography.styles.body,
    color: Colors.primary,
  },
  transactionsList: {
    gap: Layout.spacing.md,
  },
  transactionItem: {
    backgroundColor: Colors.surface,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.bitcoin,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  transactionEmoji: {
    fontSize: 16,
    color: Colors.surface,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    ...Typography.styles.bodyMedium,
    color: Colors.text.primary,
    marginBottom: Layout.spacing.xs,
  },
  transactionDate: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    ...Typography.styles.bodyMedium,
    color: Colors.success,
    marginBottom: Layout.spacing.xs,
  },
  transactionUsd: {
    ...Typography.styles.caption,
    color: Colors.text.secondary,
  },
});