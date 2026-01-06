import React, { useState, useMemo, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Modal,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GAMES } from '../../constants/GameData';
import { useUser } from '../../context/UserContext';
import { searchGames, fetchTrendingGames } from '../../services/api';
import { t } from '../../i18n';

const { width } = Dimensions.get('window');

export default function GameChoiceScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    // Initial data from route params or context (if Edit Mode)
    const { games: contextGames, ranks: contextRanks, gameNames: contextNames, updateUserGames } = useUser();
    const isEditMode = route.params?.isEditMode || false;

    const initialGames = isEditMode ? contextGames : (route.params?.selectedGames || []);
    const initialRanks = isEditMode ? contextRanks : (route.params?.ranks || {});
    const initialNames = isEditMode ? contextNames : (route.params?.gameNames || {});

    const [searchQuery, setSearchQuery] = useState('');
    const [apiGames, setApiGames] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedGames, setSelectedGames] = useState(initialGames);
    const [ranks, setRanks] = useState(initialRanks);
    const [gameNames, setGameNames] = useState(initialNames);
    const [modalVisible, setModalVisible] = useState(false);
    const [activeGame, setActiveGame] = useState(null); // Full game object
    const [rankInput, setRankInput] = useState('');

    // Load trending on mount
    useEffect(() => {
        const loadInitial = async () => {
            setIsLoading(true);
            const trending = await fetchTrendingGames(20);
            setApiGames(trending);
            setIsLoading(false);
        };
        loadInitial();
    }, []);

    // Debounced search
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsLoading(true);
                const results = await searchGames(searchQuery, 30);
                setApiGames(results);
                setIsLoading(false);
            } else if (searchQuery.trim().length === 0) {
                setIsLoading(true);
                const trending = await fetchTrendingGames(20);
                setApiGames(trending);
                setIsLoading(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const toggleGame = (game) => {
        const id = String(game.id);
        if (selectedGames.includes(id)) {
            setSelectedGames(prev => prev.filter(g => g !== id));
            setRanks(prev => {
                const newRanks = { ...prev };
                delete newRanks[id];
                return newRanks;
            });
            setGameNames(prev => {
                const newNames = { ...prev };
                delete newNames[id];
                return newNames;
            });
        } else {
            setActiveGame(game);
            setRankInput('');
            setModalVisible(true);
        }
    };

    const handleRankSubmit = () => {
        if (activeGame) {
            const id = String(activeGame.id);
            setSelectedGames(prev => [...prev, id]);
            setRanks(prev => ({ ...prev, [id]: rankInput.trim() || 'Unranked' }));
            setGameNames(prev => ({ ...prev, [id]: activeGame.title || activeGame.name }));
        }
        setModalVisible(false);
        setActiveGame(null);
        setRankInput('');
    };

    const handleConfirm = async () => {
        if (isEditMode) {
            setIsLoading(true);
            try {
                await updateUserGames(selectedGames, ranks, gameNames);
                navigation.goBack();
            } catch (error) {
                console.error("Error updating games in Edit Mode:", error);
            } finally {
                setIsLoading(false);
            }
        } else {
            // Pass data back to SetupProfileScreen or previous screen
            navigation.navigate({
                name: route.params?.returnTo || 'SetupProfile',
                params: {
                    selectedGames,
                    ranks,
                    gameNames,
                    userData: route.params?.userData,
                    selectedPlatforms: route.params?.selectedPlatforms
                },
                merge: true,
            });
        }
    };

    const renderGameItem = ({ item }) => {
        const id = String(item.id);
        const isSelected = selectedGames.includes(id);
        return (
            <TouchableOpacity
                style={[
                    styles.gameCard,
                    isSelected && { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.15)' }
                ]}
                onPress={() => toggleGame(item)}
            >
                <View style={styles.gameInfo}>
                    <Text style={styles.gameName}>{item.title || item.name}</Text>
                    <Text style={styles.gameGenre}>
                        {isSelected && ranks[id] ? ranks[id] : (item.genres || item.genre)}
                    </Text>
                </View>
                <View style={[
                    styles.checkbox,
                    isSelected && { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' }
                ]}>
                    {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0A0E27', '#121731']} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.title}>{isEditMode ? t('profile.editGames') || 'Manage Games' : 'All Games'}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchWrapper}>
                    <Ionicons name="search" size={20} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search games..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Games List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
            ) : (
                <FlatList
                    data={apiGames}
                    renderItem={renderGameItem}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    numColumns={1}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="game-controller-outline" size={60} color="rgba(255,255,255,0.1)" />
                            <Text style={styles.emptyText}>No games found matching "{searchQuery}"</Text>
                        </View>
                    }
                />
            )}

            {/* Fixed Bottom Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <LinearGradient
                        colors={['#8B5CF6', '#6D28D9']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                    >
                        <Text style={styles.confirmText}>
                            {isEditMode ? (t('common.save') || 'Save Changes') : `Confirm Selection (${selectedGames.length})`}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Rank Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Enter Your Rank</Text>
                        <Text style={styles.modalSubtitle}>
                            What is your current rank in {activeGame?.title || activeGame?.name}?
                        </Text>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.rankInput}
                                placeholder="e.g. Diamond 3, Gold, Top 500..."
                                placeholderTextColor="rgba(255,255,255,0.4)"
                                value={rankInput}
                                onChangeText={setRankInput}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity style={styles.submitRankBtn} onPress={handleRankSubmit}>
                            <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.submitGradient}>
                                <Text style={styles.submitText}>Confirm Rank</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F1729',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    searchSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    gameCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(139, 92, 246, 0.1)',
        padding: 16,
        marginBottom: 12,
    },
    gameInfo: {
        flex: 1,
    },
    gameName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    gameGenre: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 40,
        backgroundColor: 'transparent',
    },
    confirmButton: {
        height: 56,
        borderRadius: 18,
        overflow: 'hidden',
    },
    buttonGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 15,
        paddingHorizontal: 40,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
    },
    inputWrapper: {
        width: '100%',
        backgroundColor: 'rgba(15, 23, 41, 0.6)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24,
    },
    rankInput: {
        color: '#FFFFFF',
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontWeight: '600',
    },
    submitRankBtn: {
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
