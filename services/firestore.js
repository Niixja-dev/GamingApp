import {
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    increment,
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getFirestore,
    addDoc,
    writeBatch,
    onSnapshot
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { app } from './firebase';

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);

// --- LIKES SYSTEM ---

/**
 * Toggle like for a video
 * @param {string} userId - ID of the user liking the video
 * @param {object} videoData - Object containing video details (id, title, thumbnail, etc.)
 */
export const toggleLikeVideo = async (userId, videoData) => {
    if (!userId || !videoData || !videoData.id) return;

    const likeRef = doc(db, 'users', userId, 'likedVideos', videoData.id);

    try {
        const likeSnap = await getDoc(likeRef);

        if (likeSnap.exists()) {
            // Unlike
            await deleteDoc(likeRef);
            return false;
        } else {
            // Like
            const likeData = {
                videoId: videoData.id,
                title: videoData.title || 'Untitled',
                thumbnail: videoData.thumbnail || videoData.image || null,
                videoUrl: videoData.videoUrl || videoData.url || null,
                streamer: videoData.streamer || 'Unknown',
                avatar: videoData.avatar || null,
                likedAt: serverTimestamp()
            };
            await setDoc(likeRef, likeData);
            return true;
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        throw error;
    }
};

/**
 * Check if a video is liked by the user
 * @param {string} userId 
 * @param {string} videoId 
 */
export const checkIsVideoLiked = async (userId, videoId) => {
    if (!userId || !videoId) return false;
    try {
        const likeRef = doc(db, 'users', userId, 'likedVideos', videoId);
        const likeSnap = await getDoc(likeRef);
        return likeSnap.exists();
    } catch (error) {
        console.error("Error checking like status:", error);
        return false;
    }
};

/**
 * Get all liked videos for a user
 * @param {string} userId 
 */
export const getLikedVideos = async (userId) => {
    if (!userId) return [];
    try {
        const likesRef = collection(db, 'users', userId, 'likedVideos');
        const q = query(likesRef, orderBy('likedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching liked videos (Check console for Index Link):", error);
        throw error;
    }
};

/**
 * Notifications
 */

/**
 * Send a notification to a user
 * @param {Object} data Notification details
 */
export const sendNotification = async (data) => {
    try {
        const notifData = {
            ...data,
            createdAt: serverTimestamp(),
            isUnread: true
        };
        const docRef = await addDoc(collection(db, 'notifications'), notifData);
        return docRef.id;
    } catch (error) {
        console.error("Error sending notification:", error);
        throw error;
    }
};

/**
 * Subscribe to notifications in real-time
 * @param {string} userId
 * @param {Function} onUpdate Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToNotifications = (userId, onUpdate) => {
    if (!userId) return () => { };

    const q = query(
        collection(db, 'notifications'),
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        onUpdate(list);
    }, (error) => {
        console.error("subscribeToNotifications error:", error);
    });
};

/**
 * Delete a single notification
 * @param {string} notificationId
 */
export const deleteNotification = async (notificationId) => {
    try {
        await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
        console.error("Error deleting notification:", error);
        throw error;
    }
};

/**
 * Delete all notifications for a user (Mark all as read)
 * @param {string} userId
 */
export const deleteAllNotifications = async (userId) => {
    if (!userId) return;
    try {
        const q = query(collection(db, 'notifications'), where('recipientId', '==', userId));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error clearing notifications:", error);
        throw error;
    }
};

// --- FOLLOW SYSTEM ---

/**
 * Update following status for a player (Atomic update)
 * @param {string} currentUid 
 * @param {string} targetUid 
 * @param {boolean} isFollowing 
 * @param {Object} data - Contains newFollowedPlayers, newFollowedUids, newCount
 */
export const updateFollowingStatus = async (currentUid, targetUid, isFollowing, data) => {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', currentUid);
    const targetRef = doc(db, 'users', targetUid);

    batch.update(userRef, {
        followedPlayers: data.newFollowedPlayers,
        followedUids: data.newFollowedUids,
        followingCount: data.newCount
    });

    batch.update(targetRef, {
        followersCount: increment(isFollowing ? 1 : -1)
    });

    await batch.commit();
};

/**
 * Update following status for a game
 * @param {string} userId 
 * @param {Object} data - Contains newFollowedGames, newCount
 */
export const updateGameFollowingStatus = async (userId, data) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        followedGames: data.newFollowedGames,
        followingCount: data.newCount
    });
};

