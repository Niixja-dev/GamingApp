import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import { ActivityIndicator, Alert } from 'react-native';

export default function ChangePasswordScreen({ navigation }) {
    const { updateUserPassword } = useAuth();
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [localError, setLocalError] = React.useState(null);

    const handleUpdatePassword = async () => {
        setLocalError(null);
        if (!currentPassword || !newPassword || !confirmPassword) {
            setLocalError(t('settings.fillAllFields'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setLocalError(t('settings.passwordsDoNotMatch'));
            return;
        }

        if (newPassword.length < 6) {
            setLocalError(t('settings.passwordTooShort'));
            return;
        }

        setLoading(true);
        try {
            await updateUserPassword(currentPassword, newPassword);
            Alert.alert(t('common.success'), t('settings.passwordUpdatedSuccessfully'), [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error(error);
            let errorMessage = t('settings.updatePasswordFailed');
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = t('settings.incorrectCurrentPassword');
            }
            setLocalError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0F0F3D', '#0A0E27']} style={StyleSheet.absoluteFill} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <BlurView intensity={20} tint="dark" style={styles.actionBlur}><Ionicons name="chevron-back" size={24} color="#FFF" /></BlurView>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings.changePassword')}</Text>
                <View style={{ width: 44 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.glassCard}>
                    <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('settings.currentPassword')}</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('settings.newPassword')}</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t('settings.confirmNewPassword')}</Text>
                        <TextInput
                            style={styles.input}
                            secureTextEntry
                            placeholder="••••••••"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                    onPress={handleUpdatePassword}
                    disabled={loading}
                >
                    <LinearGradient colors={['#4D4DFF', '#9D4DFF']} style={StyleSheet.absoluteFill} />
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.saveText}>{t('settings.updatePassword')}</Text>
                    )}
                </TouchableOpacity>

                {localError && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{localError}</Text>
                    </View>
                )}
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
    glassCard: { padding: 25, borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    inputGroup: { marginBottom: 20 },
    label: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700', marginBottom: 10 },
    input: { height: 50, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', color: '#FFF', fontSize: 16 },
    saveBtn: { height: 56, borderRadius: 20, marginTop: 30, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    errorContainer: {
        marginTop: 20,
        padding: 15,
        alignItems: 'center',
    },
    errorText: {
        color: '#FF3131',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        textShadowColor: 'rgba(255, 49, 49, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
