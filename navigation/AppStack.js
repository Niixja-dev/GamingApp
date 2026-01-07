import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// Import your main app screens here
// import ProfileScreen from '../screens/mainscreens/ProfileScreen';
// import GameDetailScreen from '../screens/GameDetailScreen';

const Stack = createStackNavigator();

export default function AppStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyleInterpolator: ({ current: { progress } }) => ({
                    cardStyle: {
                        opacity: progress,
                    },
                }),
            }}
        >
            {/* TODO: Add your main app screens here */}
            {/* Example:
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="GameDetail" component={GameDetailScreen} />
      */}
        </Stack.Navigator>
    );
}
