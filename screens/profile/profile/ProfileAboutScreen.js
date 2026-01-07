import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useUser } from '../../context/UserContext';
import { t } from '../../i18n';

export default function ProfileAboutScreen() {
    const { bio } = useUser();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('profile.aboutMe')}</Text>
            <Text style={styles.bio}>
                {bio}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 20,
        marginTop: 10,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 10,
    },
    bio: {
        color: '#CBD5E1',
        fontSize: 14,
        lineHeight: 22,
    },
});
