import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import { useNavigation } from '@react-navigation/native';
import { t } from '../../i18n';

const { width } = Dimensions.get('window');

export default function ProfileVideoScreen() {
    const { userClips, removeUserClip } = useUser();
    const navigation = useNavigation();

    const handleDeleteVideo = (videoId, videoTitle) => {
        Alert.alert(
            "Delete Video",
            `Are you sure you want to delete "${videoTitle}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await removeUserClip(videoId);
                            Alert.alert("Success", "Video deleted successfully");
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete video");
                        }
                    }
                }
            ]
        );
    };

    if (userClips.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyState}>
                    <MaterialCommunityIcons name="movie-roll" size={48} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.text}>{t('profile.noVideosYet')}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.videoGrid}>
                {userClips.map((clip) => (
                    <TouchableOpacity
                        key={clip.id}
                        style={styles.videoCard}
                        onPress={() => navigation.navigate('VideoPlayer', { item: clip })}
                    >
                        <Image source={{ uri: clip.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
                        <View style={styles.playOverlay}>
                            <Ionicons name="play" size={24} color="#FFF" />
                        </View>
                        <View style={styles.viewsBadge}>
                            <Text style={styles.viewsText}>{clip.views} {t('videos.views')}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleDeleteVideo(clip.id, clip.title);
                            }}
                        >
                            <Ionicons name="trash" size={18} color="#FF3D00" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 10,
    },
    text: {
        color: '#94A3B8',
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    videoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    videoCard: {
        width: (width - 50) / 2, // 20 padding horizontal + 10 gap
        height: 120,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        position: 'relative'
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    viewsBadge: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4
    },
    viewsText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold'
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40
    },
    deleteButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 16,
        padding: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 61, 0, 0.3)',
    }
});
