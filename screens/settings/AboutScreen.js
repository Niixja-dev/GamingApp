import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';

const { width, height } = Dimensions.get('window');

export default function AboutScreen({ navigation }) {
    return (
        <View style={styles.container}>
            {/* BACKGROUND */}
            <LinearGradient
                colors={['#0F0F3D', '#0A0E27']}
                style={StyleSheet.absoluteFill}
            />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <BlurView intensity={20} tint="dark" style={styles.actionBlur}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </BlurView>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings.about')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.logoSection}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="game-controller" size={40} color="#4D4DFF" />
                    </View>
                    <Text style={styles.appName}>GamingApp</Text>
                    <Text style={styles.version}>Version 1.0.0 (Beta)</Text>
                </View>

                <View style={styles.glassCard}>
                    <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                        style={StyleSheet.absoluteFill}
                    />

                    <Text style={styles.description}>
                        GamingApp is the ultimate platform for gamers to connect, share their achievements, and discover new experiences in a futuristic environment.
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.creditsSection}>
                        <Text style={styles.creditsLabel}>Developed by</Text>
                        <Text style={styles.creditsNames}>
                            Abdelbadii{"\n"}
                            Hamza{"\n"}
                            Yassine
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.linkItem}>
                    <Text style={styles.linkText}>Terms of Service</Text>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.linkItem}>
                    <Text style={styles.linkText}>Privacy Policy</Text>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F3D',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    actionBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 100,
        alignItems: 'center',
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: 'rgba(77, 77, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(77, 77, 255, 0.2)',
    },
    appName: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 1,
    },
    version: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 14,
        marginTop: 5,
    },
    glassCard: {
        width: '100%',
        borderRadius: 25,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        padding: 25,
        marginBottom: 30,
    },
    description: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginVertical: 25,
    },
    creditsSection: {
        alignItems: 'center',
    },
    creditsLabel: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    creditsNames: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
        textAlign: 'center',
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    linkText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
    }
});
