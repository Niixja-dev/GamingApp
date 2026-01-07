import React, { useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import ScreenBackground from '../../components/ScreenBackground';
import { fetchGamesByGenre, fetchTrendingGames, GENRE_MAP } from '../../services/api';
import { t } from '../../i18n';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 60) / 2;

// MOCK DATA REMOVED


export default function TrendingGamesScreen({ navigation, route }) {
    const { genre } = route.params || {};
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadGames();
    }, [genre]);

    const loadGames = async () => {
        setLoading(true);
        try {
            let fetchedGames;
            if (genre) {
                const apiGenre = GENRE_MAP[genre] || genre.toLowerCase();
                fetchedGames = await fetchGamesByGenre(apiGenre, 20);
            } else {
                fetchedGames = await fetchTrendingGames(20);
            }

            if (fetchedGames && fetchedGames.length > 0) {
                setGames(fetchedGames);
            } else {
                setGames([]);
            }
        } catch (error) {
            console.error('Error loading games:', error);
            setGames([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenBackground style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <BlurView intensity={20} tint="dark" style={styles.actionBlur}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </BlurView>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{genre ? t('games.gamesTitle', { genre }) : t('games.trendingGames')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6662FC" />
                    </View>
                ) : games.length > 0 ? (
                    <View style={styles.grid}>
                        {games.map((game) => (
                            <TouchableOpacity
                                key={game.id}
                                style={styles.gameCard}
                                onPress={() => navigation.navigate('GameDetail', { game })}
                            >
                                <Image source={{ uri: game.image }} style={styles.gamePoster} />
                                <BlurView intensity={30} tint="dark" style={styles.labelContainer}>
                                    <Text style={styles.gameTitle} numberOfLines={1}>{game.title}</Text>
                                    <Text style={styles.gameGenre} numberOfLines={1}>{game.genre}</Text>
                                </BlurView>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>{t('games.noGamesFound')}</Text>
                    </View>
                )}
            </ScrollView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    actionBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    gameCard: {
        width: COLUMN_WIDTH,
        height: COLUMN_WIDTH * 1.4,
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    gamePoster: { width: '100%', height: '100%' },
    labelContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    gameTitle: { color: '#FFF', fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
    gameGenre: { color: 'rgba(255, 255, 255, 0.5)', fontSize: 10, fontWeight: '600', marginTop: 2 },
    emptyContainer: {
        paddingVertical: 50,
        alignItems: 'center',
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 16,
        fontStyle: 'italic',
    },
});
