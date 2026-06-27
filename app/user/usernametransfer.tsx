// app/user/UsernameSearchScreen.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState , useMemo} from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomTabNavigator from '../../components/BottomNavigator';
import Loading from '../../components/Loading';
import TransferBottomSheet from '../../components/UsernameTransfer';
import backIcon from '../../components/icons/backy.png'; // <- shared back icon
import lensIcon from '../../components/icons/lens-icon.png';
import { useTheme } from '../../hooks/useTheme';
import type { AppColors } from '../../hooks/useTheme';
import { Typography } from '../../constants/Typography';
import { useUsernameSearch } from '../../hooks/useUsernameQuery';

interface User {
  _id: string;
  username: string;
  firstname: string;
  lastname: string;
  avatarUrl?: string | null;
}

const UsernameSearchScreen = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const { tokenId, tokenName, tokenSymbol } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const {
    searchResults,
    isLoading,
    error,
    hasSearched,
    searchUsername,
    clearResults,
    clearError,
    hasResults,
    isEmpty
  } = useUsernameSearch();

  const handleSearch = async () => {
    if (searchQuery.trim().length > 0) {
      console.log('🔍 Starting search for:', searchQuery);
      const result = await searchUsername(searchQuery.trim());
      if (!result.success && result.error) {
        Alert.alert('Search Error', result.error);
      }
    } else {
      clearResults();
    }
  };

  const handleUserPress = (user: User) => {
    const formattedUser = {
      ...user,
      id: user._id,
      fullName: `${user.firstname} ${user.lastname}`.trim()
    };
    setSelectedUser(formattedUser as any);
    setIsBottomSheetVisible(true);
  };

  const handleCloseBottomSheet = () => {
    setIsBottomSheetVisible(false);
    setSelectedUser(null);
  };

  const getFullName = (user: User) => `${user.firstname} ${user.lastname}`.trim();

  const getUserInitials = (user: User) => {
    const firstname = user.firstname?.charAt(0)?.toUpperCase() || '';
    const lastname = user.lastname?.charAt(0)?.toUpperCase() || '';
    return `${firstname}${lastname}`;
  };

  const handleClearError = () => clearError();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={colors.background} barStyle={colors.statusBar} />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* Header Section */}
          <View style={styles.headerSection}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
              delayPressIn={0}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Image source={backIcon} style={styles.backIcon} />
            </TouchableOpacity>
            <View style={styles.headerTitleWrapper}>
              <Text style={styles.headerTitle}>Send via ZeusODX Username</Text>
            </View>
            <View style={styles.headerRight} />
          </View>

          <View style={styles.subtitleSection}>
            <Text style={styles.subtitleText}>Search and select more recipients</Text>
          </View>

          {/* Search Section */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Username"
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.7}>
                <Image source={lensIcon} style={styles.searchButtonIcon} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleClearError} style={styles.errorCloseButton}>
                <Text style={styles.errorCloseText}>×</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.resultsSection}>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            )}

            {isEmpty && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>Try searching with a different username</Text>
              </View>
            )}

            {hasResults && !isLoading && (
              <View style={styles.usersList}>
                <Text style={styles.resultsHeader}>
                  Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                </Text>
                {searchResults.map((user: User) => (
                  <TouchableOpacity 
                    key={user._id} 
                    style={styles.userItem} 
                    onPress={() => handleUserPress(user)} 
                    activeOpacity={0.7}
                  >
                    <View style={styles.avatarContainer}>
                      <View style={styles.userAvatar}>
                        {user.avatarUrl ? (
                          <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                        ) : (
                          <Text style={styles.userInitials}>{getUserInitials(user)}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.textContainer}>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{getFullName(user)}</Text>
                        <Text style={styles.userUsername}>@{user.username}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!hasSearched && !isLoading && (
              <View style={styles.instructionContainer}>
                <Text style={styles.instructionText}>Enter a username to search</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomTabNavigator activeTab="home" />

      <TransferBottomSheet
        visible={isBottomSheetVisible}
        onClose={handleCloseBottomSheet}
        selectedUser={selectedUser}
        defaultToken={{ id: tokenId as string, name: tokenName as string, symbol: tokenSymbol as string }}
      />

      {/* Loading Screen - full-screen overlay during processing */}
      {isLoading && (
        <Loading />
      )}
    </View>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },

  headerSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backIcon: { width: 24, height: 24, resizeMode: 'contain', tintColor: colors.text },
  headerTitleWrapper: { flex: 1, alignItems: 'center' },
  headerRight: { width: 40 },
  headerTitle: { color: colors.text, fontFamily: Typography.medium, fontSize: 18, fontWeight: '600', textAlign: 'center' },

  subtitleSection: { paddingHorizontal: 16, paddingVertical: 8 },
  subtitleText: { color: colors.textSecondary, fontFamily: Typography.regular, fontSize: 14 },

  searchSection: { paddingHorizontal: 16, paddingVertical: 8 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 8, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 8 },
  searchInput: { flex: 1, color: colors.text, fontFamily: Typography.regular, fontSize: 16, marginRight: 12, paddingVertical: 4, minHeight: 36 },
  searchButton: { padding: 8, borderRadius: 6, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  searchButtonIcon: { width: 16, height: 16, resizeMode: 'contain', tintColor: '#FFFFFF' },

  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFE6E6', borderColor: '#FF6B6B', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 16, marginBottom: 12 },
  errorText: { flex: 1, color: '#D63031', fontFamily: Typography.regular, fontSize: 14 },
  errorCloseButton: { padding: 4 },
  errorCloseText: { color: '#D63031', fontSize: 18, fontWeight: 'bold' },

  resultsSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, flex: 1 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: colors.textSecondary, fontFamily: Typography.regular, fontSize: 14 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: colors.text, fontFamily: Typography.medium, fontSize: 16, marginBottom: 8 },
  emptySubtext: { color: colors.textSecondary, fontFamily: Typography.regular, fontSize: 14, textAlign: 'center' },
  instructionContainer: { alignItems: 'center', paddingVertical: 40 },
  instructionText: { color: colors.textSecondary, fontFamily: Typography.regular, fontSize: 14 },

  resultsHeader: { color: colors.textSecondary, fontFamily: Typography.medium, fontSize: 12, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  usersList: { gap: 20 },

  userItem: { flexDirection: 'row', alignItems: 'center', padding: 10, justifyContent: 'flex-start', alignSelf: 'flex-start', gap: 10 },
  avatarContainer: { alignItems: 'center', justifyContent: 'center' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  userInitials: { color: '#FFFFFF', fontFamily: 'Bricolage Grotesque', fontSize: 16, fontWeight: '600' },

  textContainer: { alignItems: 'flex-start', justifyContent: 'center' },
  userInfo: { alignItems: 'flex-start', justifyContent: 'center' },
  userName: { color: colors.text, fontFamily: 'Bricolage Grotesque', fontSize: 14, fontWeight: '700', lineHeight: 16, letterSpacing: 0, marginBottom: 2 },
  userUsername: { color: colors.textSecondary, fontFamily: 'Bricolage Grotesque', fontSize: 10, fontWeight: '500', lineHeight: 16 },
});

export default UsernameSearchScreen;
