import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function CustomProgressBar({ currentTime, duration, onSeek }) {
    const formatTime = (millis) => {
        if (!millis) return "00:00";
        const totalSeconds = Math.floor(millis / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleTouch = (event) => {
        if (!duration) return;
        const { locationX } = event.nativeEvent;
        // Padding horizontal is 20 on each side in the parent's container, so usable width is width - 40
        const progressBarWidth = width - 40;
        const seekPosition = (locationX / progressBarWidth) * duration;

        // Clamp seekPosition
        const finalSeek = Math.max(0, Math.min(seekPosition, duration));

        onSeek && onSeek(finalSeek);
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <View style={styles.progressContainer}>
            <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
            <TouchableOpacity
                activeOpacity={1}
                onPress={handleTouch}
                style={styles.progressBarClickArea}
            >
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    <View style={[styles.progressKnob, { left: `${progressPercent}%` }]} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    progressContainer: {
        marginBottom: 15,
        width: '100%',
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    timeText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    progressBarClickArea: {
        height: 20,
        justifyContent: 'center',
    },
    progressBarBackground: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'visible',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#6662FC',
        borderRadius: 2,
    },
    progressKnob: {
        position: 'absolute',
        top: -4,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation: 3,
        marginLeft: -6,
    },
});
