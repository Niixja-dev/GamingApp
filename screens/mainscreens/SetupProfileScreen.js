import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
    Dimensions,
    ScrollView,
    FlatList,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firestore';
import { auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

import { PLATFORMS, GAMES } from '../../constants/GameData';
import { useRoute, useNavigation } from '@react-navigation/native';
import { t } from '../../i18n';

export default function SetupProfileScreen({ onFinish, onBack }) {
    const { register, completeSetup } = useAuth();
    const route = useRoute();
    const navigation = useNavigation();
    const [selectedPlatforms, setSelectedPlatforms] = useState([]);
    const [selectedGames, setSelectedGames] = useState([]);
    const [ranks, setRanks] = useState({}); // { [gameId]: "Rank" }
    const [gameNames, setGameNames] = useState({}); // { [gameId]: "Name" }
    const [modalVisible, setModalVisible] = useState(false);
    const [activeGameId, setActiveGameId] = useState(null);
    const [rankInput, setRankInput] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const onNavigateToGameChoice = (params) => {
        navigation.navigate('GameChoice', {
            ...params,
            gameNames,
            userData: route.params?.userData,
            selectedPlatforms,
            returnTo: 'SetupProfile'
        });
    };

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const welcomeFade = useRef(new Animated.Value(0)).current;
    const welcomeScale = useRef(new Animated.Value(0.8)).current;

    // Handle results from GameChoiceScreen
    useEffect(() => {
        const routeParams = route.params;
        if (routeParams?.selectedGames) {
            setSelectedGames(routeParams.selectedGames);
        }
        if (routeParams?.ranks) {
            setRanks(routeParams.ranks);
        }
        if (routeParams?.gameNames) {
            setGameNames(routeParams.gameNames);
        }
        if (routeParams?.selectedPlatforms) {
            setSelectedPlatforms(routeParams.selectedPlatforms);
        }
    }, [route.params?.selectedGames, route.params?.ranks, route.params?.gameNames, route.params?.selectedPlatforms]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const togglePlatform = (id) => {
        setSelectedPlatforms(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleGame = (id) => {
        if (selectedGames.includes(id)) {
            // Deselect: remove game and rank
            setSelectedGames(prev => prev.filter(g => g !== id));
            setRanks(prev => {
                const newRanks = { ...prev };
                delete newRanks[id];
                return newRanks;
            });
        } else {
            // Select: Open modal to enter rank
            setActiveGameId(id);
            setRankInput('');
            setModalVisible(true);
        }
    };

    const handleRankSubmit = () => {
        if (activeGameId) {
            setSelectedGames(prev => [...prev, activeGameId]);
            setRanks(prev => ({ ...prev, [activeGameId]: rankInput.trim() || 'Unranked' }));
        }
        setModalVisible(false);
        setActiveGameId(null);
        setRankInput('');
    };



    const handleFinish = async () => {
        const userData = route.params?.userData;

        if (!userData) {
            Alert.alert(t('common.error'), "Registration data missing. Please go back and try again.");
            return;
        }

        setIsLoading(true);
        try {
            await register(
                userData.email,
                userData.password,
                {
                    displayName: userData.name,
                    username: userData.username,
                    location: userData.location
                },
                {
                    platforms: selectedPlatforms,
                    games: selectedGames,
                    ranks: ranks,
                    gameNames: gameNames
                }
            );

            // Successfully registered, now show welcome transition
            setIsTransitioning(true);
            Animated.parallel([
                Animated.timing(welcomeFade, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(welcomeScale, {
                    toValue: 1,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Wait a bit more for the user to appreciate the animation
                setTimeout(() => {
                    completeSetup();
                }, 2000);
            });

            // Navigation will be handled automatically by onAuthStateChanged in AuthContext
        } catch (error) {
            console.error("Error during registration:", error);
            Alert.alert(t('auth.registrationFailed'), error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderPlatform = ({ item }) => {
        const isSelected = selectedPlatforms.includes(item.id);
        return (
            <TouchableOpacity
                style={[
                    styles.platformCard,
                    isSelected && { borderColor: item.color, backgroundColor: `${item.color}20` }
                ]}
                onPress={() => togglePlatform(item.id)}
                activeOpacity={0.7}
            >
                <Ionicons
                    name={item.icon}
                    size={32}
                    color={isSelected ? item.color : '#94A3B8'}
                />
                <Text style={[styles.platformName, isSelected && { color: '#FFFFFF' }]}>
                    {item.name}
                </Text>
                {isSelected && (
                    <View style={[styles.selectionDot, { backgroundColor: item.color }]} />
                )}
            </TouchableOpacity>
        );
    };

    const renderGame = ({ item }) => {
        const isSelected = selectedGames.includes(item.id);
        return (
            <TouchableOpacity
                style={[
                    styles.gameCard,
                    isSelected && { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.15)' }
                ]}
                onPress={() => toggleGame(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.gameInfo}>
                    <Text style={styles.gameName}>{item.name}</Text>
                    <Text style={styles.gameGenre}>
                        {isSelected && ranks[item.id] ? ranks[item.id] : item.genre}
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
            <LinearGradient
                colors={['#0A0E27', '#121731', '#0F1729']}
                style={styles.backgroundGradient}
            >
                {/* Decorative Orbs */}
                <View style={styles.orb1} />
                <View style={styles.orb2} />

                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Personalize Your Experience</Text>
                        <Text style={styles.subtitle}>Select your platforms and the games you play</Text>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >

                        {/* Platforms Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Chose Platforms</Text>
                            <FlatList
                                data={PLATFORMS}
                                renderItem={renderPlatform}
                                keyExtractor={item => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.platformList}
                            />
                        </View>

                        {/* Games Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Select Your Games</Text>
                                <TouchableOpacity
                                    style={styles.seeAllBtn}
                                    onPress={() => onNavigateToGameChoice({ selectedGames, ranks })}
                                >
                                    <Text style={styles.seeAllText}>See All</Text>
                                    <Ionicons name="chevron-forward" size={14} color="#8B5CF6" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.gamesGrid}>
                                {/* Show all selected games first, then default ones if not selected */}
                                {(() => {
                                    // Combine default GAMES with any from selectedGames that aren't there
                                    const displayedGames = [...GAMES];
                                    selectedGames.forEach(id => {
                                        if (!displayedGames.find(g => String(g.id) === id)) {
                                            displayedGames.push({
                                                id: id,
                                                name: gameNames[id] || 'Selected Game',
                                                genre: 'External'
                                            });
                                        }
                                    });

                                    return displayedGames.map(game => (
                                        <View key={game.id} style={{ width: '48%', marginBottom: 12 }}>
                                            {renderGame({ item: game })}
                                        </View>
                                    ));
                                })()}
                            </View>
                        </View>

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Fixed Bottom Button - Transparent Container */}
                    <View style={styles.bottomBar}>
                        <TouchableOpacity
                            style={[
                                styles.finishButton,
                                (selectedPlatforms.length === 0 || selectedGames.length === 0) && styles.disabledButton
                            ]}
                            onPress={handleFinish}
                            disabled={selectedPlatforms.length === 0 || selectedGames.length === 0 || isTransitioning}
                        >
                            <LinearGradient
                                colors={['#8B5CF6', '#6D28D9', '#5B21B6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonGradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <>
                                        <Text style={styles.finishText}>Complete Profile</Text>
                                        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Floating Welcome Transition Overlay */}
                {isTransitioning && (
                    <Animated.View
                        style={[
                            styles.transitionOverlay,
                            { opacity: welcomeFade }
                        ]}
                    >
                        <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="dark" />
                        <Animated.View style={{ transform: [{ scale: welcomeScale }] }}>
                            <LinearGradient
                                colors={['#8B5CF6', '#D946EF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.welcomeCard}
                            >
                                <Ionicons name="sparkles" size={40} color="#FFFFFF" style={styles.sparkleIcon} />
                                <Text style={styles.welcomeText}>WELCOME</Text>
                                <Text style={styles.welcomeSub}>TO YOUR JOURNEY</Text>
                            </LinearGradient>
                        </Animated.View>
                    </Animated.View>
                )}

                {/* Rank Input Modal */}
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
                                What is your current rank in {GAMES.find(g => g.id === activeGameId)?.name || gameNames[activeGameId]}?
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
                                <LinearGradient
                                    colors={['#8B5CF6', '#6D28D9']}
                                    style={styles.submitGradient}
                                >
                                    <Text style={styles.submitText}>Confirm Rank</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F1729', // Deep dark background to prevent white flashes or bars
    },
    backgroundGradient: {
        flex: 1,
    },
    orb1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#8B5CF6',
        top: -100,
        right: -50,
        opacity: 0.1,
    },
    orb2: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#06B6D4',
        bottom: 50,
        left: -80,
        opacity: 0.08,
    },
    content: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 30,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#94A3B8',
        lineHeight: 24,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    badge: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        color: '#A78BFA',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 12,
        fontWeight: '600',
    },
    seeAllBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 5,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    seeAllText: {
        color: '#8B5CF6',
        fontSize: 13,
        fontWeight: '700',
    },
    platformList: {
        paddingRight: 20,
    },
    platformCard: {
        width: 100,
        height: 110,
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(139, 92, 246, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    platformName: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: '600',
        color: '#94A3B8',
    },
    selectionDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    gamesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    gameCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(139, 92, 246, 0.1)',
        padding: 12,
        height: 70,
    },
    gameInfo: {
        flex: 1,
    },
    gameName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    gameGenre: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '600',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
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
        paddingHorizontal: 24,
        paddingBottom: 40, // More padding to avoid home indicator
        paddingTop: 20,
        backgroundColor: 'transparent',
    },
    finishButton: {
        height: 60,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    disabledButton: {
        opacity: 0.5,
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    finishText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    transitionOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    welcomeCard: {
        paddingHorizontal: 40,
        paddingVertical: 30,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.8,
        shadowRadius: 30,
        elevation: 20,
    },
    sparkleIcon: {
        marginBottom: 10,
    },
    welcomeText: {
        color: '#FFFFFF',
        fontSize: 42,
        fontWeight: '900',
        letterSpacing: 4,
    },
    welcomeSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: 4,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#1E293B',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
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
