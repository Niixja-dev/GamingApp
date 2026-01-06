import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');

// MOCK DATA
// MOCK DATA REMOVED - Using API
const GAMES_DATA = [];

import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../../services/firestore';
import { searchGames } from '../../services/api';
import { t } from '../../i18n';
import Avatar from '../../components/Avatar';

export default function SearchScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const { toggleFollowPlayer, followedPlayers, toggleFollowGame, followedGames } = useUser();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'Games');
    const [games, setGames] = useState([]);
    const [allPlayers, setAllPlayers] = useState([]); // Store all fetched players
    const [players, setPlayers] = useState([]); // Store filtered players
    const [isLoading, setIsLoading] = useState(false);

    // Fetch players from Firestore
    React.useEffect(() => {
        const fetchPlayers = async () => {
            setIsLoading(true);
            try {
                const q = query(collection(db, 'users'), limit(50));
                const querySnapshot = await getDocs(q);
                const playersList = [];
                querySnapshot.forEach((doc) => {
                    playersList.push({ id: doc.id, ...doc.data() });
                });
                setAllPlayers(playersList);
                setPlayers(playersList.slice(0, 4)); // Show only 4 initially
            } catch (error) {
                console.error("Error fetching players:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlayers();
    }, []);

    // Timer ref for debounce
    const searchTimeout = React.useRef(null);

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (text.trim().length === 0) {
            if (activeTab === 'Games') setGames([]);
            else setPlayers(allPlayers.slice(0, 4));
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        if (activeTab === 'Games') {
            searchTimeout.current = setTimeout(async () => {
                try {
                    const results = await searchGames(text);
                    setGames(results);
                } catch (error) {
                    console.error("Search error:", error);
                    setGames([]);
                } finally {
                    setIsLoading(false);
                }
            }, 600);
        } else {
            // Players Search (Local filtering with artificial delay for UX consistency)
            searchTimeout.current = setTimeout(() => {
                const filtered = allPlayers.filter(player =>
                    (player.username?.toLowerCase().includes(text.toLowerCase())) ||
                    (player.displayName?.toLowerCase().includes(text.toLowerCase()))
                );
                setPlayers(filtered);
                setIsLoading(false);
            }, 600);
        }
    };

    const toggleGameFollow = (id) => {
        setGames(prev => prev.map(g => g.id === id ? { ...g, isFollowed: !g.isFollowed } : g));
    };

    const togglePlayerFollow = async (player) => {
        await toggleFollowPlayer(player);
    };

    const renderGameItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('GameDetail', { game: item })}
        >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.genres}</Text>
            </View>
            <TouchableOpacity
                style={[styles.followBtn, item.isFollowed && styles.followingBtn]}
                onPress={(e) => {
                    e.stopPropagation(); // Prevent card navigation when clicking follow
                    toggleGameFollow(item.id);
                }}
            >
                <Text style={[styles.followBtnText, item.isFollowed && styles.followingBtnText]}>
                    {item.isFollowed ? 'Following' : 'Follow'}
                </Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderPlayerItem = ({ item }) => {
        const isFollowed = followedPlayers.some(p => (p.uid || p.id) === item.id);
        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => {
                    if (user?.uid === item.id) {
                        navigation.navigate('Main', { screen: 'Profile' });
                    } else {
                        navigation.navigate('PlayersProfile', { player: item });
                    }
                }}
            >
                <Avatar
                    uri={item.photoURL}
                    size={60}
                    style={{ marginRight: 15 }}
                    showOnline={true}
                    online={item.isOnline}
                />
                <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.displayName || item.username}</Text>
                    <Text style={styles.cardSubtitle}>@{item.username}</Text>
                </View>
                {user?.uid !== item.id && (
                    <TouchableOpacity
                        style={[styles.followBtn, isFollowed && styles.followingBtn]}
                        onPress={(e) => {
                            e.stopPropagation();
                            togglePlayerFollow(item);
                        }}
                    >
                        <Text style={[styles.followBtnText, isFollowed && styles.followingBtnText]}>
                            {isFollowed ? t('search.following') : t('search.follow')}
                        </Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <ScreenBackground>
            {/* SEARCH HEADER */}
            <View style={styles.header}>
                <View style={styles.searchBarContainer}>
                    <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                    <Ionicons name="search" size={20} color="rgba(255,255,255,0.5)" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('search.searchPlaceholder', { type: activeTab.toLowerCase() })}
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {isLoading && <ActivityIndicator size="small" color="#8B5CF6" style={{ marginRight: 10 }} />}
                </View>
            </View>

            {/* TABS SEGMENTED CONTROL */}
            <View style={styles.tabsContainer}>
                <View style={styles.tabsWrapper}>
                    {['Games', 'Players'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[
                                styles.tabButton,
                                activeTab === tab && styles.activeTabButton
                            ]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === tab && styles.activeTabText
                            ]}>{t(`search.tab${tab}`)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* RESULTS LIST */}
            <FlatList
                data={activeTab === 'Games' ? games : players}
                renderItem={activeTab === 'Games' ? renderGameItem : renderPlayerItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={<View style={{ height: 100 }} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {!isLoading && searchQuery.length > 0 && (
                            <Text style={styles.emptyText}>
                                {activeTab === 'Games' ? `No games found for "${searchQuery}"` : `No player found for "${searchQuery}"`}
                            </Text>
                        )}
                        {!isLoading && searchQuery.length === 0 && (
                            <Text style={styles.emptyText}>{t('search.typeToSearch', { type: activeTab.toLowerCase() })}</Text>
                        )}
                    </View>
                }
            />
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 15,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        paddingVertical: 10,
    },
    tabsContainer: {
        alignItems: 'center',
        paddingVertical: 0,
        marginBottom: 20,
    },
    tabsWrapper: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 25,
        padding: 4,
        width: width * 0.9,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 22,
    },
    activeTabButton: {
        backgroundColor: '#8B5CF6',
    },
    tabText: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: 20,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardImage: {
        width: 60,
        height: 80,
        borderRadius: 12,
        marginRight: 15,
        backgroundColor: '#2A2A4A',
    },
    avatarImage: {
        width: 60,
        height: 60, // Circular for players
        borderRadius: 30,
        marginRight: 15,
        backgroundColor: '#2A2A4A',
    },
    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    cardInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    cardTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    cardSubtitle: {
        color: '#94A3B8',
        fontSize: 13,
    },
    followBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#8B5CF6',
        borderRadius: 20,
        marginLeft: 10,
    },
    followingBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: '#8B5CF6',
    },
    followBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    followingBtnText: {
        color: '#8B5CF6',
    },
    emptyContainer: {
        paddingTop: 50,
        alignItems: 'center',
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 16,
        fontStyle: 'italic',
    }
});
