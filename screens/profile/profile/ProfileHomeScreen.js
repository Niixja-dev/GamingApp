import React from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useFeed } from '../../context/FeedContext';
import { t } from '../../i18n';
import Avatar from '../../components/Avatar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const FeedItem = ({ item }) => {
    const navigation = useNavigation();

    // Simple relative time (can be improved)
    const getTimeAgo = (date) => {
        if (!date) return '';

        let past;
        // Handle Firestore Timestamp objects
        if (date && typeof date.toDate === 'function') {
            past = date.toDate();
        } else {
            past = new Date(date);
        }

        if (isNaN(past.getTime())) return '';

        const now = new Date();
        const diffInSeconds = Math.floor((now - past) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        return `${Math.floor(diffInSeconds / 86400)}d`;
    };

    const handlePlayerPress = () => {
        if (item.type === 'self') {
            navigation.navigate('Main', { screen: 'Profile' });
        } else {
            navigation.navigate('PlayersProfile', {
                player: {
                    id: item.userId,
                    uid: item.userId,
                    name: item.streamer,
                    avatar: item.avatar,
                    username: item.streamer
                }
            });
        }
    };

    const handleVideoPress = () => {
        navigation.navigate('VideoPlayer', { item });
    };

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <TouchableOpacity onPress={handlePlayerPress} style={styles.userInfo}>
                    <Avatar uri={item.avatar} size={42} showOnline={item.type !== 'fof'} online={true} />
                    <View style={styles.userText}>
                        <View style={styles.nameRow}>
                            <Text style={styles.username}>{item.streamer}</Text>
                            {item.type === 'fof' && (
                                <View style={styles.discoveryBadge}>
                                    <Text style={styles.discoveryText}>Discovery</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.statusText}>{t('profile.postedAClip')} • {getTimeAgo(item.createdAt)}</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#94A3B8" />
                </TouchableOpacity>
            </View>

            {/* Video Body */}
            <TouchableOpacity
                activeOpacity={0.9}
                style={styles.videoContainer}
                onPress={handleVideoPress}
            >
                <Image
                    source={{ uri: item.thumbnail || item.thumbnailUrl }}
                    style={styles.thumbnail}
                />
                <LinearGradient
                    colors={['transparent', 'rgba(15, 15, 61, 0.4)']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.playButtonWrapper}>
                    <BlurView intensity={30} style={styles.playButton}>
                        <Ionicons name="play" size={24} color="#FFF" />
                    </BlurView>
                </View>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.cardFooter}>
                <Text style={styles.clipTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Ionicons name="eye-outline" size={14} color="#94A3B8" />
                        <Text style={styles.statText}>{item.views || 0}</Text>
                    </View>
                    <View style={styles.stat}>
                        <Ionicons name="heart-outline" size={14} color="#94A3B8" />
                        <Text style={styles.statText}>{(item.views || 0) / 10 > 0 ? Math.floor((item.views || 0) / 10) : 0}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default function ProfileHomeScreen() {
    const { feedItems, loading, refreshing, refreshFeed } = useFeed();

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4D4DFF" />
            </View>
        );
    }

    if (feedItems.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="paper-plane-outline" size={60} color="rgba(255,255,255,0.1)" />
                <Text style={styles.emptyText}>{t('profile.noVideosYet')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.listContent}>
                {feedItems.map((item) => (
                    <FeedItem key={item.id} item={item} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    listContent: {
        paddingTop: 10,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 24,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cardHeader: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userText: {
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    username: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    discoveryBadge: {
        backgroundColor: 'rgba(77, 77, 255, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(77, 77, 255, 0.3)',
    },
    discoveryText: {
        color: '#4D4DFF',
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    statusText: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 1,
    },
    videoContainer: {
        width: '100%',
        height: width * 0.6,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    playButtonWrapper: {
        position: 'absolute',
        zIndex: 10,
    },
    playButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    cardFooter: {
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    clipTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 15,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 10,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 14,
        fontStyle: 'italic',
    },
});
