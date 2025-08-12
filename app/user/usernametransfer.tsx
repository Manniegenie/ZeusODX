// app/user/UsernameSearchScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import BottomTabNavigator from '../../components/BottomNavigator';
import TransferBottomSheet from '../../components/UsernameTransfer';
import lensIcon from '../../components/icons/lens-icon.png';
import { useUsernameSearch } from '../../hooks/useUsernameQuery';

interface User {
  _id: string;
  username: string;
  firstname: string;
  lastname: string;
  avatarUrl?: string | null;
}

const UsernameSearchScreen = () => {
  const router = useRouter();
  const { tokenId, tokenName, tokenSymbol } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Use the username search hook
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
        // Show error alert if search fails
        Alert.alert('Search Error', result.error);
      }
    } else {
      clearResults();
    }
  };

  const handleUserPress = (user: User) => {
    // Format user for the bottom sheet (convert to expected format)
    const formattedUser = {
      ...user,
      id: user._id, // Convert _id to id for compatibility
      fullName: `${user.firstname} ${user.lastname}`.trim()
    };
    setSelectedUser(formattedUser as any);
    setIsBottomSheetVisible(true);
  };

  const handleCloseBottomSheet = () => {
    setIsBottomSheetVisible(false);
    setSelectedUser(null);
  };

  const getFullName = (user: User) => {
    return `${user.firstname} ${user.lastname}`.trim();
  };

  const getUserInitials = (user: User) => {
    const firstname = user.firstname?.charAt(0)?.toUpperCase() || '';
    const lastname = user.lastname?.charAt(0)?.toUpperCase() || '';
    return `${firstname}${lastname}`;
  };

  const handleClearError = () => {
    clearError();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor={Colors.background} barStyle="dark-content" />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>Send via ZeusODX Username</Text>
          </View>
          <View style={styles.subtitleSection}>
            <Text style={styles.subtitleText}>Search and select more recipients</Text>
          </View>
          <View style={styles.searchSection}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Username"
                placeholderTextColor={Colors.text.secondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
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
            {/* Loading State */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            )}

            {/* Empty Results */}
            {isEmpty && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>Try searching with a different username</Text>
              </View>
            )}

            {/* Search Results */}
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
                          <Text style={styles.userInitials}>
                            {getUserInitials(user)}
                          </Text>
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

            {/* No Search Yet */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  headerSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  backButtonText: { fontSize: 20, color: Colors.text.primary, fontWeight: '500' },
  titleSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  headerTitle: { color: '#35297F', fontFamily: Typography.medium, fontSize: 18, fontWeight: '600', textAlign: 'left' },
  subtitleSection: { paddingHorizontal: 16, paddingVertical: 8 },
  subtitleText: { color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 14, fontWeight: '400', textAlign: 'left' },
  searchSection: { paddingHorizontal: 16, paddingVertical: 12 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8F9FA', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    paddingHorizontal: 16, 
    paddingVertical: 12 
  },
  searchInput: { 
    flex: 1, 
    color: Colors.text.primary, 
    fontFamily: Typography.regular, 
    fontSize: 16, 
    fontWeight: '400',
    marginRight: 12,
    paddingVertical: 4
  },
  searchButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#35297F',
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchButtonIcon: { 
    width: 16, 
    height: 16, 
    resizeMode: 'contain',
    tintColor: '#FFFFFF'
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE6E6',
    borderColor: '#FF6B6B',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12
  },
  errorText: {
    flex: 1,
    color: '#D63031',
    fontFamily: Typography.regular,
    fontSize: 14
  },
  errorCloseButton: {
    padding: 4
  },
  errorCloseText: {
    color: '#D63031',
    fontSize: 18,
    fontWeight: 'bold'
  },
  resultsSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, flex: 1 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 14 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: Colors.text.primary, fontFamily: Typography.medium, fontSize: 16, marginBottom: 8 },
  emptySubtext: { color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 14, textAlign: 'center' },
  instructionContainer: { alignItems: 'center', paddingVertical: 40 },
  instructionText: { color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 14 },
  resultsHeader: {
    color: Colors.text.secondary,
    fontFamily: Typography.medium,
    fontSize: 12,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  usersList: { gap: 20 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 10, justifyContent: 'flex-start', alignSelf: 'flex-start', gap: 10 },
  avatarContainer: { alignItems: 'center', justifyContent: 'center' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#35297F', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  userInitials: { color: '#FFFFFF', fontFamily: 'Bricolage Grotesque', fontSize: 16, fontWeight: '600' },
  textContainer: { alignItems: 'flex-start', justifyContent: 'center' },
  userInfo: { alignItems: 'flex-start', justifyContent: 'center' },
  userName: { color: Colors.text.primary, fontFamily: 'Bricolage Grotesque', fontSize: 14, fontWeight: '700', lineHeight: 16, letterSpacing: 0, textAlign: 'left', marginBottom: 2 },
  userUsername: { color: Colors.text.secondary, fontFamily: 'Bricolage Grotesque', fontSize: 10, fontWeight: '500', lineHeight: 16, letterSpacing: 0, textAlign: 'left' },
});

export default UsernameSearchScreen;