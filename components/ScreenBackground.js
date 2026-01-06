import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Reusable Screen Background for the GamingApp.
 * Encapsulates the horizontal gradient from the HomeScreen.
 */
export default function ScreenBackground({ children, style }) {
    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={['#0F0F3D', '#3A3A8A']} // Original Blue/Purple Gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F3D',
    },
});
