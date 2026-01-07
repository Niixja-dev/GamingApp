import React from 'react';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import WelcomeScreen from '../screens/mainscreens/WelcomeScreen';
import LoginScreen from '../screens/mainscreens/LoginScreen';
import SignUpScreen from '../screens/mainscreens/SignUpScreen';
import SetupProfileScreen from '../screens/mainscreens/SetupProfileScreen';
import GameChoiceScreen from '../screens/mainscreens/GameChoiceScreen';
import BottomTabNavigator from './BottomTabNavigator';
import GameDetailScreen from '../screens/games/GameDetailScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import PrivacySettingsScreen from '../screens/settings/PrivacySettingsScreen';
import LanguageSettingsScreen from '../screens/settings/LanguageSettingsScreen';
import HelpCenterScreen from '../screens/settings/HelpCenterScreen';
import AboutScreen from '../screens/settings/AboutScreen';
import ChatScreen from '../screens/chats/ChatScreen';
import TrendingGamesScreen from '../screens/games/TrendingGamesScreen';
import NewGamesScreen from '../screens/games/NewGamesScreen';
import FollowersListScreen from '../screens/profile/FollowersListScreen';
import FollowingListScreen from '../screens/profile/FollowingListScreen';
import PlayersListScreen from '../screens/players/PlayersListScreen';
import PlayersProfileScreen from '../screens/players/PlayersProfileScreen';
import VideoPlayerScreen from '../screens/mainscreens/VideoPlayerScreen';
import DMScreen from '../screens/chats/DMScreen';

import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

const Stack = createStackNavigator();

export default function NativeStack() {
    const { user, loading, isNewUser, completeSetup } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F3D' }}>
                <ActivityIndicator size="large" color="#6662FC" />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: '#0F0F3D' },
                ...TransitionPresets.FadeFromBottomAndroid,
            }}
        >
            {user && !isNewUser ? (
                // App Stack (Authenticated)
                <>
                    <Stack.Screen name="Main" component={BottomTabNavigator} />
                    <Stack.Screen name="GameDetail" component={GameDetailScreen} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                    <Stack.Screen name="Privacy" component={PrivacySettingsScreen} />
                    <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
                    <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
                    <Stack.Screen name="About" component={AboutScreen} />
                    <Stack.Screen name="Chat" component={ChatScreen} />
                    <Stack.Screen name="TrendingGames" component={TrendingGamesScreen} />
                    <Stack.Screen name="NewGames" component={NewGamesScreen} />
                    <Stack.Screen name="FollowersList" component={FollowersListScreen} />
                    <Stack.Screen name="FollowingList" component={FollowingListScreen} />
                    <Stack.Screen name="PlayersList" component={PlayersListScreen} />
                    <Stack.Screen name="PlayersProfile" component={PlayersProfileScreen} />
                    <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ animation: 'fade' }} />
                    <Stack.Screen name="DMScreen" component={DMScreen} />
                    <Stack.Screen name="GameChoice" component={GameChoiceScreen} />
                </>
            ) : (
                // Auth Stack (Unauthenticated)
                <>
                    <Stack.Screen name="Welcome">
                        {({ navigation }) => (
                            <WelcomeScreen
                                onGetStarted={() => navigation.navigate('SignUp')}
                                onLogin={() => navigation.navigate('Login')}
                            />
                        )}
                    </Stack.Screen>

                    <Stack.Screen name="Login">
                        {({ navigation }) => (
                            <LoginScreen
                                onLogin={() => { }} // Managed by AuthContext transition
                                onBackToWelcome={() => navigation.navigate('Welcome')}
                                onGoogleLogin={() => { }}
                                onNavigateToSignUp={() => navigation.navigate('SignUp')}
                            />
                        )}
                    </Stack.Screen>

                    <Stack.Screen name="SignUp">
                        {({ navigation }) => (
                            <SignUpScreen
                                onSignUp={(data) => navigation.navigate('SetupProfile', { userData: data })}
                                onBackToWelcome={() => navigation.navigate('Welcome')}
                                onGoogleSignUp={() => { }}
                                onNavigateToLogin={() => navigation.navigate('Login')}
                            />
                        )}
                    </Stack.Screen>

                    <Stack.Screen name="SetupProfile">
                        {({ navigation, route }) => (
                            <SetupProfileScreen
                                onFinish={() => {
                                    // Managed by AuthContext transition after register
                                }}
                                onBack={() => navigation.goBack()}
                            />
                        )}
                    </Stack.Screen>
                    <Stack.Screen name="GameChoice" component={GameChoiceScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}
