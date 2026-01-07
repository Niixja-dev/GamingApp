import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ImageBackground, Dimensions, ScrollView, Image, Text, TouchableOpacity, Pressable, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firestore';
import { auth } from '../../services/firebase';
import { t } from '../../i18n';

// Reusing profile components (adjusting paths)
import ProfileHomeScreen from '../profile/ProfileHomeScreen';
import ProfileAboutScreen from '../profile/ProfileAboutScreen';
import ProfileVideoScreen from '../profile/ProfileVideoScreen';
import ProfileLikesScreen from '../profile/ProfileLikesScreen';
import { useUser } from '../../context/UserContext';
import { FeedProvider } from '../../context/FeedContext';
import { GAMES, PLATFORMS, getGameColor } from '../../constants/GameData';
import Avatar from '../../components/Avatar';

const { width, height } = Dimensions.get('window');

export default function PlayersProfileScreen() {
    const route = useRoute();
    const navigation = useNavigation();
    const { toggleFollowPlayer, followedPlayers } = useUser();
    const { player } = route.params || { player: { name: 'Player', username: '@player', avatar: 'https://i.pravatar.cc/200' } };

    const [activeTab, setActiveTab] = React.useState('Home');
    // Check if following using safe ID check
    const playerId = player.uid || player.id;
    const isFollowing = followedPlayers.some(p => (p.uid || p.id) === playerId);

    const [optionsVisible, setOptionsVisible] = React.useState(false);
    const [playerData, setPlayerData] = useState(player);

    const handleFollowPress = async () => {
        await toggleFollowPlayer(player);
    };

    useEffect(() => {
        if (!player.id) return;

        const unsubscribe = onSnapshot(doc(db, 'users', player.id), (docSnap) => {
            if (docSnap.exists()) {
                setPlayerData({ ...player, ...docSnap.data() });
            }
        });

        return () => unsubscribe();
    }, [player.id]);

    // Online Status based on Firestore data
    const isOnline = playerData.isOnline || false;
    const statusColors = isOnline ? ['#00E676', '#00C853'] : ['#FF3D00', '#D50000'];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Home': return <ProfileHomeScreen />;
            case 'About': return <ProfileAboutScreen />;
            case 'Video': return <ProfileVideoScreen />;
            case 'Likes': return <ProfileLikesScreen userId={player.id || player.uid} />;
            default: return <ProfileHomeScreen />;
        }
    };

    const tabs = [
        { id: 'Home', label: t('profile.tabs.home') },
        { id: 'About', label: t('profile.tabs.about') },
        { id: 'Video', label: t('profile.tabs.video') },
        { id: 'Likes', label: t('profile.tabs.likes') }
    ];

    return (
        <FeedProvider userId={player.id || player.uid}>
            <PlayersProfileContent
                player={player}
                playerData={playerData}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isFollowing={isFollowing}
                handleFollowPress={handleFollowPress}
                isOnline={isOnline}
                renderTabContent={renderTabContent}
                tabs={tabs}
                setOptionsVisible={setOptionsVisible}
                optionsVisible={optionsVisible}
                navigation={navigation}
            />
        </FeedProvider>
    );
}

