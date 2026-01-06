import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { t } from '../i18n';

export const LANGUAGES = [
    { code: 'EN', label: 'English', flag: '🇬🇧' },
    { code: 'FR', label: 'Français', flag: '🇫🇷' },
    { code: 'AR', label: 'العربية', flag: '🇸🇦' },
];

export default function LanguageSelector({ visible, onClose, onSelect, currentLanguage }) {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <BlurView
                    intensity={40}
                    tint="dark"
                    experimentalBlurMethod="dimezisBlurView"
                    style={styles.dropdownContainer}
                >
                    <View style={styles.dropdownInner}>
                        <Text style={styles.dropdownHeader}>{t('language.select')}</Text>
                        {LANGUAGES.map((item) => (
                            <TouchableOpacity
                                key={item.code}
                                style={[
                                    styles.dropdownItem,
                                    currentLanguage.code === item.code && styles.dropdownItemActive
                                ]}
                                onPress={() => onSelect(item)}
                            >
                                <View style={styles.flagCircle}>
                                    <Text style={styles.flagIcon}>{item.flag}</Text>
                                </View>
                                <Text style={styles.dropdownLabel}>{item.label}</Text>
                                {currentLanguage.code === item.code && (
                                    <MaterialCommunityIcons name="check-circle" size={20} color="#4D4DFF" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </BlurView>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    dropdownContainer: {
        width: 280,
        backgroundColor: 'rgba(15, 15, 61, 0.9)',
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: 'rgba(77, 77, 255, 0.4)',
        overflow: 'hidden',
        padding: 5,
    },
    dropdownInner: {
        padding: 15,
    },
    dropdownHeader: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 15,
        textAlign: 'center',
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginBottom: 5,
    },
    dropdownItemActive: {
        backgroundColor: 'rgba(77, 77, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(77, 77, 255, 0.3)',
    },
    flagCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    flagIcon: {
        fontSize: 20,
    },
    dropdownLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
});
