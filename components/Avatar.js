import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const Avatar = ({ uri, size = 40, style, showOnline = false, online = false, borderOnly = false }) => {
    // If we have a valid URI that is NOT a fallback
    const isValidUri = uri &&
        uri !== 'https://i.pravatar.cc/150' &&
        uri !== 'https://i.pravatar.cc/300' &&
        !uri.includes('pravatar.cc');

    const statusColor = online ? '#00E676' : '#FF3D00';
    const innerPadding = 3; // Gap between image and status border
    const imageSize = size - (showOnline ? (innerPadding + 2) * 2 : 0);

    const renderPlaceholder = () => (
        <LinearGradient
            colors={['rgba(255, 255, 255, 0.25)', 'rgba(255, 255, 255, 0.10)']}
            style={{
                width: imageSize,
                height: imageSize,
                borderRadius: imageSize / 2,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)'
            }}
        >
            <Ionicons name="person" size={imageSize * 0.5} color="rgba(255, 255, 255, 0.6)" />
        </LinearGradient>
    );

    const renderContent = () => (
        isValidUri ? (
            <Image
                source={{ uri }}
                style={{
                    width: imageSize,
                    height: imageSize,
                    borderRadius: imageSize / 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 2,
                    borderColor: '#0F0F3D' // Masking border
                }}
            />
        ) : renderPlaceholder()
    );

    if (showOnline) {
        return (
            <View style={[
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: 2,
                    borderColor: statusColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#0F0F3D', // Base mask
                },
                style
            ]}>
                {renderContent()}
            </View>
        );
    }

    return (
        <View style={[{ width: size, height: size }, style]}>
            {renderContent()}
        </View>
    );
};

const styles = StyleSheet.create({});

export default Avatar;
