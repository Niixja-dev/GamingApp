import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { t } from '../../i18n';

import { db, subscribeToNotifications, deleteNotification, deleteAllNotifications } from '../../services/firestore';
import { auth } from '../../services/firebase';
import { ActivityIndicator } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function NotificationsScreen({ navigation }) {
    const [notifications, setNotifications] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const currentUser = auth.currentUser;

    React.useEffect(() => {
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const unsubscribe = subscribeToNotifications(currentUser.uid, (list) => {
            const listWithTime = list.map(notif => ({
                ...notif,
                time: notif.createdAt ? formatTime(notif.createdAt.toDate()) : 'Recently'
            }));
            setNotifications(listWithTime);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const formatTime = (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return `Just now`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString();
    };

    const handleDeleteNotification = async (id) => {
        try {
            await deleteNotification(id);
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const clearAll = async () => {
        if (!currentUser) return;
        try {
            await deleteAllNotifications(currentUser.uid);
        } catch (error) {
            console.error("Error clearing notifications:", error);
        }
    };

    const renderRightActions = (id) => (
        <TouchableOpacity
            style={styles.deleteAction}
            onPress={() => deleteNotification(id)}
        >
            <Ionicons name="trash-outline" size={24} color="#FFF" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* BACKGROUND GRADIENT */}
            <LinearGradient
                colors={['#0F0F3D', '#0A0E27']}
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
                <Text style={styles.headerTitle}>{t('notifications.notifications')}</Text>
                <TouchableOpacity
                    style={styles.clearBtn}
                    onPress={clearAll}
                    disabled={notifications.length === 0}
                >
                    <Text style={[styles.clearText, notifications.length === 0 && { opacity: 0.3 }]}>{t('notifications.markAllRead')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator size="large" color="#6662FC" />
                    </View>
                ) : notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <BlurView intensity={20} tint="dark" style={styles.emptyIconCircle}>
                            <Ionicons name="notifications-off-outline" size={40} color="rgba(255,255,255,0.2)" />
                        </BlurView>
                        <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
                    </View>
                ) : (
                    notifications.map((notif) => (
                        <View key={notif.id} style={styles.swipeWrapper}>
                            <Swipeable
                                renderRightActions={() => renderRightActions(notif.id)}
                                onSwipeableOpen={() => deleteNotification(notif.id)}
                            >
                                <View style={styles.notifCard}>
                                    <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
                                    <LinearGradient
                                        colors={['rgba(15, 15, 61, 0.4)', 'rgba(58, 58, 138, 0.4)']}
                                        start={{ x: 0, y: 0.5 }}
                                        end={{ x: 1, y: 0.5 }}
                                        style={StyleSheet.absoluteFill}
                                    />

                                    <View style={styles.cardContent}>
                                        <View style={[styles.iconBox, { backgroundColor: `${notif.iconColor || '#6662FC'}20` }]}>
                                            {notif.type === 'tournament' || notif.type === 'live' ? (
                                                <MaterialCommunityIcons name={notif.icon || 'bell'} size={22} color={notif.iconColor || '#6662FC'} />
                                            ) : (
                                                <Ionicons name={notif.icon || 'notifications'} size={22} color={notif.iconColor || '#6662FC'} />
                                            )}
                                        </View>

                                        <View style={styles.textView}>
                                            <View style={styles.titleRow}>
                                                <Text style={styles.notifTitle}>{notif.title}</Text>
                                                <Text style={styles.notifTime}>{notif.time}</Text>
                                            </View>
                                            <Text style={styles.notifBody} numberOfLines={2}>
                                                {notif.content}
                                            </Text>
                                        </View>

                                        {notif.isUnread && <View style={styles.unreadDot} />}
                                    </View>
                                </View>
                            </Swipeable>
                        </View>
                    ))
                )}
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
    clearBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    clearText: {
        color: '#94A3B8',
        fontSize: 13,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 100,
    },
    notifCard: {
        height: 90,
        borderRadius: 25,
        marginBottom: 15,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textView: {
        flex: 1,
        marginLeft: 15,
        marginRight: 10,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    notifTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    notifTime: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '500',
    },
    notifBody: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 13,
        lineHeight: 18,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF4081',
        shadowColor: '#FF4081',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 5,
    },
    swipeWrapper: {
        marginBottom: 15,
        borderRadius: 25,
        overflow: 'hidden',
    },
    deleteAction: {
        backgroundColor: '#FF4081',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: 90,
        borderRadius: 25,
        marginLeft: 10,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: height * 0.2,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 16,
        fontWeight: '600',
    }
});
