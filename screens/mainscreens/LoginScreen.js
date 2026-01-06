import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { ActivityIndicator, Alert } from 'react-native';
import { t } from '../../i18n';

export default function LoginScreen({ onBackToWelcome, onNavigateToSignUp }) {
    const { login, googleLogin } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(t('common.error'), t('auth.fillAllFields'));
            return;
        }

        setIsLoading(true);
        try {
            await login(email, password);
            // Navigation will happen automatically due to AuthContext user state change
        } catch (error) {
            console.error(error);
            let errorMessage = error.message;
            if (
                error.code === 'auth/invalid-credential' ||
                error.code === 'auth/user-not-found' ||
                error.code === 'auth/wrong-password'
            ) {
                errorMessage = t('auth.invalidEmailOrPassword');
            }
            Alert.alert(t('auth.loginFailed'), errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

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

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0A0E27', '#1A1F3A', '#0F1729', '#1E2139']}
                locations={[0, 0.3, 0.7, 1]}
                style={styles.backgroundGradient}
            >
                {/* Background orbs */}
                <View style={styles.orbContainer}>
                    <View style={[styles.orb, styles.orb1]} />
                    <View style={[styles.orb, styles.orb2]} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View
                            style={[
                                styles.content,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                            {/* Back Button */}
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={onBackToWelcome}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                            </TouchableOpacity>

                            {/* Header */}
                            <View style={styles.header}>
                                <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
                                <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>
                            </View>

                            {/* Form */}
                            <View style={styles.form}>
                                {/* Email Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>{t('auth.email')}</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder={t('auth.enterEmail')}
                                            placeholderTextColor="#6B7280"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                {/* Password Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>{t('auth.password')}</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder={t('auth.enterPassword')}
                                            placeholderTextColor="#6B7280"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowPassword(!showPassword)}
                                            style={styles.eyeIcon}
                                        >
                                            <Ionicons
                                                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                                size={20}
                                                color="#6B7280"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Forgot Password */}
                                <TouchableOpacity style={styles.forgotPassword}>
                                    <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                                </TouchableOpacity>

                                {/* Login Button */}
                                <TouchableOpacity
                                    style={[styles.loginButton, isLoading && { opacity: 0.7 }]}
                                    onPress={handleLogin}
                                    activeOpacity={0.85}
                                    disabled={isLoading}
                                >
                                    <LinearGradient
                                        colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.buttonGradient}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Divider */}
                                <View style={styles.dividerContainer}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>{t('auth.or')}</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                {/* Google Login Button */}
                                <TouchableOpacity
                                    style={styles.googleButton}
                                    onPress={async () => {
                                        try {
                                            setIsLoading(true);
                                            await googleLogin();
                                        } catch (e) {
                                            Alert.alert("Google Login Error", e.message);
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <View style={styles.googleButtonInner}>
                                        <Ionicons name="logo-google" size={24} color="#FFFFFF" />
                                        <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Sign Up Link */}
                            <View style={styles.footer}>
                                <Text style={styles.footerText}>{t('auth.dontHaveAccount')} </Text>
                                <TouchableOpacity onPress={onNavigateToSignUp}>
                                    <Text style={styles.footerLink}>{t('auth.signUp')}</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    },
    orbContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    orb: {
        position: 'absolute',
        borderRadius: 1000,
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
        width: 300,
        height: 300,
        backgroundColor: '#06B6D4',
        bottom: -100,
        left: -80,
        opacity: 0.06,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 60,
        paddingBottom: 40,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(31, 41, 55, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#A0AEC0',
        fontWeight: '400',
        letterSpacing: 0.3,
    },
    form: {
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#E8EAED',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(31, 41, 55, 0.6)',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(139, 92, 246, 0.2)',
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '400',
    },
    eyeIcon: {
        padding: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#8B5CF6',
        fontSize: 14,
        fontWeight: '600',
    },
    loginButton: {
        height: 60,
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 24,
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    buttonGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
    },
    dividerText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '600',
        marginHorizontal: 16,
        letterSpacing: 1,
    },
    googleButton: {
        height: 60,
        borderRadius: 18,
        overflow: 'hidden',
    },
    googleButtonInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(31, 41, 55, 0.6)',
        borderWidth: 1.5,
        borderColor: 'rgba(139, 92, 246, 0.3)',
        borderRadius: 18,
        gap: 12,
    },
    googleButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: '#6B7280',
        fontSize: 14,
    },
    footerLink: {
        color: '#8B5CF6',
        fontSize: 14,
        fontWeight: '700',
    },
});
