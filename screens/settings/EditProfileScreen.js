import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    TextInput,
    Image,
    Alert,
    Switch,
    Modal,
    Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../../context/UserContext';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { auth } from '../../services/firebase';
import { db } from '../../services/firestore';
import { ActivityIndicator } from 'react-native';
import { t } from '../../i18n';

const { width, height } = Dimensions.get('window');

export default function EditProfileScreen({ navigation }) {
    const { isOnline, setIsOnline, bio, setBio, username, setUsername, location, setLocation, avatar, setAvatar, coverPhoto, setCoverPhoto } = useUser();
    const [localBio, setLocalBio] = React.useState(bio);
    const [localUsername, setLocalUsername] = React.useState(username);
    const [localLocation, setLocalLocation] = React.useState(location);
    const [localAvatar, setLocalAvatar] = React.useState(avatar);
    const [localCoverPhoto, setLocalCoverPhoto] = React.useState(coverPhoto);
    const [loadingLocation, setLoadingLocation] = React.useState(false);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [coverModalVisible, setCoverModalVisible] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    const uriToBase64 = async (uri) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleSave = async () => {
        if (!auth.currentUser) return;
        setIsSaving(true);
        try {
            let finalAvatarUrl = localAvatar;
            let finalCoverPhotoUrl = localCoverPhoto;

            // 1. If avatar changed and is a local URI, convert to Base64
            if (localAvatar && localAvatar.startsWith('file://')) {
                finalAvatarUrl = await uriToBase64(localAvatar);
            }

            // 1b. If cover photo changed and is a local URI, convert to Base64
            if (localCoverPhoto && localCoverPhoto.startsWith('file://')) {
                finalCoverPhotoUrl = await uriToBase64(localCoverPhoto);
            }

            // 2. Update Firestore
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                username: localUsername,
                bio: localBio,
                location: localLocation,
                photoURL: finalAvatarUrl,
                coverPhotoURL: finalCoverPhotoUrl
            });

            // 3. Update Context (for instant local feedback)
            setBio(localBio);
            setUsername(localUsername);
            setLocation(localLocation);
            setAvatar(finalAvatarUrl);
            setCoverPhoto(finalCoverPhotoUrl);

            Alert.alert(t('common.success'), t('settings.saveChanges') + " !");
            navigation.goBack();
        } catch (error) {
            console.error("Save error:", error);
            Alert.alert(t('common.error'), "Could not save profile: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const pickFromCamera = async () => {
        console.log('Pick from camera triggered');
        setModalVisible(false);
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            console.log('Camera permission result:', permissionResult);

            if (permissionResult.granted === false) {
                Alert.alert("Permission to access camera is required!");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'], // Using array of strings for compatibility
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7, // Lowering quality slightly for Base64 storage
            });

            console.log('Camera result:', result.canceled ? 'Canceled' : 'Success');

            if (!result.canceled) {
                setLocalAvatar(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Camera Error:', error);
            Alert.alert("Camera Error", error.message);
        }
    };

    const pickFromGallery = async () => {
        console.log('Pick from gallery triggered');
        setModalVisible(false);
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log('Gallery permission result:', permissionResult);

            if (permissionResult.granted === false) {
                Alert.alert("Permission to access gallery is required!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            console.log('Gallery result:', result.canceled ? 'Canceled' : 'Success');

            if (!result.canceled) {
                setLocalAvatar(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Gallery Error:', error);
            Alert.alert("Gallery Error", error.message);
        }
    };

    const handleDeleteAvatar = () => {
        setLocalAvatar(null);
        setModalVisible(false);
    };

    const handleDeleteCoverPhoto = () => {
        setLocalCoverPhoto(null);
        setCoverModalVisible(false);
    };

    const pickCoverFromGallery = async () => {
        console.log('Pick cover from gallery triggered');
        setCoverModalVisible(false);
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert("Permission to access gallery is required!");
                return;
            }
            // Vertical crop (9:16) for full screen background
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [9, 16],
                quality: 0.6,
            });
            if (!result.canceled) {
                setLocalCoverPhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Gallery Error:', error);
            Alert.alert("Gallery Error", error.message);
        }
    };

    const handleLocateMe = async () => {
        setLoadingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                setLoadingLocation(false);
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            // Reverse geocode to get city/country
            let address = await Location.reverseGeocodeAsync({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
            });

            if (address.length > 0) {
                const { city, country, region } = address[0];
                const locationString = `${city || region}, ${country}`;
                setLocalLocation(locationString);
            }
        } catch (error) {
            Alert.alert('Error fetching location', error.message);
        } finally {
            setLoadingLocation(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0F0F3D', '#0A0E27']} style={StyleSheet.absoluteFill} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <BlurView intensity={20} tint="dark" style={styles.actionBlur}>
                        <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </BlurView>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings.editProfile')}</Text>
                {isSaving ? (
                    <ActivityIndicator size="small" color="#4D4DFF" />
                ) : (
                    <TouchableOpacity onPress={handleSave}>
                        <Text style={styles.saveText}>{t('common.save')}</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.avatarSection}>
                    {/* COVER PHOTO AREA */}
                    <View style={styles.coverPhotoContainer}>
                        <TouchableOpacity style={styles.coverPhotoWrapper} onPress={() => setCoverModalVisible(true)}>
                            {localCoverPhoto ? (
                                <Image source={{ uri: localCoverPhoto }} style={styles.coverPhoto} />
                            ) : (
                                <View style={styles.coverPlaceholder}>
                                    <Ionicons name="image-outline" size={30} color="rgba(255,255,255,0.3)" />
                                    <Text style={styles.coverPlaceholderText}>Add Cover Photo</Text>
                                </View>
                            )}
                            <View style={styles.editCoverBadge}>
                                <Ionicons name="camera" size={14} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.avatarWrapper, { borderColor: isOnline ? '#00E676' : '#FF3D00' }]}>
                        {localAvatar ? (
                            <Image source={{ uri: localAvatar }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Ionicons name="person" size={50} color="rgba(255,255,255,0.6)" />
                            </View>
                        )}
                        <TouchableOpacity style={styles.cameraBtn} onPress={() => setModalVisible(true)}>
                            <BlurView intensity={30} tint="dark" style={styles.cameraBlur}>
                                <Ionicons name="camera" size={20} color="#FFF" />
                            </BlurView>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ONLINE STATUS TOGGLE */}
                <View style={styles.statusGroup}>
                    <View style={styles.statusLeft}>
                        <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#00E676' : '#FF3D00' }]} />
                        <View>
                            <Text style={styles.label}>{t('settings.onlineStatus')}</Text>
                            <Text style={styles.statusDesc}>{isOnline ? 'You are visible to everyone' : 'You are currently appearing offline'}</Text>
                        </View>
                    </View>
                    <Switch
                        value={isOnline}
                        onValueChange={setIsOnline}
                        trackColor={{ false: '#1E293B', true: '#00E676' }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('auth.username')}</Text>
                    <View style={styles.glassInput}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <TextInput
                            style={styles.input}
                            value={localUsername}
                            onChangeText={setLocalUsername}
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={[styles.label, { marginBottom: 0 }]}>{t('auth.location')}</Text>
                        <TouchableOpacity onPress={handleLocateMe} disabled={loadingLocation}>
                            <Text style={{ color: '#00E676', fontSize: 12, fontWeight: '700' }}>
                                {loadingLocation ? t('auth.locating') : t('auth.locateMe')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.glassInput}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <TextInput
                            style={styles.input}
                            value={localLocation}
                            onChangeText={setLocalLocation}
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('settings.bio')}</Text>
                    <View style={[styles.glassInput, styles.bioInput]}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            multiline
                            value={localBio}
                            onChangeText={setLocalBio}
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />
                    </View>
                </View>
            </ScrollView>

            {/* IMAGE PICKER MODAL */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <BlurView
                        intensity={40}
                        tint="dark"
                        experimentalBlurMethod="dimezisBlurView"
                        style={styles.optionsContainer}
                    >
                        <View style={styles.optionsInner}>
                            <Text style={styles.optionsHeader}>Change Profile Picture</Text>

                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={pickFromCamera}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(77, 77, 255, 0.15)' }]}>
                                    <Ionicons name="camera" size={20} color="#4D4DFF" />
                                </View>
                                <Text style={styles.optionLabel}>Take Photo</Text>
                                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={pickFromGallery}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
                                    <Ionicons name="images" size={20} color="#00E676" />
                                </View>
                                <Text style={styles.optionLabel}>Choose from Gallery</Text>
                                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
                            </TouchableOpacity>

                            {localAvatar && (
                                <TouchableOpacity
                                    style={[styles.optionItem, { borderColor: 'rgba(255, 61, 0, 0.2)', backgroundColor: 'rgba(255, 61, 0, 0.05)' }]}
                                    onPress={handleDeleteAvatar}
                                >
                                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 61, 0, 0.15)' }]}>
                                        <Ionicons name="trash" size={20} color="#FF3D00" />
                                    </View>
                                    <Text style={[styles.optionLabel, { color: '#FF3D00' }]}>Remove Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </BlurView>
                </Pressable>
            </Modal>
            {/* COVER PHOTO PICKER MODAL */}
            <Modal
                transparent={true}
                visible={coverModalVisible}
                animationType="fade"
                onRequestClose={() => setCoverModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setCoverModalVisible(false)}>
                    <BlurView
                        intensity={40}
                        tint="dark"
                        experimentalBlurMethod="dimezisBlurView"
                        style={styles.optionsContainer}
                    >
                        <View style={styles.optionsInner}>
                            <Text style={styles.optionsHeader}>Change Cover Photo</Text>
                            <TouchableOpacity
                                style={styles.optionItem}
                                onPress={pickCoverFromGallery}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
                                    <Ionicons name="images" size={20} color="#00E676" />
                                </View>
                                <Text style={styles.optionLabel}>Choose from Gallery</Text>
                                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
                            </TouchableOpacity>

                            {localCoverPhoto && (
                                <TouchableOpacity
                                    style={[styles.optionItem, { borderColor: 'rgba(255, 61, 0, 0.2)', backgroundColor: 'rgba(255, 61, 0, 0.05)' }]}
                                    onPress={handleDeleteCoverPhoto}
                                >
                                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 61, 0, 0.15)' }]}>
                                        <Ionicons name="trash" size={20} color="#FF3D00" />
                                    </View>
                                    <Text style={[styles.optionLabel, { color: '#FF3D00' }]}>Remove Cover</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </BlurView>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F0F3D' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
    actionBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', textTransform: 'uppercase' },
    saveText: { color: '#4D4DFF', fontSize: 16, fontWeight: '700' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
    avatarSection: { alignItems: 'center', marginBottom: 40 },
    coverPhotoContainer: { width: '100%', alignItems: 'center', marginBottom: -60, opacity: 0.8 },
    coverPhotoWrapper: { width: '100%', height: 120, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', position: 'relative' },
    coverPhoto: { width: '100%', height: '100%' },
    coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    coverPlaceholderText: { color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 5, fontWeight: '600' },
    editCoverBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 15 },
    avatarWrapper: { width: 120, height: 120, borderRadius: 60, position: 'relative', borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F0F3D' },
    avatar: { width: 114, height: 114, borderRadius: 57, borderWidth: 2, borderColor: '#0F0F3D' },
    avatarPlaceholder: { backgroundColor: 'rgba(255, 255, 255, 0.1)', alignItems: 'center', justifyContent: 'center' },
    cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
    cameraBlur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    statusGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        padding: 15,
        borderRadius: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    statusDesc: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 12,
        marginTop: 2,
    },
    inputGroup: { marginBottom: 25 },
    label: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10, marginLeft: 5 },
    glassInput: { height: 56, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    input: { flex: 1, paddingHorizontal: 20, color: '#FFF', fontSize: 16 },
    bioInput: { height: 120, paddingTop: 10 },
    // MODAL STYLES
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    optionsContainer: {
        width: 300,
        backgroundColor: 'rgba(15, 15, 61, 0.9)',
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: 'rgba(77, 77, 255, 0.4)',
        overflow: 'hidden',
        padding: 5,
    },
    optionsInner: {
        padding: 20,
    },
    optionsHeader: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 20,
        textAlign: 'center',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginBottom: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    optionLabel: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
    },
});
