import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import { t } from '../../i18n';
import Avatar from '../../components/Avatar';

import { collection, query, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firestore';
import { auth } from '../../services/firebase';

export default function PlayersListScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { gameTitle, gameId } = route.params || { gameTitle: 'Game' };
    const [players, setPlayers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPlayers();
    }, [gameId]); // Add gameId dependency

    const fetchPlayers = async () => {
        setIsLoading(true);
        try {
            let q;
            if (gameId) {
                // Fetch ALL players for this game (or a larger limit like 50)
                q = query(
                    collection(db, 'users'),
                    where('games', 'array-contains', gameId),
                    limit(50)
                );
            } else {
                // Fallback to all users if no game is specified
                q = query(collection(db, 'users'), limit(50));
            }

            const querySnapshot = await getDocs(q);
            const playersList = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                playersList.push({
                    id: doc.id,
                    uid: doc.id,
                    name: data.displayName || data.username || 'Gamer',
                    username: data.username || '',
                    avatar: data.photoURL || null,
                    rank: data.ranks ? (Object.values(data.ranks)[0] || 'Unranked') : 'Unranked',
                    isOnline: data.isOnline || false
                });
            });
            setPlayers(playersList);
        } catch (error) {
            console.error("Error fetching players:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.playerCard}
            onPress={() => {
                if (item.uid === auth.currentUser?.uid) {
                    navigation.navigate('Main', { screen: 'Profile' });
                } else {
                    navigation.navigate('PlayersProfile', { player: item });
                }
            }}
        >
            <Avatar
                uri={item.avatar}
                size={60}
                style={{ marginRight: 15 }}
                showOnline={true}
                online={item.isOnline}
            />
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
            </View>
            <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{item.rank}</Text>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <ScreenBackground>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
            </ScreenBackground>
        );
    }

    return (
        <ScreenBackground>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{gameTitle} {t('players.players')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={players}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
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
    listContent: {
        padding: 20,
    },
    playerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 15,
        borderRadius: 20,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
    },
    name: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    username: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
    },
    rankBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.4)',
    },
    rankText: {
        color: '#A78BFA',
        fontSize: 12,
        fontWeight: '700',
    }
});