function PlayersProfileContent({
    player, playerData, activeTab, setActiveTab, isFollowing,
    handleFollowPress, isOnline, renderTabContent, tabs,
    setOptionsVisible, optionsVisible, navigation
}) {
    return (
        <View style={styles.container}>
            {/* 1. MASTER BACKGROUND (WALLPAPER) */}
            <ImageBackground
                source={playerData.coverPhoto ? { uri: playerData.coverPhoto } : require('../../assets/bulles-sur-fond-noir.jpg')}
                style={styles.absoluteHero}
                resizeMode="cover"
                resizeMethod="resize"
            >
                <LinearGradient
                    colors={['rgba(15, 15, 61, 0.15)', 'rgba(15, 15, 61, 0.95)']}
                    style={styles.fullOverlay}
                />
            </ImageBackground>

            {/* FLOATING SYSTEM BUTTONS (Back & Options) */}
            <TouchableOpacity
                style={styles.floatingNotif}
                onPress={() => navigation.goBack()}
            >
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.floatingOptions}
                onPress={() => setOptionsVisible(true)}
            >
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="ellipsis-horizontal-circle" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* 2. SCROLLING SURFACE */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* HERO AREA (SPACER) */}
                <View style={styles.heroHeaderArea}>
                    <View style={styles.avatarWrapper}>
                        <Avatar
                            uri={playerData.avatar}
                            size={106}
                            showOnline={true}
                            online={isOnline}
                        />
                    </View>
                </View>

                {/* 3. GLASS SHEET */}
                <View style={styles.glassSheet}>
                    {/* BACKDROP : DYNAMIC BLUR (0.42 / 25) */}
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

                    {/* CONTENT LAYER */}
                    <View style={styles.contentOverlay}>

                        {/* IDENTITY SECTION (ABSOLUTE FOR ICONS) */}
                        <View style={styles.identityWrapper}>
                            {/* NEW TOP ROW (Medal & Follow) */}
                            <TouchableOpacity style={styles.medalStatic}>
                                <MaterialCommunityIcons name="medal" size={28} color="#FFD15B" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.langBtnStatic, isFollowing && { backgroundColor: '#8B5CF6' }]}
                                onPress={handleFollowPress}
                            >
                                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                                <Ionicons name={isFollowing ? "checkmark" : "add"} size={20} color="#FFFFFF" />
                            </TouchableOpacity>

                            {/* CENTERED INFO */}
                            <View style={styles.infoCenterBlock}>
                                <Text style={styles.userName}>{player.name}</Text>
                                <Text style={styles.location}>{player.username}</Text>

                                {playerData.followedUids?.includes(auth.currentUser?.uid) && (
                                    <View style={[styles.followsYouBadge, { marginTop: 8 }]}>
                                        <Text style={styles.followsYouText}>{t('profile.followsYou')}</Text>
                                    </View>
                                )}

                                {playerData.platforms && playerData.platforms.length > 0 && (
                                    <View style={styles.platformsContainer}>
                                        {playerData.platforms.map(platformId => {
                                            const platform = PLATFORMS.find(p => p.id === platformId);
                                            if (!platform) return null;
                                            return (
                                                <View key={platformId} style={[styles.platformBadge, { backgroundColor: platform.color }]}>
                                                    <Ionicons name={platform.icon} size={12} color="#FFF" />
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* TAGS */}
                        <View style={styles.tagsRow}>
                            {playerData.games && playerData.games.length > 0 ? (
                                playerData.games.map(gameId => {
                                    const game = GAMES.find(g => g.id === gameId);
                                    const gameName = game ? game.name : (playerData.gameNames?.[gameId] || gameId);
                                    const gameColor = getGameColor(gameId, gameName);
                                    const rank = playerData.ranks && playerData.ranks[gameId] ? playerData.ranks[gameId] : "Unranked";

                                    return (
                                        <TouchableOpacity
                                            key={gameId}
                                            style={[styles.tag, { backgroundColor: `${gameColor}26` }]}
                                            onPress={() => Alert.alert(`${gameName} Rank`, `${rank}`)}
                                        >
                                            <Text style={[styles.tagText, { color: gameColor }]}>{gameName}</Text>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : (
                                <Text style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                                    {t('profile.noGamesSelected')}
                                </Text>
                            )}
                        </View>

                        {/* STATS */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>{t('profile.posts')}</Text>
                                <Text style={styles.statNum}>{playerData.postsCount > 999 ? (playerData.postsCount / 1000).toFixed(1) + 'K' : playerData.postsCount || 0}</Text>
                            </View>
                            <View style={styles.vDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>{t('profile.followers')}</Text>
                                <Text style={styles.statNum}>{playerData.followersCount > 999 ? (playerData.followersCount / 1000).toFixed(1) + 'K' : playerData.followersCount || 0}</Text>
                            </View>
                            <View style={styles.vDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>{t('profile.following')}</Text>
                                <Text style={styles.statNum}>{playerData.followingCount > 999 ? (playerData.followingCount / 1000).toFixed(1) + 'K' : playerData.followingCount || 0}</Text>
                            </View>
                        </View>

                        {/* TABS */}
                        <View style={styles.tabsRow}>
                            {tabs.map((tab) => (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={styles.tabContainer}
                                    onPress={() => setActiveTab(tab.id)}
                                >
                                    <Text
                                        style={activeTab === tab.id ? styles.activeLabel : styles.tabLabel}
                                    >
                                        {tab.label}
                                    </Text>
                                    {activeTab === tab.id && <View style={styles.activeIndicatorNeon} />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* DYNAMIC CONTENT */}
                        <View style={styles.tabContentArea}>
                            {renderTabContent()}
                        </View>
                        <View style={{ height: 100 }} />
                    </View>
                </View>
            </ScrollView>
            {/* OPTIONS MODAL */}
            <Modal
                transparent={true}
                visible={optionsVisible}
                animationType="fade"
                onRequestClose={() => setOptionsVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setOptionsVisible(false)}>
                    <BlurView
                        intensity={40}
                        tint="dark"
                        experimentalBlurMethod="dimezisBlurView"
                        style={styles.optionsContainer}
                    >
                        <View style={styles.optionsInner}>
                            <Text style={styles.optionsHeader}>Options for {player.name}</Text>

                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => {
                                    setOptionsVisible(false);
                                    navigation.navigate('DMScreen', { user: player });
                                }}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(77, 77, 255, 0.15)' }]}>
                                    <Ionicons name="chatbubble-ellipses" size={20} color="#4D4DFF" />
                                </View>
                                <Text style={styles.optionLabel}>Send Message</Text>
                                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={() => {
                                    setOptionsVisible(false);
                                    Alert.alert('Blocked', `${player.name} has been blocked.`);
                                }}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 61, 0, 0.15)' }]}>
                                    <Ionicons name="ban" size={20} color="#FF3D00" />
                                </View>
                                <Text style={[styles.optionLabel, { color: '#FF3D00' }]}>Block User</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F3D'
    },
    absoluteHero: {
        position: 'absolute',
        width: '100%',
        height: height,
    },
    fullOverlay: {
        ...StyleSheet.absoluteFillObject
    },
    scrollContent: {
        flexGrow: 1
    },
    heroHeaderArea: {
        height: 280,
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    avatarWrapper: {
        marginBottom: -53,
        zIndex: 100
    },
    avatarBorder: {
        width: 106,
        height: 106,
        borderRadius: 53,
        borderWidth: 3, // Wide status border
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F0F3D', // MASK: Hides the background split line
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#0F0F3D'
    },
    avatarPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    glassSheet: {
        flex: 1,
        minHeight: height - 100,
        backgroundColor: 'transparent'
    },
    glassBackdrop: {
        ...StyleSheet.absoluteFillObject,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        overflow: 'hidden',
    },
    contentOverlay: {
        flex: 1,
        paddingTop: 50, // Move icons higher up to meet avatar bottom
        paddingHorizontal: 20
    },
    identityWrapper: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 35,
        minHeight: 60, // Ensure enough space for absolute icons
    },
    medalStatic: {
        position: 'absolute',
        left: 0,
        top: -42,
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoCenterBlock: {
        alignItems: 'center',
        marginTop: 5,
    },
    userName: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '900',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    followsYouBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    followsYouText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    location: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2
    },
    platformsContainer: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 6,
        justifyContent: 'center'
    },
    platformBadge: {
        width: 20,
        height: 20,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    langBtnStatic: {
        position: 'absolute',
        right: 0,
        top: -42,
        width: 44,
        height: 32,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        overflow: 'hidden',
        marginTop: 5,
    },
    floatingNotif: {
        position: 'absolute',
        left: 20,
        top: 60,
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 1000,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    floatingOptions: {
        position: 'absolute',
        right: 20,
        top: 60,
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        zIndex: 1000,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 35
    },
    tag: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20
    },
    tagText: {
        fontSize: 13,
        fontWeight: '700'
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 40,
        paddingHorizontal: 10
    },
    statItem: {
        alignItems: 'center'
    },
    statLabel: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8
    },
    statNum: {
        color: '#FFFFFF',
        fontSize: 19,
        fontWeight: '900'
    },
    vDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    tabsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 0,
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        paddingBottom: 2,
    },
    tab: {
        alignItems: 'center'
    },
    tabLabel: {
        color: '#94A3B8',
        fontSize: 15,
        fontWeight: '700'
    },
    activeLabel: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
    activeIndicatorNeon: {
        width: '100%',
        height: 3,
        backgroundColor: '#4D4DFF',
        borderRadius: 2,
        marginTop: 6,
        marginBottom: -3,
        shadowColor: '#4D4DFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    tabContainer: {
        alignItems: 'center',
        paddingHorizontal: 0,
    },
    tabContentArea: {
        minHeight: 300,
    },
    // MODAL STYLES
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    optionsContainer: {
        width: 300,
        backgroundColor: 'rgba(15, 15, 61, 0.9)',
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: 'rgba(77, 77, 255, 0.4)',
        overflow: 'hidden',
        padding: 5,
    },
    optionsInner: {
        padding: 20,
    },
    optionsHeader: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optionLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
});
