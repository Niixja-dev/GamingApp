import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Switch,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../i18n';

const { width, height } = Dimensions.get('window');

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { logout } = useAuth();
    const { isOnline, setIsOnline } = useUser();
    const { currentLanguage } = useLanguage();

    const SETTINGS_GROUPS = [
        {
            title: t('settings.account'),
            items: [
                { id: 'edit_profile', label: t('settings.editProfile'), icon: 'person-outline', type: 'link' },
                { id: 'manage_games', label: t('profile.editGames') || 'Manage Games', icon: 'game-controller-outline', type: 'link' },
                { id: 'change_password', label: t('settings.changePassword'), icon: 'lock-closed-outline', type: 'link' },
                { id: 'privacy', label: t('settings.privacySettings'), icon: 'shield-checkmark-outline', type: 'link' },
            ]
        },
        {
            title: t('settings.preferences'),
            items: [
                { id: 'push_notifs', label: t('settings.pushNotifications'), icon: 'notifications-outline', type: 'switch', value: true },
                { id: 'language', label: t('settings.appLanguage'), icon: 'language-outline', type: 'link', detail: currentLanguage.label },
            ]
        },
        {
            title: t('settings.support'),
            items: [
                { id: 'help', label: t('settings.helpCenter'), icon: 'help-circle-outline', type: 'link' },
                { id: 'about', label: t('settings.about'), icon: 'information-circle-outline', type: 'link' },
            ]
        }
    ];

    const handleLogout = () => {
        Alert.alert(
            t('settings.logout'),
            t('settings.logoutConfirm'),
            [
                { text: t('settings.cancel'), style: 'cancel' },
                {
                    text: t('settings.logout'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (error) {
                            Alert.alert(t('settings.error'), t('settings.logoutError'));
                        }
                    }
                },
            ]
        );
    };

    // Mock user settings (replace with context if needed)
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [switches, setSwitches] = React.useState({
        push_notifs: true,
    });

    const toggleSwitch = (id) => {
        // Dark mode toggle logic removed
        setSwitches(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <View style={styles.container}>
            {/* BACKGROUND */}
            <LinearGradient
                colors={['#0F0F3D', '#3A3A8A']}
                style={StyleSheet.absoluteFill}
            />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <BlurView intensity={20} tint="dark" style={styles.actionBlur}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </BlurView>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings.title')}</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Online Status */}
                <View style={styles.groupContainer}>
                    <Text style={styles.groupTitle}>{t('settings.status')}</Text>
                    <View style={styles.glassGroup}>
                        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                        <LinearGradient
                            colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.settingItem}>
                            <View style={styles.itemLeft}>
                                <View style={styles.iconCircle}>
                                    <Ionicons name="globe-outline" size={20} color="#4D4DFF" />
                                </View>
                                <Text style={styles.itemLabel}>{t('settings.onlineStatus')}</Text>
                            </View>
                            <View style={styles.itemRight}>
                                <Switch
                                    trackColor={{ false: "#767577", true: "#00E676" }}
                                    thumbColor={isOnline ? "#FFFFFF" : "#f4f3f4"}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={() => setIsOnline(!isOnline)}
                                    value={isOnline}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {SETTINGS_GROUPS.map((group, gIdx) => (
                    <View key={group.title} style={styles.groupContainer}>
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        <View style={styles.glassGroup}>
                            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
                                style={StyleSheet.absoluteFill}
                            />

                            {group.items.map((item, iIdx) => (
                                <View key={item.id}>
                                    <TouchableOpacity
                                        style={styles.settingItem}
                                        disabled={item.type === 'switch'}
                                        onPress={() => {
                                            if (item.type === 'link') {
                                                const routeMap = {
                                                    edit_profile: { name: 'EditProfile' },
                                                    manage_games: { name: 'GameChoice', params: { isEditMode: true } },
                                                    change_password: { name: 'ChangePassword' },
                                                    privacy: { name: 'Privacy' },
                                                    language: { name: 'LanguageSettings' },
                                                    help: { name: 'HelpCenter' },
                                                    about: { name: 'About' },
                                                };
                                                const target = routeMap[item.id];
                                                if (typeof target === 'string') {
                                                    navigation.navigate(target);
                                                } else {
                                                    navigation.navigate(target.name, target.params);
                                                }
                                            }
                                        }}
                                    >
                                        <View style={styles.itemLeft}>
                                            <View style={styles.iconCircle}>
                                                <Ionicons name={item.icon} size={20} color="#4D4DFF" />
                                            </View>
                                            <Text style={styles.itemLabel}>{item.label}</Text>
                                        </View>

                                        <View style={styles.itemRight}>
                                            {item.type === 'link' && (
                                                <View style={styles.linkRow}>
                                                    {item.detail && <Text style={styles.itemDetail}>{item.detail}</Text>}
                                                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                                                </View>
                                            )}
                                            {item.type === 'switch' && (
                                                <Switch
                                                    trackColor={{ false: '#1E293B', true: '#4D4DFF' }}
                                                    thumbColor="#FFFFFF"
                                                    ios_backgroundColor="#1E293B"
                                                    onValueChange={() => toggleSwitch(item.id)}
                                                    value={switches[item.id]}
                                                />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                    {iIdx < group.items.length - 1 && <View style={styles.divider} />}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <LinearGradient
                        colors={['rgba(255, 64, 129, 0.15)', 'rgba(255, 64, 129, 0.05)']}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.logoutText}>{t('settings.logout')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F0F3D',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    actionBlur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 100,
    },
    groupContainer: {
        marginBottom: 30,
    },
    groupTitle: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginLeft: 15,
        marginBottom: 12,
    },
    glassGroup: {
        borderRadius: 25,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(77, 77, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    itemLabel: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemDetail: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 13,
        marginRight: 8,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        marginHorizontal: 20,
    },
    logoutBtn: {
        height: 56,
        borderRadius: 20,
        marginTop: 10,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 64, 129, 0.2)',
        backgroundColor: 'rgba(255, 64, 129, 0.05)',
    },
    logoutText: {
        color: '#FF4081',
        fontSize: 16,
        fontWeight: '800',
    }
});
