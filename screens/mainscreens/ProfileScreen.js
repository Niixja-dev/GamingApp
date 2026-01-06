import React from 'react';
import { View, StyleSheet, ImageBackground, Dimensions, ScrollView, Image, Text, TouchableOpacity, Modal, Pressable, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import ProfileHomeScreen from '../profile/ProfileHomeScreen';
import ProfileAboutScreen from '../profile/ProfileAboutScreen';
import ProfileVideoScreen from '../profile/ProfileVideoScreen';
import ProfileLikesScreen from '../profile/ProfileLikesScreen';
import LanguageSelector from '../../components/LanguageSelector';
import { useUser } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../i18n';
import { GAMES, PLATFORMS, getGameColor } from '../../constants/GameData';
import { auth } from '../../services/firebase';
import Avatar from '../../components/Avatar';
import { FeedProvider, useFeed } from '../../context/FeedContext';

const { width, height } = Dimensions.get('window');

// 1. MASTER WRAPPER
export default function ProfileScreen({ navigation }) {
    return (
        <FeedProvider userId={null}>
            <ProfileScreenContent navigation={navigation} />
        </FeedProvider>
    );
}

// 2. ACTUAL CONTENT COMPONENT
function ProfileScreenContent({ navigation }) {
    const {
        isOnline,
        username,
        location,
        avatar,
        coverPhoto,
        postsCount,
        followersCount,
        followingCount,
        games,
        gameNames,
        platforms,
        ranks
    } = useUser();

    const currentUser = auth.currentUser;

    const { currentLanguage, changeLanguage } = useLanguage();
    const { refreshing, refreshFeed } = useFeed();

    const [activeTab, setActiveTab] = React.useState('Home');
    const [modalVisible, setModalVisible] = React.useState(false);

    const selectLanguage = (lang) => {
        changeLanguage(lang);
        setModalVisible(false);
    };

    const handleNotifPress = () => {
        navigation.navigate('Notifications');
    };

    const handleOptionsPress = () => {
        navigation.navigate('Settings');
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Home': return <ProfileHomeScreen />;
            case 'About': return <ProfileAboutScreen />;
            case 'Video': return <ProfileVideoScreen />;
            case 'Likes': return <ProfileLikesScreen userId={currentUser?.uid} />;
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
        <View style={styles.container}>
            {/* 1. MASTER BACKGROUND (WALLPAPER) */}
            <ImageBackground
                source={coverPhoto ? { uri: coverPhoto } : require('../../assets/bulles-sur-fond-noir.jpg')}
                style={styles.absoluteHero}
                resizeMode="cover"
                resizeMethod="resize"
            >
                <LinearGradient
                    colors={['rgba(15, 15, 61, 0.15)', 'rgba(15, 15, 61, 0.95)']}
                    style={styles.fullOverlay}
                />
            </ImageBackground>

            {/* FLOATING SYSTEM BUTTONS */}
            <TouchableOpacity
                style={styles.floatingNotif}
                onPress={handleNotifPress}
            >
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                <View style={styles.notifBadge} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.floatingOptions}
                onPress={handleOptionsPress}
            >
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <Ionicons name="ellipsis-horizontal-circle" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* 2. SCROLLING SURFACE */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refreshFeed}
                        tintColor="#4D4DFF"
                        colors={["#4D4DFF"]}
                    />
                }
            >
                {/* HERO AREA (SPACER) */}
                <View style={styles.heroHeaderArea}>
                    <View style={styles.avatarWrapper}>
                        <Avatar
                            uri={avatar}
                            size={106}
                            showOnline={true}
                            online={isOnline}
                        />
                    </View>
                </View>

                {/* 3. GLASS SHEET */}
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

                    <View style={styles.contentOverlay}>
                        {/* IDENTITY SECTION */}
                        <View style={styles.identityWrapper}>
                            <TouchableOpacity style={styles.medalStatic}>
                                <MaterialCommunityIcons name="medal" size={28} color="#FFD15B" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.langBtnStatic}
                                onPress={() => setModalVisible(true)}
                            >
                                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                                <Text style={styles.langText}>{currentLanguage.code}</Text>
                            </TouchableOpacity>

                            <View style={styles.infoCenterBlock}>
                                <Text style={styles.userName}>{username}</Text>
                                <Text style={styles.location}>{location}</Text>

                                {(platforms && platforms.length > 0) && (
                                    <View style={styles.platformsContainer}>
                                        {platforms.map(platformId => {
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

                            <LanguageSelector
                                visible={modalVisible}
                                onClose={() => setModalVisible(false)}
                                onSelect={selectLanguage}
                                currentLanguage={currentLanguage}
                            />
                        </View>

                        {/* TAGS */}
                        <View style={styles.tagsRow}>
                            {games && games.length > 0 ? (
                                games.map(gameId => {
                                    const game = GAMES.find(g => g.id === gameId);
                                    const isExternal = !game;
                                    const displayName = isExternal ? (gameNames[gameId] || "Unknown Game") : game.name;
                                    const color = getGameColor(gameId, displayName);
                                    const rank = ranks && ranks[gameId] ? ranks[gameId] : "Unranked";

                                    return (
                                        <TouchableOpacity
                                            key={gameId}
                                            style={[styles.tag, { backgroundColor: `${color}26` }]}
                                            onPress={() => Alert.alert(`${displayName} Rank`, `${rank}`)}
                                        >
                                            <Text style={[styles.tagText, { color: color }]}>{displayName}</Text>
                                        </TouchableOpacity>
                                    );
                                })
                            ) : null}

                            {/* Add Game Button */}
                            <TouchableOpacity
                                style={[styles.tag, styles.addTagBtn]}
                                onPress={() => navigation.navigate('GameChoice', { isEditMode: true })}
                            >
                                <Ionicons name="add" size={20} color="#FFFFFF" />
                            </TouchableOpacity>

                            {(!games || games.length === 0) && (
                                <Text style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginLeft: 10 }}>
                                    {t('profile.noGamesSelected')}
                                </Text>
                            )}
                        </View>

                        {/* STATS */}
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>{t('profile.posts')}</Text>
                                <Text style={styles.statNum}>{postsCount > 999 ? (postsCount / 1000).toFixed(1) + 'K' : postsCount}</Text>
                            </View>
                            <View style={styles.vDivider} />
                            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('FollowersList')}>
                                <Text style={styles.statLabel}>{t('profile.followers')}</Text>
                                <Text style={styles.statNum}>{followersCount > 999 ? (followersCount / 1000).toFixed(1) + 'K' : followersCount}</Text>
                            </TouchableOpacity>
                            <View style={styles.vDivider} />
                            <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('FollowingList')}>
                                <Text style={styles.statLabel}>{t('profile.following')}</Text>
                                <Text style={styles.statNum}>{followingCount > 999 ? (followingCount / 1000).toFixed(1) + 'K' : followingCount}</Text>
                            </TouchableOpacity>
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
        paddingTop: 50,
        paddingHorizontal: 20
    },
    identityWrapper: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 35,
        minHeight: 60,
    },
    notifBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 9,
        height: 9,
        borderRadius: 4.5,
        backgroundColor: '#FF4081',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        zIndex: 10,
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
    langText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800'
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
    addTagBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderStyle: 'dashed',
        borderWidth: 1.2,
        borderColor: 'rgba(255,255,255,0.4)',
        width: 38,
        height: 38,
        paddingHorizontal: 0,
        paddingVertical: 0,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
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
});
