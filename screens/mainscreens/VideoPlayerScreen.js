import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { Video } from 'expo-av';
import CustomProgressBar from '../../components/CustomProgressBar';
import { getAuth } from 'firebase/auth'; // Direct access fallback
import { useUser } from '../../context/UserContext';
import { toggleLikeVideo, checkIsVideoLiked } from '../../services/firestore';

const { width, height } = Dimensions.get('window');

export default function VideoPlayerScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { item } = route.params || {};
    const videoRef = useRef(null);
    const [status, setStatus] = useState({});
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // LIKE LOGIC
    const { currentUser: contextUser } = useUser();
    const auth = getAuth();
    // Use context user if available, otherwise fallback to direct Firebase auth
    const currentUser = contextUser || auth.currentUser;
    const [isLiked, setIsLiked] = useState(false);

    useEffect(() => {
        if (currentUser && item?.id) {
            checkIsVideoLiked(currentUser.uid, item.id).then(status => {
                setIsLiked(status);
            });
        }
    }, [currentUser, item]);

    const handleLikePress = async () => {
        if (!currentUser) {
            console.warn("No user found (checked both context and Firebase auth).");
            alert("Please login to like videos!");
            return;
        }

        // Optimistic update
        const newStatus = !isLiked;
        setIsLiked(newStatus);

        try {
            const confirmedStatus = await toggleLikeVideo(currentUser.uid, item);
            setIsLiked(confirmedStatus);
        } catch (error) {
            // Revert on error
            setIsLiked(!newStatus);
            console.error(error);
        }
    };

    if (!item) return null;

    const togglePlayPause = async () => {
        if (videoRef.current) {
            if (isPlaying) {
                await videoRef.current.pauseAsync();
            } else {
                await videoRef.current.playAsync();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = async (seekTime) => {
        if (videoRef.current) {
            await videoRef.current.setPositionAsync(seekTime);
            setPosition(seekTime); // Optimistic update
        }
    };

    const videoUrl = item.videoUrl || item.cloudinaryUrl || item.videoUri;

    return (
        <View style={styles.container}>
            {/* Video Player */}
            <Video
                ref={videoRef}
                source={{ uri: videoUrl }}
                style={styles.videoBackground}
                resizeMode="contain"
                shouldPlay={false}
                isLooping
                onPlaybackStatusUpdate={(status) => {
                    setStatus(status);
                    if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);
                        setDuration(status.durationMillis);
                        setPosition(status.positionMillis);
                    }
                }}
            />

            {/* Overlay Gradient/Tint */}
            <View style={styles.overlay} />

            {/* Header Controls */}
            <TouchableOpacity
                style={styles.closeButton}
                onPress={() => navigation.goBack()}
            >
                <BlurView intensity={30} tint="dark" style={styles.blurBtn}>
                    <Ionicons name="close" size={24} color="#FFFFFF" />
                </BlurView>
            </TouchableOpacity>

            {/* Center Play/Pause Button */}
            <TouchableOpacity style={styles.centerPlay} onPress={togglePlayPause}>
                <Ionicons
                    name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
                    size={80}
                    color="rgba(255,255,255,0.8)"
                />
            </TouchableOpacity>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
                {/* Custom Progress Bar from Component */}
                <CustomProgressBar
                    currentTime={position}
                    duration={duration}
                    onSeek={handleSeek}
                />

                <View style={styles.mainInfoRow}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('PlayersProfile', {
                            player: {
                                name: item.streamer,
                                avatar: item.avatar,
                                username: '@' + item.streamer
                            }
                        })}
                    >
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    </TouchableOpacity>

                    <View style={styles.textInfo}>
                        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.subtitle}>{item.streamer}</Text>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.actionBtn} onPress={handleLikePress}>
                            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={28} color={isLiked ? "#FF4081" : "#FFFFFF"} />
                            <Text style={styles.actionText}>{isLiked ? "Liked" : "Like"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn}>
                            <Ionicons name="share-social-outline" size={28} color="#FFFFFF" />
                            <Text style={styles.actionText}>Share</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    videoBackground: {
        width: width,
        height: height,
        position: 'absolute',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 50, // Ensure strictly above overlay
    },
    blurBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    centerPlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomControls: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        zIndex: 50, // Ensure strictly above overlay/video
    },
    mainInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#6662FC',
        marginRight: 15,
    },
    textInfo: {
        flex: 1,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    subtitle: {
        color: '#E2E8F0',
        fontSize: 16,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 20,
    },
    actionBtn: {
        alignItems: 'center',
    },
    actionText: {
        color: '#FFFFFF',
        fontSize: 12,
        marginTop: 4,
    },
});
