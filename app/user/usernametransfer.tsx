// app/user/UsernameSearchScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, SafeAreaView, StatusBar, ScrollView, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography } from '../../constants/Typography';
import { Colors } from '../../constants/Colors';
import BottomTabNavigator from '../../components/BottomNavigator';
import TransferBottomSheet from '../../components/UsernameTransfer';
import lensIcon from '../../components/icons/lens-icon.png';

interface User {
  id: string;
  username: string;
  fullName: string;
  avatar?: string | null;
}

const UsernameSearchScreen = () => {
  const router = useRouter();
  const { tokenId, tokenName, tokenSymbol } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const mockUsers: User[] = [
    { id: '1', username: 'john_doe', fullName: 'John Doe', avatar: null },
    { id: '2', username: 'jane_smith', fullName: 'Jane Smith', avatar: null },
    { id: '3', username: 'mike_wilson', fullName: 'Mike Wilson', avatar: null },
    { id: '4', username: 'sarah_jones', fullName: 'Sarah Jones', avatar: null },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      setIsLoading(true);
      setTimeout(() => {
        const filtered = mockUsers.filter(user =>
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.fullName.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
        setIsLoading(false);
      }, 500);
    } else {
      setSearchResults([]);
    }
  };

  const handleUserPress = (user: User) => {
    setSelectedUser(user);
    setIsBottomSheetVisible(true);
  };

  const handleCloseBottomSheet = () => {
    setIsBottomSheetVisible(false);
    setSelectedUser(null);
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
              <View style={styles.searchIcon}>
                <Image source={lensIcon} style={styles.searchIconImage} />
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by Username"
                placeholderTextColor={Colors.text.secondary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>
          <View style={styles.resultsSection}>
            {isLoading && <View style={styles.loadingContainer}><Text style={styles.loadingText}>Searching...</Text></View>}
            {!isLoading && searchQuery.length > 0 && searchResults.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>Try searching with a different username</Text>
              </View>
            )}
            {!isLoading && searchResults.length > 0 && (
              <View style={styles.usersList}>
                {searchResults.map((user) => (
                  <TouchableOpacity key={user.id} style={styles.userItem} onPress={() => handleUserPress(user)} activeOpacity={0.7}>
                    <View style={styles.avatarContainer}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userInitials}>
                          {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.textContainer}>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.fullName}</Text>
                        <Text style={styles.userUsername}>@{user.username}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', paddingHorizontal: 16, paddingVertical: 16 },
  searchIcon: { marginRight: 8 },
  searchIconImage: { width: 16, height: 16, resizeMode: 'contain' },
  searchInput: { flex: 1, color: Colors.text.primary, fontFamily: Typography.regular, fontSize: 14, fontWeight: '400' },
  resultsSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, flex: 1 },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 14 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: Colors.text.primary, fontFamily: Typography.medium, fontSize: 16, marginBottom: 8 },
  emptySubtext: { color: Colors.text.secondary, fontFamily: Typography.regular, fontSize: 14, textAlign: 'center' },
  usersList: { gap: 20 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 10, justifyContent: 'flex-start', alignSelf: 'flex-start', gap: 10 },
  avatarContainer: { alignItems: 'center', justifyContent: 'center' },
  userAvatar: { width: 17, height: 17, borderRadius: 30.59, backgroundColor: '#8075FF', alignItems: 'center', justifyContent: 'center' },
  userInitials: { color: '#FFFFFF', fontFamily: 'Bricolage Grotesque', fontSize: 8, fontWeight: '600' },
  textContainer: { alignItems: 'flex-start', justifyContent: 'center' },
  userInfo: { width: 152, height: 34, alignItems: 'flex-start', justifyContent: 'center' },
  userName: { color: Colors.text.primary, fontFamily: 'Bricolage Grotesque', fontSize: 14, fontWeight: '700', lineHeight: 16, letterSpacing: 0, textAlign: 'left', marginBottom: 2 },
  userUsername: { color: Colors.text.secondary, fontFamily: 'Bricolage Grotesque', fontSize: 10, fontWeight: '500', lineHeight: 16, letterSpacing: 0, textAlign: 'left' },
});

export default UsernameSearchScreen;