/**
 * Subscribe to user document changes
 * @param {string} userId 
 * @param {Function} onUpdate 
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserDoc = (userId, onUpdate) => {
    if (!userId) return () => { };
    return onSnapshot(doc(db, 'users', userId), (snap) => {
        if (snap.exists()) {
            onUpdate({ id: snap.id, ...snap.data() });
        } else {
            onUpdate(null);
        }
    }, (error) => {
        console.error("subscribeToUserDoc error:", error);
    });
};

/**
 * Add a new video clip
 */
export const addUserVideo = async (videoData) => {
    const docRef = await addDoc(collection(db, 'videos'), {
        ...videoData,
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

/**
 * Delete a user video and its associated likes
 */
export const deleteUserVideo = async (videoId, userId, extraCleanup = null) => {
    const batch = writeBatch(db);

    // 1. Delete main video doc
    batch.delete(doc(db, 'videos', videoId));

    // 2. Delete associated like for owner
    batch.delete(doc(db, 'users', userId, 'likedVideos', videoId));

    await batch.commit();

    // 3. Handle extra cleanup (ghosts) if provided
    if (extraCleanup && (extraCleanup.title || extraCleanup.url)) {
        const cleanupQueries = [];
        if (extraCleanup.title) {
            cleanupQueries.push(query(collection(db, 'videos'),
                where('userId', '==', userId),
                where('title', '==', extraCleanup.title)
            ));
        }
        if (extraCleanup.url) {
            cleanupQueries.push(query(collection(db, 'videos'),
                where('userId', '==', userId),
                where('cloudinaryUrl', '==', extraCleanup.url)
            ));
        }

        for (const q of cleanupQueries) {
            const snapshot = await getDocs(q);
            for (const d of snapshot.docs) {
                // Deleted ghost cleanup log
                const b = writeBatch(db);
                b.delete(doc(db, 'videos', d.id));
                b.delete(doc(db, 'users', userId, 'likedVideos', d.id));
                await b.commit();
            }
        }
    }
};

/**
 * Update user games, ranks and platforms
 */
export const updateUserGamesAndRanks = async (userId, data) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        games: data.games,
        ranks: data.ranks,
        gameNames: data.gameNames,
        platforms: data.platforms || [],
        updatedAt: serverTimestamp()
    });
};

/**
 * Increment/Decrement user posts count
 */
export const updateUserPostsCount = async (userId, incrementValue) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        postsCount: increment(incrementValue)
    });
};

/**
 * Get public profile data for a user
 */
export const getUserPublicData = async (userId) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            const data = userDoc.data();
            return {
                uid: userId,
                displayName: data.displayName || data.username || 'Gamer',
                photoURL: data.photoURL || data.avatar || null,
                username: data.username || ''
            };
        }
    } catch (error) {
        console.error("Error fetching public user data:", error);
    }
    return null;
};

/**
 * Fetch UIDs of players followed by a list of UIDs (FoF Discovery)
 */
export const fetchDiscoveryUids = async (focusUids) => {
    try {
        const fofResults = await Promise.all(focusUids.map(async (uid) => {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                return (data.followedPlayers || []).map(p => p.uid || p.id);
            }
            return [];
        }));

        const allFofUids = fofResults.flat();
        return [...new Set(allFofUids)];
    } catch (error) {
        console.error("Error fetching discovery UIDs:", error);
        return [];
    }
};

/**
 * Fetch videos for a list of UIDs
 */
export const fetchVideosByUsers = async (uids, limitCount = 50) => {
    if (!uids || uids.length === 0) return [];

    try {
        const vQuery = query(
            collection(db, 'videos'),
            where('userId', 'in', uids),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const vSnap = await getDocs(vQuery);
        return vSnap.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
    } catch (error) {
        console.error("Error fetching videos by users:", error);
        return [];
    }
};

export { db, storage };
