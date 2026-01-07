import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
// Import your screens for the drawer
// import ProfileScreen from '../screens/mainscreens/ProfileScreen';
// import SettingsScreen from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator();

export default function AppDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#0A0E27',
          width: 280,
        },
        drawerActiveTintColor: '#8B5CF6',
        drawerInactiveTintColor: '#9CA3AF',
        drawerLabelStyle: {
          fontSize: 16,
          fontWeight: '600',
        },
      }}
    >
      {/* TODO: Add your drawer screens here */}
      {/* Example:
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerLabel: 'Profile',
          drawerIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
      */}
    </Drawer.Navigator>
  );
}
