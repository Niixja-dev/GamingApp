import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../../i18n';

export default function HelpCenterScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0F0F3D', '#0A0E27']} style={StyleSheet.absoluteFill} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <BlurView intensity={20} tint="dark" style={styles.actionBlur}><Ionicons name="chevron-back" size={24} color="#FFF" /></BlurView>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings.helpCenter')}</Text>
                <View style={{ width: 44 }} />
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.glassCard}>
                    <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                    {[
                        { label: 'Frequently Asked Questions', icon: 'list' },
                        { label: 'Report a Problem', icon: 'alert-circle' },
                        { label: 'Contact Support', icon: 'mail' },
                        { label: 'Community Guidelines', icon: 'people' },
                    ].map((item, idx) => (
                        <View key={item.label}>
                            <TouchableOpacity style={styles.row}>
                                <Ionicons name={item.icon} size={22} color="#4D4DFF" style={{ marginRight: 15 }} />
                                <Text style={styles.name}>{item.label}</Text>
                                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                            </TouchableOpacity>
                            {idx < 3 && <View style={styles.divider} />}
                        </View>
                    ))}
                </View>
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
    name: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '600' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20 }
});
