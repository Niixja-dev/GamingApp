import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import { useUser } from '../../context/UserContext';
import { t } from '../../i18n';

const { width } = Dimensions.get('window');

export default function FollowingListScreen() {
    const navigation = useNavigation();
    const { followedGames, followedPlayers, toggleFollowGame } = useUser();
    const [activeTab, setActiveTab] = useState('Players');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate loading delay for better UX
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const renderPlayerItem = ({ item }) => (
        <TouchableOpacity
            style={styles.userRow}
            onPress={() => navigation.navigate('PlayersProfile', { player: item })}
        >
            <View>
                <Image source={{ uri: item.avatar || 'https://via.placeholder.com/100' }} style={styles.avatar} />
                {item.isOnline && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.name}>{item.name || item.displayName}</Text>
                <Text style={styles.username}>@{item.username}</Text>
            </View>
            <TouchableOpacity style={styles.messageButton}>
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderGameItem = ({ item }) => (
        <TouchableOpacity
            style={styles.gameRow}
            onPress={() => navigation.navigate('GameDetail', { game: item })}
        >
            <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} style={styles.gameImage} />
            <View style={styles.gameInfo}>
                <Text style={styles.gameTitle}>{item.title}</Text>
                <Text style={styles.gameGenre}>
                    {Array.isArray(item.genres) ? item.genres.join(' • ') : (item.genres || '')}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.followingButton}
                onPress={(e) => {
                    e.stopPropagation();
                    toggleFollowGame(item);
                }}
            >
                <Text style={styles.followingText}>{t('search.following')}</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderContent = () => {
        if (isLoading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
            );
        }

        const data = activeTab === 'Players' ? followedPlayers : followedGames;

        if (!data || data.length === 0) {
            const emptyMessage = activeTab === 'Players'
                ? "No players followed yet"
                : "No games followed yet";
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>{emptyMessage}</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={data}
                renderItem={activeTab === 'Players' ? renderPlayerItem : renderGameItem}
                keyExtractor={item => (item.id || item.uid).toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        );
    };

    return (
        <ScreenBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('profile.following')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* TABS */}
            <View style={styles.tabsContainer}>
                <View style={styles.tabsWrapper}>
                    {['Players', 'Games'].map((tab) => (
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

            {renderContent()}
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },

    // TABS STYLES
    tabsContainer: {
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    tabsWrapper: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 25,
        padding: 4,
        width: '100%',
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
        padding: 20,
        paddingTop: 0,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 17,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#0F1729',
    },
    userInfo: {
        flex: 1,
    },
    name: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    username: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    messageButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.4)',
    },

    // GAMES STYLES
    gameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    gameImage: {
        width: 50,
        height: 70,
        borderRadius: 10,
        marginRight: 15,
    },
    gameInfo: {
        flex: 1,
    },
    gameTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    gameGenre: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        marginTop: 2,
    },
    followingButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: '#8B5CF6',
    },
    followingText: {
        color: '#8B5CF6',
        fontSize: 12,
        fontWeight: '600',
    },

    // EMPTY STATE
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 16,
        fontStyle: 'italic',
    }
});
