import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { t } from '../../i18n';
import { getLikedVideos } from '../../services/firestore';
import { useUser } from '../../context/UserContext';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GAP = 2; // Pixel spacing between items
const SIDE_PADDING = 10;
const ITEM_WIDTH = (width - (SIDE_PADDING * 2) - (GAP * (COLUMN_COUNT - 1))) / COLUMN_COUNT;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5; // 2:3 aspect ratio

export default function ProfileLikesScreen({ userId }) {
    const navigation = useNavigation();
    const { currentUser } = useUser();

    // If no userId prop passed, assume current user (though PlayersProfile usually passes it)
    const targetUserId = userId || currentUser?.uid;

    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        if (targetUserId) {
            fetchLikes();
        } else {
            // Stop loading if we can't fetch anything
            setLoading(false);
        }
    }, [targetUserId]);

    const fetchLikes = async () => {
        setLoading(true);
        try {
            const data = await getLikedVideos(targetUserId);

            // DE-DUPLICATION (Self-Healing by Title)
            const deDuplicated = [];
            const seenTitles = new Set();

            // Data is already sorted by likedAt desc from Firestore
            data.forEach(item => {
                const titleKey = item.title?.toLowerCase().trim();
                if (titleKey && !seenTitles.has(titleKey)) {
                    seenTitles.add(titleKey);
                    deDuplicated.push(item);
                } else if (!titleKey) {
                    // If no title, keep it anyway
                    deDuplicated.push(item);
                }
            });

            setLikes(deDuplicated);
        } catch (error) {
            console.error("ProfileLikesScreen Error fetching likes:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('VideoPlayer', { item: item })} // Pass item to player
        >
            <Image
                source={{ uri: item.thumbnail || item.image || 'https://via.placeholder.com/150' }}
                style={styles.thumbnail}
                resizeMode="cover"
            />
            <View style={styles.overlay}>
                <MaterialCommunityIcons name="play-circle-outline" size={24} color="rgba(255,255,255,0.8)" />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4D4DFF" />
            </View>
        );
    }

    if (likes.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="heart-multiple-outline" size={50} color="rgba(255, 64, 129, 0.3)" />
                <Text style={styles.emptyText}>{t('profile.likedPostsHere')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={likes}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                scrollEnabled={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        color: '#94A3B8',
        fontSize: 14,
        marginTop: 15,
    },
    listContent: {
        paddingHorizontal: SIDE_PADDING,
        paddingBottom: 20,
    },
    columnWrapper: {
        gap: GAP,
        marginBottom: GAP,
    },
    gridItem: {
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
