import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/mainscreens/HomeScreen';
import ProfileScreen from '../screens/mainscreens/ProfileScreen';
import ChatScreen from '../screens/chats/ChatScreen';
import SearchScreen from '../screens/mainscreens/SearchScreen';
import VideosScreen from '../screens/mainscreens/VideosScreen';
import { View, Text, StyleSheet } from 'react-native';
import AppBar from '../components/AppBar';

const Tab = createBottomTabNavigator();

// Placeholder screens for other tabs
const PlaceholderScreen = ({ name }) => (
    <View style={styles.placeholder}>
        <Text style={styles.text}>{name} Screen</Text>
    </View>
);

const BottomTabNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <AppBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
            sceneContainerStyle={{ backgroundColor: '#0F0F3D' }}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Search" component={SearchScreen} />
            <Tab.Screen name="Videos" component={VideosScreen} />
            <Tab.Screen name="Chat" component={ChatScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    placeholder: {
        flex: 1,
        backgroundColor: '#0F0F3D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default BottomTabNavigator;
