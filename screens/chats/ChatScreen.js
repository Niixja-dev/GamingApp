import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../i18n';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { db } from '../../services/firestore';
import Avatar from '../../components/Avatar';

const ChatItem = ({ chat, currentUser, onChatPress }) => {
    const [userData, setUserData] = useState({
        name: chat.name,
        avatar: chat.avatar,
        online: chat.online || false
    });

    useEffect(() => {
        if (!chat.otherUserId) return;

        const userRef = doc(db, 'users', chat.otherUserId);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData({
                    name: data.displayName || data.username || 'Unknown',
                    avatar: data.photoURL || data.avatar || null,
                    online: data.isOnline || false
                });
            }
        });

        return () => unsubscribe();
    }, [chat.otherUserId]);

    return (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => onChatPress({ ...chat, ...userData })}
        >
            <Avatar
                uri={userData.avatar}
                size={56}
                showOnline={true}
                online={userData.online}
            />

            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{userData.name}</Text>
                    <Text style={styles.chatTime}>{chat.time}</Text>
                </View>
                <View style={styles.chatFooter}>
                    <Text style={styles.chatMessage} numberOfLines={1}>
                        {chat.lastMessage?.senderId === currentUser.uid ? `${t('chat.you')}: ` : ''}{chat.message}
                    </Text>
                    {chat.unread > 0 && (
                        <LinearGradient colors={['#6662FC', '#4D4DFF']} style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{chat.unread}</Text>
                        </LinearGradient>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const ChatScreen = () => {
    const navigation = useNavigation();
    const { currentLanguage } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [chats, setChats] = useState([]);
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        setLoading(true);
        const chatsRef = collection(db, 'chats');
        const q = query(
            chatsRef,
            where('participants', 'array-contains', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedChats = snapshot.docs.map(doc => {
                const data = doc.data();
                const otherUserId = data.participants.find(uid => uid !== currentUser.uid);
                const otherUserData = data.participantsData ? data.participantsData[otherUserId] : {};

                return {
                    id: doc.id,
                    otherUserId,
                    name: otherUserData.displayName || otherUserData.username || 'Unknown',
                    avatar: otherUserData.photoURL || otherUserData.avatar || null,
                    message: data.lastMessage?.text || '',
                    time: data.lastMessage?.createdAt ? new Date(data.lastMessage.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    timestamp: data.updatedAt ? data.updatedAt.toMillis() : 0,
                    unread: data.unreadCount?.[currentUser.uid] || 0,
                    online: false,
                    ...data
                };
            });

            loadedChats.sort((a, b) => b.timestamp - a.timestamp);
            setChats(loadedChats);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching chats: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleChatPress = (chat) => {
        navigation.navigate('DMScreen', {
            chatId: chat.id,
            user: {
                uid: chat.otherUserId,
                name: chat.name,
                avatar: chat.avatar
            }
        });
    };

    return (
        <ScreenBackground style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('chat.messages')}</Text>
                <TouchableOpacity
                    style={styles.newChatBtn}
                    onPress={() => navigation.navigate('Search', { initialTab: 'Players' })}
                >
                    <Ionicons name="create-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                    <Text style={styles.loadingText}>{t('common.loading')}</Text>
                </View>
            ) : chats.length > 0 ? (
                <View style={{ flex: 1 }}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <View style={styles.chatList}>
                            {chats.map((chat) => (
                                <ChatItem
                                    key={chat.id}
                                    chat={chat}
                                    currentUser={currentUser}
                                    onChatPress={handleChatPress}
                                />
                            ))}
                        </View>
                    </ScrollView>
                </View>
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubble-ellipses-outline" size={48} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.emptyText}>{t('chat.noMessages')}</Text>
                    <Text style={styles.emptySubText}>{t('chat.startConversation')}</Text>
                </View>
            )}
        </ScreenBackground>
    );
};

export default ChatScreen;

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        paddingTop: 65,
        paddingBottom: 20,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
    },
    newChatBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    scrollContent: { paddingBottom: 120 },
    sectionArea: { marginBottom: 30 },
    sectionLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 13,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        paddingHorizontal: 25,
        marginBottom: 15,
    },
    activeFriendsList: { paddingHorizontal: 25 },
    activeFriend: { alignItems: 'center', marginRight: 20, width: 60 },
    activeAvatarWrapper: {
        width: 60,
        height: 60,
        borderRadius: 30,
        padding: 3,
        borderWidth: 2,
        borderColor: '#00E676',
        marginBottom: 8,
    },
    activeAvatar: { width: '100%', height: '100%', borderRadius: 30 },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#00E676',
        borderWidth: 3,
        borderColor: '#0F0F3D',
    },
    activeName: { color: '#FFF', fontSize: 12, fontWeight: '600' },

    chatList: { paddingHorizontal: 25 },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 15,
        borderRadius: 25,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    avatarContainer: { position: 'relative' },
    chatAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
    chatOnlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#00E676',
        borderWidth: 2,
        borderColor: 'rgba(20, 20, 60, 1)',
    },
    chatContent: { flex: 1, marginLeft: 15 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    chatName: { color: '#FFF', fontSize: 17, fontWeight: '700' },
    chatTime: { color: 'rgba(255, 255, 255, 0.4)', fontSize: 12 },
    chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chatMessage: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, flex: 1, marginRight: 10 },
    unreadBadge: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    unreadText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: 'rgba(255,255,255,0.5)',
        marginTop: 10,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 15,
    },
    emptySubText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginTop: 5,
    },
});
