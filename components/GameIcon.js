import React from 'react';
import { StyleSheet, TouchableOpacity, Image, View, Text } from 'react-native';

/**
 * Reusable GameIcon component for displaying game posters
 * @param {Object} game - Game object with title and image
 * @param {Function} onPress - Callback when the game icon is pressed
 * @param {Object} style - Additional styles for the container
 */
export default function GameIcon({ game, onPress, style }) {
    return (
        <TouchableOpacity
            style={[styles.gamePoster, style]}
            onPress={onPress}
        >
            <Image
                source={{ uri: game.image }}
                style={styles.posterImg}
            />

        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    gamePoster: {
        width: 220,
        height: 300,
        borderRadius: 45,
        marginRight: 20,
        overflow: 'hidden',
    },
    posterImg: {
        width: '100%',
        height: '100%',
    },
    posterLabel: {
        position: 'absolute',
        top: 30,
        left: 20,
        right: 20,
    },
    posterTitle: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: '900',
        textTransform: 'uppercase',
        fontStyle: 'italic',
    },
});
