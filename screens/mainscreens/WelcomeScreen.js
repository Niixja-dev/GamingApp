import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firestore';
import { t } from '../../i18n';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ onGetStarted, onLogin }) {
    const [onlineCount, setOnlineCount] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // Pulse animation for online indicator
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Listen to online users count
        const q = query(collection(db, 'users'),
            where('isOnline', '==', true),
            where('isProfileSetup', '==', true)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setOnlineCount(snapshot.size);
        });

        return () => unsubscribe();
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0A0E27', '#1A1F3A', '#0F1729', '#1E2139']}
                locations={[0, 0.3, 0.7, 1]}
                style={styles.backgroundGradient}
            >
                {/* Animated background orbs */}
                <View style={styles.orbContainer}>
                    <View style={[styles.orb, styles.orb1]} />
                    <View style={[styles.orb, styles.orb2]} />
                    <View style={[styles.orb, styles.orb3]} />
                </View>

                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    {/* Logo Section with Glow */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoGlow}>
                            <LinearGradient
                                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                                style={styles.logoGradient}
                            >
                                <Ionicons name="game-controller" size={52} color="#FFFFFF" />
                            </LinearGradient>
                        </View>
                    </View>

                    {/* Title Section with Enhanced Typography */}
                    <Animated.View
                        style={[
                            styles.titleContainer,
                            { transform: [{ translateY: slideAnim }] },
                        ]}
                    >
                        <Text style={styles.title}>{t('welcome.title')}</Text>
                        <View style={styles.titleUnderline} />
                        <Text style={styles.subtitle}>{t('welcome.subtitle1')}</Text>
                        <Text style={styles.subtitle}>{t('welcome.subtitle2')}</Text>
                    </Animated.View>

                    {/* Premium Feature Card - Rollback to Working State */}
                    <View style={styles.featureCardContainer}>
                        <View style={[
                            styles.featureCard,
                            {
                                borderColor: onlineCount > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                                overflow: 'hidden'
                            }
                        ]}>
                            {/* Base Blur with Dimezis Method */}
                            <BlurView
                                intensity={50}
                                tint="dark"
                                style={StyleSheet.absoluteFill}
                            />

                            <LinearGradient
                                colors={
                                    onlineCount > 0
                                        ? ['rgba(20, 184, 166, 0.15)', 'rgba(6, 182, 212, 0.1)', 'rgba(14, 165, 233, 0.15)']
                                        : ['rgba(239, 68, 68, 0.15)', 'rgba(185, 28, 28, 0.1)', 'rgba(153, 27, 27, 0.15)']
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.cardGradient}
                            >
                                {/* Animated crystal effects */}
                                <View style={styles.crystalContainer}>
                                    <View style={[
                                        styles.crystal,
                                        styles.crystalLeft,
                                        { backgroundColor: onlineCount > 0 ? '#14B8A6' : '#EF4444' }
                                    ]} />
                                    <View style={[
                                        styles.crystal,
                                        styles.crystalRight,
                                        { backgroundColor: onlineCount > 0 ? '#14B8A6' : '#EF4444' }
                                    ]} />
                                </View>

                                {/* Grid overlay */}
                                <View style={styles.gridOverlay} />

                                {/* Online indicator with glass effect (no internal blur) */}
                                <View style={[
                                    styles.onlineContainer,
                                    { borderColor: onlineCount > 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)' }
                                ]}>
                                    <Animated.View
                                        style={[
                                            styles.statusDotOuter,
                                            { transform: [{ scale: pulseAnim }] },
                                        ]}
                                    >
                                        <View style={[
                                            styles.statusDot,
                                            {
                                                backgroundColor: onlineCount > 0 ? '#10B981' : '#EF4444',
                                                shadowColor: onlineCount > 0 ? '#10B981' : '#EF4444'
                                            }
                                        ]} />
                                    </Animated.View>
                                    <Text style={styles.onlineText}>
                                        {onlineCount} {onlineCount <= 1 ? t('welcome.player') : t('welcome.playersOnline')}
                                    </Text>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>

                    {/* Premium Buttons */}
                    <View style={styles.buttonsContainer}>
                        {/* Get Started Button with Enhanced Gradient */}
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={onGetStarted}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonGradient}
                            >
                                <View style={styles.buttonShine} />
                                <Text style={styles.primaryButtonText}>{t('welcome.getStarted')}</Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Log In Button with Glassmorphism */}
                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={onLogin}
                            activeOpacity={0.85}
                        >
                            <View style={styles.secondaryButtonInner}>
                                <Text style={styles.secondaryButtonText}>{t('welcome.login')}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Social Login Section */}
                    <View style={styles.socialContainer}>
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.socialText}>{t('welcome.orContinueWith')}</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.socialButtons}>
                            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                                <View style={styles.socialButtonInner}>
                                    <Ionicons name="logo-google" size={24} color="#E8EAED" />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                                <View style={styles.socialButtonInner}>
                                    <Ionicons name="logo-apple" size={24} color="#E8EAED" />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                                <View style={styles.socialButtonInner}>
                                    <Ionicons name="logo-twitter" size={24} color="#E8EAED" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            {t('welcome.termsPrefix')}{' '}
                            <Text style={styles.footerLink}>{t('welcome.terms')}</Text> {t('welcome.and')}{' '}
                            <Text style={styles.footerLink}>{t('welcome.privacy')}</Text>
                        </Text>
                    </View>
                </Animated.View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundGradient: {
        flex: 1,
        position: 'relative',
    },
    orbContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
        borderRadius: 1000,
        opacity: 0.15,
    },
    orb1: {
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#8B5CF6',
        top: -100,
        right: -50,
        opacity: 0.15,
    },
    orb2: {
        width: 300,
        height: 300,
        backgroundColor: '#06B6D4',
        bottom: -150,
        left: -100,
        opacity: 0.08,
    },
    orb3: {
        width: 250,
        height: 250,
        backgroundColor: '#7C3AED',
        top: '40%',
        left: -50,
        opacity: 0.06,
    },
    content: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 70,
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    logoGlow: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 12,
    },
    logoGradient: {
        width: 100,
        height: 100,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    titleContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: -1,
        textShadowColor: 'rgba(139, 92, 246, 0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 12,
    },
    titleUnderline: {
        width: 60,
        height: 4,
        backgroundColor: '#8B5CF6',
        borderRadius: 2,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: '#A0AEC0',
        fontWeight: '400',
        lineHeight: 26,
        letterSpacing: 0.3,
    },
    featureCardContainer: {
        marginBottom: 48,
    },
    featureCard: {
        height: 220,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 12,
    },
    cardGradient: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 24,
        position: 'relative',
    },
    crystalContainer: {
        ...StyleSheet.absoluteFillObject,
    },
    crystal: {
        position: 'absolute',
        backgroundColor: '#14B8A6',
        opacity: 0.12,
    },
    crystalLeft: {
        left: -30,
        top: -20,
        width: 120,
        height: 260,
        transform: [{ skewX: '-15deg' }, { rotate: '5deg' }],
    },
    crystalRight: {
        right: -30,
        top: -20,
        width: 120,
        height: 260,
        transform: [{ skewX: '15deg' }, { rotate: '-5deg' }],
    },
    gridOverlay: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.03,
        backgroundColor: 'transparent',
    },
    onlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        overflow: 'hidden', // Required for BlurView
    },
    statusDotOuter: {
        marginRight: 10,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 5,
    },
    onlineText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    buttonsContainer: {
        marginBottom: 36,
    },
    primaryButton: {
        height: 60,
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 14,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    buttonGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        position: 'relative',
    },
    buttonShine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        height: 60,
        borderRadius: 18,
        overflow: 'hidden',
    },
    secondaryButtonInner: {
        flex: 1,
        backgroundColor: 'rgba(31, 41, 55, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderRadius: 18,
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    socialContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        width: '100%',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
    },
    socialText: {
        color: '#6B7280',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginHorizontal: 16,
    },
    socialButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    socialButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
    },
    socialButtonInner: {
        flex: 1,
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.25)',
        borderRadius: 30,
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        color: '#6B7280',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    footerLink: {
        color: '#8B5CF6',
        fontWeight: '600',
    },
});
