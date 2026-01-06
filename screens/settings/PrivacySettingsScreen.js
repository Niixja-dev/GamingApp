import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';

export default function PrivacySettingsScreen({ navigation }) {
    const { deleteAccount } = useAuth();
    const [privacy, setPrivacy] = React.useState({ profile: true, status: true, activity: false });
    const toggle = (key) => setPrivacy(p => ({ ...p, [key]: !p[key] }));

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0F0F3D', '#0A0E27']} style={StyleSheet.absoluteFill} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <BlurView intensity={20} tint="dark" style={styles.actionBlur}><Ionicons name="chevron-back" size={24} color="#FFF" /></BlurView>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings.privacySettings')}</Text>
                <View style={{ width: 44 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.glassCard}>
                    <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                    {[
                        { id: 'profile', label: t('settings.privacy.publicProfile'), desc: t('settings.privacy.publicProfileDesc') },
                        { id: 'status', label: t('settings.privacy.onlineStatus'), desc: t('settings.privacy.onlineStatusDesc') },
                        { id: 'activity', label: t('settings.privacy.activityFeed'), desc: t('settings.privacy.activityFeedDesc') },
                    ].map((item, idx) => (
                        <View key={item.id}>
                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.rowLabel}>{item.label}</Text>
                                    <Text style={styles.rowDesc}>{item.desc}</Text>
                                </View>
                                <Switch value={privacy[item.id]} onValueChange={() => toggle(item.id)} trackColor={{ true: '#4D4DFF' }} />
                            </View>
                            {idx < 2 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>

                {/* Delete Account Section */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                        Alert.alert(
                            t('settings.deleteAccount'),
                            t('settings.deleteAccountConfirm'),
                            [
                                { text: t('common.cancel'), style: 'cancel' },
                                {
                                    text: t('common.delete'),
                                    style: 'destructive',
                                    onPress: async () => {
                                        try {
                                            await deleteAccount();
                                        } catch (error) {
                                            Alert.alert(t('common.error'), error.message);
                                        }
                                    }
                                }
                            ]
                        );
                    }}
                >
                    <Text style={styles.deleteButtonText}>{t('settings.deleteAccount')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F0F3D' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    actionBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
    glassCard: { borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    row: { flexDirection: 'row', alignItems: 'center', padding: 20 },
    rowLabel: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    rowDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 12, lineHeight: 18 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20 },
    deleteButton: {
        marginTop: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '700',
    }
});
