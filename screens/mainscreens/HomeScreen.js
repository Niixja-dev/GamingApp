import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import ScreenBackground from '../../components/ScreenBackground';
import GameIcon from '../../components/GameIcon';
import { fetchGamesByGenre, GENRE_MAP, fetchTrendingGames } from '../../services/api';
import { useUser } from '../../context/UserContext';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../i18n';

const { width, height } = Dimensions.get('window');

// SAMPLED COLORS - 1:1 FROM TARGET IMAGE
const COLORS = {
    primary: '#6662FC',
    bgDark: '#0F0F3D',    // Lighter Navy
    bgLight: '#3A3A8A',   // Lighter, more vibrant Indigo
    white: '#FFFFFF',
    textDim: '#94A3B8',
    inactivePill: 'rgba(102, 98, 252, 0.15)',
};

// MOCK GAME DATA REMOVED - RELYING ON API


export default function HomeScreen({ navigation }) {
    const { username, avatar } = useUser();
    const { currentLanguage } = useLanguage();
    const [selectedGenre, setSelectedGenre] = React.useState('Action');
    const [currentGames, setCurrentGames] = React.useState([]);
    const [newGames, setNewGames] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [loadingNew, setLoadingNew] = React.useState(false);
    const genres = ['Action', 'Shooter', 'MOBA', 'RPG', 'Racing'];

    // Fetch games when genre changes
    React.useEffect(() => {
        loadGames(selectedGenre);
    }, [selectedGenre]);

    // Fetch new games on mount
    React.useEffect(() => {
        loadNewGames();
    }, []);

    const loadGames = async (genre) => {
        setLoading(true);
        try {
            const apiGenre = GENRE_MAP[genre] || genre.toLowerCase();
            const games = await fetchGamesByGenre(apiGenre, 6);

            if (games && games.length > 0) {
                setCurrentGames(games);
            } else {
                setCurrentGames([]);
            }
        } catch (error) {
            console.error('Error loading games:', error);
            setCurrentGames([]);
        } finally {
            setLoading(false);
        }
    };

    const loadNewGames = async () => {
        setLoadingNew(true);
        try {
            const games = await fetchTrendingGames(5);
            if (games && games.length > 0) {
                setNewGames(games.slice(0, 2)); // Only show 2 games in preview
            }
        } catch (error) {
            console.error('Error loading new games:', error);
        } finally {
            setLoadingNew(false);
        }
    };

    return (
        <ScreenBackground style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* CUSTOM HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.headerBtn}
                        onPress={() => navigation.navigate('Search', { initialTab: 'Games' })}
                    >
                        <Ionicons name="search" size={24} color={COLORS.white} />
                    </TouchableOpacity>

                    <View style={styles.headerTitleBox}>
                        <Text style={styles.headerWelcome}>{t('home.welcomeBack')}</Text>
                        <Text style={styles.headerUser}>{username}</Text>
                    </View>

                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        {avatar ? (
                            <Image
                                source={{ uri: avatar }}
                                style={styles.headerAvatar}
                            />
                        ) : (
                            <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
                                <Ionicons name="person" size={26} color="rgba(255,255,255,0.6)" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* CATEGORIES */}
                <View style={styles.sectionArea}>
                    <Text style={styles.sectionLabel}>{t('home.categories')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScrollPad} contentContainerStyle={{ paddingRight: 25 }}>
                        {genres.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.pill,
                                    selectedGenre === cat ? styles.pillActive : styles.pillInactive
                                ]}
                                onPress={() => setSelectedGenre(cat)}
                            >
                                <Text style={[
                                    styles.pillText,
                                    selectedGenre === cat && styles.whiteText
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* TRENDING GAMES */}
                <View style={styles.sectionArea}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionLabel}>{t('home.trendingGames')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('TrendingGames', { genre: selectedGenre })}>
                            <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
                        </TouchableOpacity>
                    </View>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : currentGames.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScrollPad} contentContainerStyle={{ paddingRight: 25 }}>
                            {currentGames.slice(0, 5).map((game) => (
                                <GameIcon
                                    key={game.id}
                                    game={game}
                                    onPress={() => navigation.navigate('GameDetail', { game })}
                                />
                            ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>{t('home.noGamesFound')}</Text>
                        </View>
                    )}
                </View>

                {/* NEW GAMES */}
                <View style={styles.sectionArea}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionLabel}>{t('home.newGames')}</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('NewGames')}>
                            <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
                        </TouchableOpacity>
                    </View>
                    {loadingNew ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                        </View>
                    ) : (
                        <View style={styles.verticalListStack}>
                            {newGames.map((game, index) => (
                                <TouchableOpacity
                                    key={game.id}
                                    style={[styles.itemRow, index > 0 && { marginTop: 15 }]}
                                    onPress={() => navigation.navigate('GameDetail', { game })}
                                >
                                    <Image
                                        source={{ uri: game.image }}
                                        style={styles.itemThumb}
                                    />
                                    <View style={styles.itemContent}>
                                        <Text style={styles.itemTitle} numberOfLines={1}>{game.title}</Text>
                                        <Text style={styles.itemSub} numberOfLines={1}>{game.genres}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* BOTTOM SPACE FOR DOCK */}
                <View style={{ height: 130 }} />
            </ScrollView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F3D',
    },
    fullBackground: {
        flex: 1,
        backgroundColor: '#0F0F3D',
    },
    scrollContent: {
        paddingTop: 65,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        marginBottom: 35,
    },
    headerBtn: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleBox: {
        alignItems: 'center',
    },
    headerWelcome: {
        color: COLORS.textDim,
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    headerUser: {
        color: COLORS.white,
        fontSize: 22,
        fontWeight: '900',
    },
    headerAvatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    avatarPlaceholder: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    sectionArea: {
        marginBottom: 35,
    },
    sectionLabel: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: '700',
        paddingHorizontal: 25,
        marginBottom: 15,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: 25,
    },
    seeAllText: {
        color: COLORS.textDim,
        fontSize: 13,
    },
    hScrollPad: {
        paddingLeft: 25,
    },
    pill: {
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 18,
        marginRight: 10,
    },
    pillActive: {
        backgroundColor: COLORS.primary,
    },
    pillInactive: {
        backgroundColor: COLORS.inactivePill,
    },
    pillText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 14,
        fontWeight: '700',
    },
    whiteText: {
        color: COLORS.white,
    },
    gamePoster: {
        width: 220,
        height: 300,
        borderRadius: 45,
        marginRight: 20,
        overflow: 'hidden',
    },
    posterImg: {
        width: '100%',
        height: '100%',
    },
    posterLabel: {
        position: 'absolute',
        top: 30,
        left: 20,
        right: 20,
    },
    posterTitle: {
        color: COLORS.white,
        fontSize: 32,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    verticalListStack: {
        paddingHorizontal: 25,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemThumb: {
        width: 75,
        height: 75,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    itemContent: {
        marginLeft: 18,
        flex: 1,
    },
    itemTitle: {
        color: COLORS.white,
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
    },
    itemSub: {
        color: COLORS.textDim,
        fontSize: 13,
    },
    loadingContainer: {
        paddingHorizontal: 25,
        paddingVertical: 40,
        alignItems: 'center',
    },
    loadingText: {
        color: COLORS.textDim,
        fontSize: 14,
    },
    emptyContainer: {
        paddingHorizontal: 25,
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textDim,
        fontSize: 14,
        fontStyle: 'italic',
    },
});
