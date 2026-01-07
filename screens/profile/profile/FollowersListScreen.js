import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import { t } from '../../i18n';
import { useUser } from '../../context/UserContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firestore';
import { auth } from '../../services/firebase';
import Avatar from '../../components/Avatar';

const { width } = Dimensions.get('window');

export default function FollowersListScreen() {
    const navigation = useNavigation();
    const { toggleFollowPlayer, followedPlayers } = useUser();
    const [followers, setFollowers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchFollowers();
    }, []);

    const fetchFollowers = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        try {
            // Find all users who have our UID in their followedUids array
            const q = query(
                collection(db, 'users'),
                where('followedUids', 'array-contains', currentUser.uid)
            );

            const querySnapshot = await getDocs(q);
            const followersList = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                followersList.push({
                    id: doc.id,
                    uid: doc.id,
                    name: data.displayName || data.username || 'Gamer',
                    username: data.username || '',
                    avatar: data.photoURL || null,
                    isOnline: data.isOnline || false
                });
            });

            setFollowers(followersList);
        } catch (error) {
            console.error("Error fetching followers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlayerPress = (player) => {
        navigation.navigate('PlayersProfile', { player });
    };

    const renderItem = ({ item }) => {
        const isFollowing = followedPlayers.some(p => (p.uid || p.id) === item.id);

        return (
            <TouchableOpacity
                style={styles.userRow}
                onPress={() => handlePlayerPress(item)}
            >
                <Avatar
                    uri={item.avatar}
                    size={50}
                    style={styles.avatar}
                    showOnline={true}
                    online={item.isOnline}
                />
                <View style={styles.userInfo}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.username}>@{item.username}</Text>
                </View>

                {auth.currentUser?.uid !== item.id && (
                    <TouchableOpacity
                        style={[styles.actionButton, isFollowing ? styles.followingButton : styles.followButton]}
                        onPress={(e) => {
                            e.stopPropagation();
                            toggleFollowPlayer(item);
                        }}
                    >
                        <Text style={[styles.actionText, isFollowing && styles.followingText]}>
                            {isFollowing ? t('search.following') : t('search.followBack')}
                        </Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#4D4DFF" />
                </View>
            );
        }

        if (followers.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <Ionicons name="people-outline" size={60} color="rgba(255,255,255,0.1)" />
                    <Text style={styles.emptyText}>{t('profile.noFollowersYet') || "No followers yet"}</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={followers}
                renderItem={renderItem}
                keyExtractor={item => item.id}
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
                <Text style={styles.headerTitle}>{t('profile.followers')}</Text>
                <View style={{ width: 40 }} />
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
    listContent: {
        padding: 20,
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
        marginRight: 15,
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
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followButton: {
        backgroundColor: '#4D4DFF',
    },
    followingButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: '#4D4DFF',
    },
    actionText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
    followingText: {
        color: '#4D4DFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 15
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 16,
        fontStyle: 'italic',
    }
});
