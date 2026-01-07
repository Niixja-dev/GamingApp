import React, { useState, useEffect } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import ScreenBackground from '../../components/ScreenBackground';
import { fetchTrendingGames } from '../../services/api';
import { useUser } from '../../context/UserContext';
import { t } from '../../i18n';

// MOCK DATA REMOVED


export default function NewGamesScreen({ navigation }) {
    const { toggleFollowGame, followedGames } = useUser();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadNewGames();
    }, []);

    const loadNewGames = async () => {
        setLoading(true);
        try {
            // Fetch recent/new games (trending games are often recent)
            const fetchedGames = await fetchTrendingGames(15);

            if (fetchedGames && fetchedGames.length > 0) {
                setGames(fetchedGames);
            } else {
                setGames([]);
            }
        } catch (error) {
            console.error('Error loading new games:', error);
            setGames([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleFollow = async (game) => {
        await toggleFollowGame(game);
    };

    return (
        <ScreenBackground style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <BlurView intensity={20} tint="dark" style={styles.actionBlur}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </BlurView>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('games.newGames')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#6662FC" />
                    </View>
                ) : games.length > 0 ? (
                    games.map((game) => (
                        <TouchableOpacity
                            key={game.id}
                            style={styles.itemRow}
                            onPress={() => navigation.navigate('GameDetail', { game })}
                        >
                            <Image source={{ uri: game.image }} style={styles.itemThumb} />
                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle} numberOfLines={1}>{game.title}</Text>
                                <Text style={styles.itemSub} numberOfLines={1}>{game.genres}</Text>
                                <View style={styles.ratingBox}>
                                    <Ionicons name="star" size={12} color="#FFD700" />
                                    <Text style={styles.ratingText}>{game.rating}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.followBtn}
                                onPress={() => toggleFollow(game)}
                            >
                                <LinearGradient
                                    colors={followedGames.some(g => String(g.id) === String(game.id)) ? ['#444', '#222'] : ['#6662FC', '#4D4DFF']}
                                    style={styles.followGradient}
                                >
                                    <Text style={styles.followText}>
                                        {followedGames.some(g => String(g.id) === String(game.id)) ? t('search.following') : t('search.follow')}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
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
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 15,
        borderRadius: 25,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    itemThumb: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    itemContent: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    itemTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 2 },
    itemSub: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 12, marginBottom: 4 },
    ratingBox: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { color: '#FFD700', fontSize: 12, fontWeight: '700', marginLeft: 4 },
    followBtn: {
        borderRadius: 15,
        overflow: 'hidden',
        minWidth: 90,
        marginLeft: 10,
    },
    followGradient: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    followText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase'
    },
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
