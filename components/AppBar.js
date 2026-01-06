import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    primary: '#6662FC',
    white: '#FFFFFF',
};

const AppBar = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.dockShadowContainer}>
            <View style={styles.dockGlassBox}>
                <BlurView
                    intensity={33}
                    tint="dark"
                    experimentalBlurMethod="dimezisBlurView"
                    style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                    colors={['rgba(15, 15, 61, 0.54)', 'rgba(58, 58, 138, 0.54)']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.dockIconCluster}>
                    {state.routes.map((route, index) => {
                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        // Map route names to icons
                        let iconName;
                        let iconSize = 24;

                        if (route.name === 'Home') {
                            iconName = isFocused ? "home" : "home-outline";
                            iconSize = 22;
                        } else if (route.name === 'Search') {
                            iconName = isFocused ? "search" : "search-outline";
                        } else if (route.name === 'Videos') {
                            iconName = isFocused ? "videocam" : "videocam-outline";
                            iconSize = 26;
                        } else if (route.name === 'Chat') {
                            iconName = isFocused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline";
                        } else if (route.name === 'Profile') {
                            iconName = isFocused ? "person" : "person-outline";
                        }

                        return (
                            <TouchableOpacity
                                key={index}
                                onPress={onPress}
                                style={styles.iconBox}
                            >
                                <Ionicons
                                    name={iconName}
                                    size={iconSize}
                                    color={isFocused ? COLORS.primary : COLORS.white}
                                />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    dockShadowContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    dockGlassBox: {
        width: '100%',
        height: 80,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        backgroundColor: 'transparent',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dockIconCluster: {
        width: '90%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    iconBox: {
        padding: 8,
    }
});

export default AppBar;
