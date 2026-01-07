import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
    ActivityIndicator,
} from 'react-native';
import { collection, query, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { fetchGameDetails } from '../../services/api';
import { useUser } from '../../context/UserContext';
import { auth } from '../../services/firebase';
import { t } from '../../i18n';
import Avatar from '../../components/Avatar';

const { width, height } = Dimensions.get('window');

const LIVES_DATA = [
    {
        id: '1',
        title: 'Quick Valorant Watchparty',
        streamer: '@usero11',
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
        avatar: null,
        viewers: '3.7k',
        isLive: true
    },
    {
        id: '2',
        title: 'Gold to Diamond climb!',
        streamer: '@pro_gamer',
        thumbnail: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=2070&auto=format&fit=crop',
        avatar: null,
        viewers: '1.2k',
        isLive: true
    }
];

export default function GameDetailScreen({ route, navigation }) {
    const { game } = route.params || {
        title: 'VALORANT',
        image: 'https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?w=800&q=80'
    };

    const { followedGames, toggleFollowGame } = useUser();
    const isFollowing = followedGames.some(g => String(g.id) === String(game.id));
    const [isExpanded, setIsExpanded] = useState(false);
    const [gameDetails, setGameDetails] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingPlayers, setLoadingPlayers] = useState(false);

    useEffect(() => {
        if (game?.id && typeof game.id === 'number') {
            loadGameDetails();
        }
        fetchPlayers();
    }, [game?.id]);

    const fetchPlayers = async () => {
        setLoadingPlayers(true);
        try {
            // Filter players who have this game in their 'games' array
            // Limit to 5 as requested (display 4-5 depending on space)
            const q = query(
                collection(db, 'users'),
                where('games', 'array-contains', game.id),
                limit(5)
            );
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
                    isOnline: data.isOnline || false
                });
            });
            setPlayers(playersList);
        } catch (error) {
            console.error("Error fetching players in GameDetail:", error);
        } finally {
            setLoadingPlayers(false);
        }
    };

    const loadGameDetails = async () => {
        setLoading(true);
        try {
            const details = await fetchGameDetails(game.id);
            if (details) {
                setGameDetails(details);
            }
        } catch (error) {
            console.error('Error loading game details:', error);
        } finally {
            setLoading(false);
        }
    };

    // Use API data if available, otherwise fallback to passed game data or defaults
    const displayTitle = gameDetails?.title || game?.title || 'VALORANT';
    const displayImage = gameDetails?.image || gameDetails?.backgroundImage || game?.image || 'https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?w=800&q=80';
    const description = gameDetails?.description || game?.description || "Valorant is a free-to-play first-person hero shooter developed and published by Riot Games, for Windows. First teased under the codename Project A in October 2019, the game began a closed beta period with limited access on April 7, 2020, followed by a full release on June 2, 2020.";

    return (
        <View style={styles.container}>
            {/* HERO BACKGROUND - PERSISTENT AT BOTTOM */}
            <ImageBackground
                source={{ uri: displayImage }}
                style={styles.heroBackground}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(15, 15, 61, 0.8)', '#0F0F3D']}
                    style={StyleSheet.absoluteFill}
                />
            </ImageBackground>

            {/* FIXED TOP BUTTONS OVERLAY */}
            <TouchableOpacity
                style={styles.topActionBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
            >
                <BlurView intensity={20} tint="dark" style={styles.actionBlur}>
                    <Ionicons name="chevron-back" size={24} color="#FFF" />
                </BlurView>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.topActionBtn, styles.rightActionBtn]} activeOpacity={0.7}>
                <BlurView intensity={20} tint="dark" style={styles.actionBlur}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#FFF" />
                </BlurView>
            </TouchableOpacity>

            {/* SCROLLABLE CONTENT */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Spacer to push content down to current layout height */}
                <View style={styles.heroSpacer} />

                {/* CATEGORY & FOLLOW BUTTONS - Now part of scroll but at expected height */}
                <View style={styles.heroSubRow}>
                    <View style={styles.categoryPill}>
                        <BlurView
                            intensity={30}
                            tint="dark"
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(150, 150, 150, 0.25)' }]} />
                        <Text style={styles.categoryText}>
                            {Array.isArray(game.genres)
                                ? game.genres[0]
                                : (game.genre || (game.genres ? game.genres.split(' - ')[0] : 'Action'))}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.followBtn, isFollowing && styles.followingBtn]}
                        onPress={() => {
                            const gameToFollow = {
                                id: gameDetails?.id || game?.id,
                                title: gameDetails?.title || game?.title,
                                image: gameDetails?.image || game?.image || gameDetails?.backgroundImage,
                                genres: gameDetails?.genres || game?.genres
                            };
                            if (gameToFollow.id) {
                                toggleFollowGame(gameToFollow);
                            } else {
                                console.warn("Game ID missing in GameDetailScreen");
                            }
                        }}
                    >
                        <LinearGradient
                            colors={isFollowing ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['#6662FC', '#8B5CF6']}
                            style={styles.followGradient}
                        >
                            <Text style={styles.followText}>{isFollowing ? t('search.following') : t('search.follow')}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* GLASS CONTENT SHEET (0.55 / 25) */}
                <View style={styles.glassSheet}>
                    <View style={styles.glassBackdrop}>
                        <BlurView
                            intensity={25}
                            tint="dark"
                            experimentalBlurMethod="dimezisBlurView"
                            style={StyleSheet.absoluteFill}
                        />
                        <LinearGradient
                            colors={['rgba(15, 15, 61, 0.55)', 'rgba(58, 58, 138, 0.55)']}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </View>

                    <View style={styles.contentLayer}>
                        {/* GAME TITLE IN GLASS SHEET */}
                        <Text style={styles.glassTitle}>{displayTitle}</Text>

                        {/* STATS ROW */}
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <Ionicons name="people" size={20} color="#94A3B8" />
                                <Text style={styles.statVal}>10M</Text>
                                <Text style={styles.statLabel}>{t('profile.followers')}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Ionicons name="game-controller" size={20} color="#94A3B8" />
                                <Text style={styles.statVal}>50.6M</Text>
                                <Text style={styles.statLabel}>{t('players.players')}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <MaterialCommunityIcons name="broadcast" size={20} color="#94A3B8" />
                                <Text style={styles.statVal}>1.8K</Text>
                                <Text style={styles.statLabel}>Streamers</Text>
                            </View>
                        </View>

                        {/* DESCRIPTION */}
                        <Text style={styles.descriptionText} numberOfLines={isExpanded ? 0 : 2}>
                            {description}
                        </Text>
                        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                            <Text style={styles.readMoreText}>{isExpanded ? 'Show less' : 'Read more'}</Text>
                        </TouchableOpacity>

                        {/* LIVES SECTION */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('videos.lives')}</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {LIVES_DATA.map(live => (
                                <TouchableOpacity
                                    key={live.id}
                                    style={styles.liveCard}
                                    onPress={() => navigation.navigate('VideoPlayer', { item: live })}
                                >
                                    <ImageBackground source={{ uri: live.thumbnail }} style={styles.liveThumb} imageStyle={{ borderRadius: 20 }}>
                                        <View style={styles.liveTag}>
                                            <Text style={styles.liveTagText}>Live</Text>
                                        </View>
                                        <View style={styles.viewersTag}>
                                            <Ionicons name="eye" size={12} color="#FFF" />
                                            <Text style={styles.viewersText}>{live.viewers}</Text>
                                        </View>
                                    </ImageBackground>
                                    <View style={styles.liveInfoRow}>
                                        <Avatar uri={live.avatar} size={32} />
                                        <View style={styles.liveTextContent}>
                                            <Text style={styles.liveTitle} numberOfLines={1}>{live.title}</Text>
                                            <Text style={styles.liveUser}>{live.streamer}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* PLAYERS SECTION */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{t('players.players')}</Text>
                            {players.length > 0 && (
                                <TouchableOpacity onPress={() => navigation.navigate('PlayersList', { gameTitle: game.title, gameId: game.id })}>
                                    <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {loadingPlayers ? (
                                <ActivityIndicator size="small" color="#8B5CF6" style={{ marginLeft: 25 }} />
                            ) : players.length > 0 ? (
                                players.map(player => (
                                    <TouchableOpacity
                                        key={player.id}
                                        style={styles.playerCircle}
                                        onPress={() => {
                                            if (player.uid === auth.currentUser?.uid) {
                                                navigation.navigate('Main', { screen: 'Profile' });
                                            } else {
                                                navigation.navigate('PlayersProfile', { player });
                                            }
                                        }}
                                    >
                                        <Avatar
                                            uri={player.avatar}
                                            size={60}
                                            showOnline={true}
                                            online={player.isOnline}
                                        />
                                    </TouchableOpacity>
                                ))
                            ) : (
                                <Text style={[styles.descriptionText, { marginLeft: 25, fontStyle: 'italic' }]}>
                                    {t('players.noPlayersYet') || t('home.noGamesFound')}
                                </Text>
                            )}
                        </ScrollView>

                        <View style={{ height: 100 }} />
                    </View>
                </View>
            </ScrollView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F3D',
    },
    heroBackground: {
        position: 'absolute',
        width: '100%',
        height: height * 0.55,
        justifyContent: 'center',
    },
    topActionBtn: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        zIndex: 100,
    },
    rightActionBtn: {
        left: undefined,
        right: 20,
    },
    actionBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroTitleContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    heroTitle: {
        fontSize: 52,
        fontWeight: '900',
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 10,
    },
    heroSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 25,
        marginBottom: 20, // Space before glass sheet
        zIndex: 20,
    },
    categoryPill: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        overflow: 'hidden',
    },
    categoryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    followBtn: {
        borderRadius: 25,
        overflow: 'hidden',
        width: 110,
    },
    followGradient: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        alignItems: 'center',
    },
    followText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    scrollContent: {
        flexGrow: 1,
    },
    heroSpacer: {
        height: height * 0.45,
    },
    glassSheet: {
        flex: 1,
        minHeight: height * 0.6,
    },
    glassBackdrop: {
        ...StyleSheet.absoluteFillObject,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        overflow: 'hidden',
    },
    contentLayer: {
        flex: 1,
        paddingHorizontal: 25,
        paddingTop: 35,
    },
    glassTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        textTransform: 'uppercase',
        marginBottom: 20,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 15,
        borderRadius: 25,
    },
    statBox: {
        alignItems: 'center',
        flex: 1,
    },
    statVal: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        marginTop: 4,
    },
    statLabel: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '500',
    },
    descriptionText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        lineHeight: 22,
    },
    readMoreText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginTop: 4,
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },
    seeAllText: {
        color: '#94A3B8',
        fontSize: 13,
    },
    horizontalScroll: {
        marginHorizontal: -25,
        paddingLeft: 25,
        marginBottom: 35,
    },
    liveCard: {
        width: 200,
        marginRight: 15,
    },
    liveThumb: {
        width: 200,
        height: 120,
        padding: 10,
        justifyContent: 'space-between',
    },
    liveTag: {
        backgroundColor: '#FF4081',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    liveTagText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    viewersTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        alignSelf: 'flex-end',
        gap: 4,
    },
    viewersText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
    },
    liveInfoRow: {
        flexDirection: 'row',
        marginTop: 10,
        alignItems: 'center',
    },
    liveAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#6662FC',
    },
    liveTextContent: {
        marginLeft: 10,
        flex: 1,
    },
    liveTitle: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
    liveUser: {
        color: '#94A3B8',
        fontSize: 11,
    },
    playerCircle: {
        marginRight: 15,
        position: 'relative',
    },
    playerImg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: '#6662FC',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#00E676',
        borderWidth: 2,
        borderColor: '#0F0F3D',
    },
});
