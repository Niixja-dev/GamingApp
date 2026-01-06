import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from '../../components/Avatar';

import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useUser } from '../../context/UserContext';
import { t } from '../../i18n';

const { width } = Dimensions.get('window');

const LIVES_DATA = [
    { id: '1', streamer: 'KillerFrost', avatar: null, title: 'Road to Radiant - VALORANT', viewers: '12.5k', thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', game: 'Valorant' },
    { id: '2', streamer: 'NeonViper', avatar: null, title: 'Ranked Grind starts NOW!', viewers: '8.2k', thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80', game: 'APEX Legends' },
    { id: '3', streamer: 'PixelMaster', avatar: null, title: 'Late Night Chill Stream', viewers: '5.1k', thumbnail: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&q=80', game: 'Minecraft' },
];

export default function VideosScreen() {
    const { userClips, addUserClip, username, avatar } = useUser();
    const [activeTab, setActiveTab] = useState('Lives');
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [lives, setLives] = useState([]);
    const [titleModalVisible, setTitleModalVisible] = useState(false);
    const [videoTitle, setVideoTitle] = useState('');
    const [pendingVideoUri, setPendingVideoUri] = useState(null);
    const navigation = useNavigation();

    React.useEffect(() => {
        // Simulate API Fetch for Lives only
        setLoading(true);
        setTimeout(() => {
            setLives(LIVES_DATA);
            setLoading(false);
        }, 1500);
    }, []);

    const pickVideo = async () => {
        // Request permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            alert(t('videos.permissionRequired'));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 1,
        });

        if (!result.canceled) {
            try {
                const asset = result.assets[0];
                const videoUri = asset.uri;
                const fileSize = asset.fileSize; // in bytes

                // Cloudinary Free tier limit is 100MB
                if (fileSize && fileSize > 100 * 1024 * 1024) {
                    Alert.alert("File Too Large", "The video file must be smaller than 100MB for upload.");
                    return;
                }

                // Instead of direct upload, show the title modal
                setPendingVideoUri(videoUri);
                setTitleModalVisible(true);
            } catch (e) {
                console.warn(e);
            }
        }
    };

    const handleTitleSubmit = async () => {
        if (!videoTitle.trim()) {
            Alert.alert(t('common.error'), t('videos.enterTitleError'));
            return;
        }

        const videoUri = pendingVideoUri;
        const title = videoTitle.trim();

        setTitleModalVisible(false);
        setVideoTitle('');
        setPendingVideoUri(null);

        setIsUploading(true);
        try {
            // Upload to Cloudinary and save
            await addUserClip(videoUri, title);
            Alert.alert("Success", "Video uploaded successfully!");
        } catch (uploadError) {
            console.error('Upload error:', uploadError);
            Alert.alert("Error", uploadError.message || "Failed to upload video. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    const renderLiveItem = ({ item }) => (
        <TouchableOpacity
            style={styles.liveCard}
            onPress={() => navigation.navigate('VideoPlayer', { item })}
        >
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
            <View style={styles.liveBadge}>
                <Text style={styles.liveText}>{t('videos.live')}</Text>
            </View>
            <View style={styles.viewerBadge}>
                <Ionicons name="eye" size={12} color="#FFFFFF" />
                <Text style={styles.viewerText}>{item.viewers}</Text>
            </View>

            <View style={styles.cardInfo}>
                <TouchableOpacity onPress={() => navigation.navigate('PlayersProfile', { player: { name: item.streamer, avatar: item.avatar, username: '@' + item.streamer } })}>
                    <Avatar uri={item.avatar} size={50} style={{ marginRight: 15 }} showOnline={true} online={true} />
                </TouchableOpacity>
                <View style={styles.textInfo}>
                    <Text style={styles.streamTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.streamerName}>{item.streamer} • {item.game}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderClipItem = ({ item }) => (
        <TouchableOpacity
            style={styles.clipCard}
            onPress={() => navigation.navigate('VideoPlayer', { item })}
        >
            <Image source={{ uri: item.thumbnail }} style={styles.clipThumbnail} />
            <View style={styles.playOverlay}>
                <BlurView intensity={20} style={styles.playButton}>
                    <Ionicons name="play" size={24} color="#FFFFFF" />
                </BlurView>
            </View>
            <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{item.duration}</Text>
            </View>
            <View style={styles.clipInfo}>
                <Text style={styles.clipTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.clipMeta}>
                    <TouchableOpacity onPress={() => navigation.navigate('PlayersProfile', { player: { name: item.streamer, avatar: item.avatar, username: '@' + item.streamer } })}>
                        <Avatar uri={item.avatar} size={20} />
                    </TouchableOpacity>
                    <Text style={styles.clipViews}>{item.views} {t('videos.views')}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenBackground>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('videos.watch')}</Text>
            </View>

            {/* TABS */}
            <View style={styles.tabsContainer}>
                <View style={styles.tabsWrapper}>
                    {['Lives', 'Clips'].map((tab) => (
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
                            ]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.contentContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#8B5CF6" />
                        <Text style={styles.loadingText}>{t('videos.loading', { type: activeTab })}</Text>
                    </View>
                ) : activeTab === 'Lives' ? (
                    lives.length > 0 ? (
                        <FlatList
                            key="lives-list"
                            data={lives}
                            renderItem={renderLiveItem}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="videocam-off-outline" size={48} color="rgba(255,255,255,0.3)" />
                            <Text style={styles.emptyText}>{t('videos.noLiveStreams')}</Text>
                            <Text style={styles.emptySubText}>{t('videos.beFirstLive')}</Text>
                        </View>
                    )
                ) : (
                    <View style={{ flex: 1 }}>
                        {userClips.length > 0 ? (
                            <FlatList
                                key="clips-grid"
                                data={userClips}
                                renderItem={renderClipItem}
                                keyExtractor={item => item.id}
                                numColumns={2}
                                columnWrapperStyle={styles.columnWrapper}
                                contentContainerStyle={styles.gridContent}
                                showsVerticalScrollIndicator={false}
                            />
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="film-outline" size={48} color="rgba(255,255,255,0.3)" />
                                <Text style={styles.emptyText}>{t('videos.noClips')}</Text>
                                <Text style={styles.emptySubText}>{t('videos.uploadFirst')}</Text>
                            </View>
                        )}
                        {/* Post Clip Button */}
                        <TouchableOpacity style={styles.fabBtn} onPress={pickVideo}>
                            <LinearGradient
                                colors={['#8B5CF6', '#7C3AED']}
                                style={styles.fabGradient}
                            >
                                <Ionicons name="add" size={28} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Upload Loading Overlay */}
            {isUploading && (
                <View style={styles.uploadOverlay}>
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
                        <View style={styles.uploadContent}>
                            <ActivityIndicator size="large" color="#8B5CF6" />
                            <Text style={styles.uploadText}>{t('videos.uploading')}</Text>
                            <Text style={styles.uploadSubText}>{t('videos.uploadWait')}</Text>
                        </View>
                    </BlurView>
                </View>
            )}

            {/* Title Selection Modal */}
            <Modal
                visible={titleModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setTitleModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={90} tint="dark" style={styles.modalBlur}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Ionicons name="text-outline" size={24} color="#8B5CF6" />
                                <Text style={styles.modalTitle}>{t('videos.giveTitle')}</Text>
                            </View>

                            <TextInput
                                style={styles.titleInput}
                                placeholder={t('videos.titlePlaceholder')}
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={videoTitle}
                                onChangeText={setVideoTitle}
                                autoFocus={true}
                                maxLength={50}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => {
                                        setTitleModalVisible(false);
                                        setVideoTitle('');
                                    }}
                                >
                                    <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.confirmBtn}
                                    onPress={handleTitleSubmit}
                                >
                                    <LinearGradient
                                        colors={['#8B5CF6', '#7C3AED']}
                                        style={styles.confirmGradient}
                                    >
                                        <Text style={styles.confirmText}>{t('videos.postClip')}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BlurView>
                </View>
            </Modal>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    tabsContainer: {
        alignItems: 'center',
        paddingVertical: 15,
        marginBottom: 5,
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
    contentContainer: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    liveCard: {
        marginBottom: 20,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    thumbnail: {
        width: '100%',
        height: 200,
        borderRadius: 20,
    },
    liveBadge: {
        position: 'absolute',
        top: 15,
        left: 15,
        backgroundColor: '#FF3D00',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    liveText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
    },
    viewerBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    viewerText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    cardInfo: {
        flexDirection: 'row',
        padding: 15,
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#8B5CF6',
    },
    textInfo: {
        flex: 1,
    },
    streamTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    streamerName: {
        color: '#94A3B8',
        fontSize: 13,
    },

    // CLIPS STYLES
    gridContent: {
        paddingHorizontal: 15,
        paddingBottom: 100,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    clipCard: {
        width: (width - 45) / 2,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    clipThumbnail: {
        width: '100%',
        height: 120, // Vertical video style for clips
        resizeMode: 'cover',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        height: 120,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        overflow: 'hidden',
    },
    durationBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    durationText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    clipInfo: {
        padding: 10,
    },
    clipTitle: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        height: 36, // Fixed height for 2 lines
    },
    clipMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    clipAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    clipViews: {
        color: '#64748B',
        fontSize: 11,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'rgba(255,255,255,0.5)',
        marginTop: 10,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 15,
    },
    emptySubText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginTop: 5,
    },
    fabBtn: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        borderRadius: 30,
        elevation: 5,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    fabGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    uploadContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 20,
    },
    uploadSubText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        marginTop: 8,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalBlur: {
        width: width * 0.85,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    modalContent: {
        padding: 25,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },
    titleInput: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 15,
        color: '#FFFFFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 25,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 15,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    cancelText: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmBtn: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden',
    },
    confirmGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
