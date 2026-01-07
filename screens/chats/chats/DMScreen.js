import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import ScreenBackground from '../../components/ScreenBackground';
import { t } from '../../i18n';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, doc, updateDoc, getDocs, where, setDoc } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { db, sendNotification } from '../../services/firestore';
import { useUser } from '../../context/UserContext';
import Avatar from '../../components/Avatar';

const { width } = Dimensions.get('window');

export default function DMScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    // Expect targetUser (user object) OR chatId.
    // user: { uid, name, avatar, username }
    const { user: targetUser, chatId: initialChatId } = route.params || { user: { name: 'Unknown', avatar: null } };

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [chatId, setChatId] = useState(initialChatId || null);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef(null);

    const currentUser = auth.currentUser;

    // State for the other user's real-time data
    const [chatUser, setChatUser] = useState(targetUser);

    useEffect(() => {
        // Listen to the target user's profile changes
        if (targetUser?.uid) {
            const userRef = doc(db, 'users', targetUser.uid);
            const unsubscribeUser = onSnapshot(userRef, (doc) => {
                if (doc.exists()) {
                    const userData = doc.data();
                    setChatUser(prev => ({
                        ...prev,
                        ...userData,
                        name: userData.displayName || userData.username || prev.name,
                        avatar: userData.photoURL || prev.avatar
                    }));
                }
            });
            return () => unsubscribeUser();
        }
    }, [targetUser?.uid]);

    useEffect(() => {
        if (!currentUser) return;

        // If we don't have a chatId yet, check if one exists
        if (!chatId && targetUser?.uid) {
            const checkExistingChat = async () => {
                try {
                    const chatsRef = collection(db, 'chats');
                    const q = query(chatsRef, where('participants', 'array-contains', currentUser.uid));
                    const snapshot = await getDocs(q);

                    const existingChat = snapshot.docs.find(doc =>
                        doc.data().participants.includes(targetUser.uid)
                    );

                    if (existingChat) {
                        setChatId(existingChat.id);
                    } else {
                        setLoading(false); // No chat exists yet, ready to start new
                    }
                } catch (error) {
                    console.error("Error checking existing chat:", error);
                    setLoading(false);
                }
            };
            checkExistingChat();
        } else if (chatId) {
            // Subscribe to messages if we have a chatId
            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const q = query(messagesRef, orderBy('createdAt', 'asc'));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const msgs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    time: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
                }));
                setMessages(msgs);
                setLoading(false);
                // Scroll to bottom on new message
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            });

            return () => unsubscribe();
        }
    }, [currentUser, chatId, targetUser]);

    const sendMessage = async () => {
        if (!inputText.trim() || !currentUser) return;

        const text = inputText.trim();
        setInputText(''); // Clear input immediately

        try {
            let currentChatId = chatId;

            // If no chat ID, create the chat document first
            if (!currentChatId && targetUser?.uid) {
                const chatData = {
                    participants: [currentUser.uid, targetUser.uid],
                    participantsData: {
                        [currentUser.uid]: {
                            displayName: currentUser.displayName || 'Player',
                            photoURL: currentUser.photoURL || null,
                            uid: currentUser.uid
                        },
                        [targetUser.uid]: {
                            displayName: chatUser.name || targetUser.displayName || targetUser.username || 'Player',
                            photoURL: chatUser.avatar || targetUser.photoURL || null,
                            uid: targetUser.uid
                        }
                    },
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastMessage: {
                        text: text,
                        senderId: currentUser.uid,
                        createdAt: new Date()
                    }
                };

                const newChatRef = await addDoc(collection(db, 'chats'), chatData);
                currentChatId = newChatRef.id;
                setChatId(currentChatId);
            } else {
                // Update existing chat with last message
                const chatRef = doc(db, 'chats', currentChatId);
                await updateDoc(chatRef, {
                    lastMessage: {
                        text: text,
                        senderId: currentUser.uid,
                        createdAt: serverTimestamp()
                    },
                    updatedAt: serverTimestamp()
                });
            }

            // Add message to sub-collection
            await addDoc(collection(db, 'chats', currentChatId, 'messages'), {
                text: text,
                senderId: currentUser.uid,
                createdAt: serverTimestamp(),
                seen: false
            });

            // CREATE NOTIFICATION for the recipient
            await sendNotification({
                recipientId: targetUser.uid,
                senderId: currentUser.uid,
                type: 'message',
                title: t('notifications.newMessage'),
                content: `${currentUser.displayName || 'Someone'} ${t('notifications.sentYouMessage')} "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
                time: 'Just now', // Placeholder, Firestore createdAt handles the sort
                isUnread: true,
                icon: 'chatbubble-ellipses',
                iconColor: '#6662FC'
            });

        } catch (error) {
            console.error("Error sending message:", error);
            alert(t('chat.sendError'));
        }
    };


    const { avatar: myAvatar } = useUser();

    const renderMessage = ({ item }) => {
        const isMe = item.senderId === currentUser?.uid;
        const avatarUrl = isMe ? myAvatar : (chatUser?.avatar || chatUser?.photoURL);

        return (
            <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
                {!isMe && <Avatar uri={avatarUrl} size={30} style={{ marginRight: 8 }} />}
                <BlurView
                    intensity={20}
                    tint="dark"
                    style={[styles.msgBubble, isMe ? styles.bubbleMe : styles.bubbleThem]}
                >
                    <Text style={styles.msgText}>{item.text}</Text>
                    <Text style={styles.msgTime}>{item.time}</Text>
                </BlurView>
            </View>
        );
    };

    return (
        <ScreenBackground>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.headerInfo}
                    onPress={() => navigation.navigate('PlayersProfile', {
                        player: {
                            ...chatUser,
                            username: chatUser?.username || chatUser?.name || 'Player'
                        }
                    })}
                >
                    <Avatar
                        uri={chatUser?.avatar || chatUser?.photoURL}
                        size={40}
                        showOnline={true}
                        online={chatUser?.isOnline}
                        style={{ marginRight: 10 }}
                    />
                    <View>
                        <Text style={styles.headerName}>{chatUser?.name || chatUser?.displayName || chatUser?.username || 'Player'}</Text>
                        <Text style={[
                            styles.headerStatus,
                            { color: chatUser?.isOnline ? '#00E676' : '#94A3B8' }
                        ]}>
                            {chatUser?.isOnline ? t('chat.online') : t('chat.offline')}
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Ionicons name="call-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Ionicons name="videocam-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* MESSAGES */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8B5CF6" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            {/* INPUT AREA */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={20}
            >
                <BlurView intensity={30} tint="dark" style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        placeholder={t('chat.typeMessage')}
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        value={inputText}
                        onChangeText={setInputText}
                        returnKeyType="send"
                        onSubmitEditing={sendMessage}
                    />
                    <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
                        <Ionicons name="send" size={20} color="#8B5CF6" />
                    </TouchableOpacity>
                </BlurView>
            </KeyboardAvoidingView>
        </ScreenBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        marginTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backBtn: {
        padding: 5,
        marginRight: 10,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#00E676',
    },
    headerName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    headerStatus: {
        fontSize: 12,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 15,
    },
    iconBtn: {
        padding: 5,
    },
    listContent: {
        padding: 20,
        paddingBottom: 20,
    },
    msgRow: {
        flexDirection: 'row',
        marginBottom: 15,
        alignItems: 'flex-end',
    },
    msgRowMe: {
        justifyContent: 'flex-end',
    },
    msgRowThem: {
        justifyContent: 'flex-start',
    },
    msgAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 8,
    },
    msgBubble: {
        maxWidth: '75%',
        padding: 12,
        borderRadius: 20,
        overflow: 'hidden',
    },
    bubbleMe: {
        backgroundColor: 'rgba(139, 92, 246, 0.3)',
        borderBottomRightRadius: 4,
    },
    bubbleThem: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderBottomLeftRadius: 4,
    },
    msgText: {
        color: '#FFF',
        fontSize: 15,
        marginBottom: 4,
    },
    msgTime: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 10,
        alignSelf: 'flex-end',
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        margin: 10,
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
        flex: 1,
        color: '#FFF',
        paddingHorizontal: 15,
        fontSize: 15,
        height: 40,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
