import React, { createContext, useState, useContext, useEffect } from 'react';
import { doc, updateDoc, setDoc, onSnapshot, serverTimestamp, collection, deleteDoc, increment, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, sendNotification, updateFollowingStatus, updateGameFollowingStatus, subscribeToUserDoc, addUserVideo, deleteUserVideo, updateUserGamesAndRanks, updateUserPostsCount } from '../services/firestore';
import { auth } from '../services/firebase';
import { uploadVideo } from '../services/cloudinary';
import { t } from '../i18n';
import { saveVideo, getUserVideos, deleteVideo as deleteVideoFromDB } from '../services/database';

const UserContext = createContext();

export function UserProvider({ children }) {
    const [isOnline, setIsOnline] = useState(true);
    const [username, setUsername] = useState("Player");
    const [location, setLocation] = useState("");
    const [bio, setBio] = useState("");
    const [avatar, setAvatar] = useState(null);
    const [coverPhoto, setCoverPhoto] = useState(null);
    const [postsCount, setPostsCount] = useState(0);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [userClips, setUserClips] = useState([]);
    const [games, setGames] = useState([]);
    const [gameNames, setGameNames] = useState({});
    const [platforms, setPlatforms] = useState([]);
    const [ranks, setRanks] = useState({});
    const [followedGames, setFollowedGames] = useState([]);
    const [followedPlayers, setFollowedPlayers] = useState([]);
    const [followedUids, setFollowedUids] = useState([]); // Simple list for queries

    useEffect(() => {
        let unsubscribeDoc = null;
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Listen to Firestore document changes via Centralized Service
                unsubscribeDoc = subscribeToUserDoc(user.uid, async (data) => {
                    if (data) {
                        const currentUsername = data.username || data.displayName || user.displayName || "Player";
                        const currentAvatar = data.photoURL || user.photoURL || null;

                        setUsername(currentUsername);
                        setLocation(data.location || "");
                        setBio(data.bio || "");
                        setAvatar(currentAvatar);
                        setCoverPhoto(data.coverPhotoURL || null);
                        setPostsCount(data.postsCount || 0);
                        setFollowersCount(data.followersCount || 0);
                        setFollowingCount(data.followingCount || 0);
                        setGames(data.games || []);
                        setGameNames(data.gameNames || {});
                        setPlatforms(data.platforms || []);
                        setRanks(data.ranks || {});
                        const firestoreFollowedPlayers = data.followedPlayers || [];
                        const firestoreFollowedUids = data.followedUids || [];
                        setFollowedGames(data.followedGames || []);
                        setFollowedPlayers(firestoreFollowedPlayers);
                        setFollowedUids(firestoreFollowedUids);

                        // SELF-HEALING: If UIDs list is out of sync or missing, trigger a background update
                        if (firestoreFollowedPlayers.length > 0 &&
                            (firestoreFollowedUids.length !== firestoreFollowedPlayers.length)) {
                            const newUids = firestoreFollowedPlayers.map(p => p.uid || p.id);
                            updateDoc(doc(db, 'users', user.uid), {
                                followedUids: newUids
                            }).catch(err => console.error("Self-healing sync failed:", err));
                        }

                        // Load videos from SQLite with user data
                        try {
                            const cachedVideos = await getUserVideos(user.uid);
                            setUserClips(cachedVideos.map(v => ({
                                id: v.id,
                                videoUrl: v.cloudinary_url,
                                cloudinaryUrl: v.cloudinary_url,
                                thumbnail: v.thumbnail_url,
                                title: v.title,
                                views: v.views,
                                streamer: currentUsername,
                                avatar: currentAvatar,
                            })));
                            // Sync posts count with actual available videos to prevent mismatch
                            if (cachedVideos.length !== data.postsCount) {
                                setPostsCount(cachedVideos.length);
                            }
                        } catch (dbErr) {
                            console.warn("Failed to load user videos from DB:", dbErr);
                            setUserClips([]);
                            setPostsCount(0);
                        }
                    } else {
                        // Fallback to Auth data if Doc doesn't exist yet
                        setUsername(user.displayName || "Player");
                        setAvatar(user.photoURL || null);
                    }
                });
            } else {
                if (unsubscribeDoc) unsubscribeDoc();
                // Reset state on logout
                setUsername("Player");
                setLocation("");
                setBio("");
                setAvatar(null);
                setCoverPhoto(null);
                setPostsCount(0);
                setFollowersCount(0);
                setFollowingCount(0);
                setUserClips([]);
                setGames([]);
                setGameNames({});
                setPlatforms([]);
                setRanks({});
                setFollowedGames([]);
                setFollowedPlayers([]);
                setFollowedUids([]);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeDoc) unsubscribeDoc();
        };
    }, []);

    const setOnlineStatus = async (status) => {
        setIsOnline(status);
        const currentUser = auth.currentUser;
        if (currentUser) {
            try {
                const userRef = doc(db, 'users', currentUser.uid);
                await setDoc(userRef, {
                    isOnline: status,
                    lastSeen: serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error("Error updating online status:", error);
            }
        }
    };

    const addUserClip = async (videoUri, title) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            // 1. Upload to Cloudinary
            const { url, thumbnailUrl } = await uploadVideo(videoUri);

            // 2. Create video object
            const videoData = {
                userId: currentUser.uid,
                cloudinaryUrl: url,
                thumbnailUrl: thumbnailUrl,
                title: title,
                views: 0,
            };

            // 3. Save to Firestore via Service
            const videoId = await addUserVideo(videoData);

            // Set the ID for local use
            const finalVideoData = { ...videoData, id: videoId };

            // 4. Cache in SQLite
            await saveVideo(finalVideoData);

            // 5. Update local state
            setUserClips(prev => [{
                id: finalVideoData.id,
                videoUrl: finalVideoData.cloudinaryUrl,
                thumbnail: finalVideoData.thumbnailUrl,
                title: finalVideoData.title,
                views: 0,
                createdAt: new Date().toISOString(), // Fallback for immediate UI update
            }, ...prev]);

            // Increment postsCount via Service
            const newPostsCount = (postsCount || 0) + 1;
            setPostsCount(newPostsCount);
            await updateUserPostsCount(currentUser.uid, 1);

            return true;
        } catch (error) {
            console.error('Error adding video:', error);
            throw error;
        }
    };

    const toggleFollowGame = async (game) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        if (!game || !game.id) return;

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const gameIdStr = String(game.id);

            setFollowedGames(currentFollowed => {
                const isFollowing = currentFollowed.some(g => String(g.id) === gameIdStr);
                let newFollowedGames;

                if (isFollowing) {
                    newFollowedGames = currentFollowed.filter(g => String(g.id) !== gameIdStr);
                } else {
                    newFollowedGames = [...currentFollowed, {
                        id: gameIdStr,
                        title: game.title || 'Unknown Game',
                        image: game.image || game.backgroundImage || null,
                        genres: game.genres || []
                    }];
                }

                const currentPlayersCount = followedPlayers?.length || 0;
                const newFollowingCount = newFollowedGames.length + currentPlayersCount;
                setFollowingCount(newFollowingCount);

                // Start Firestore update asynchronously via Centralized Service
                (async () => {
                    try {
                        await updateGameFollowingStatus(currentUser.uid, {
                            newFollowedGames: newFollowedGames,
                            newCount: newFollowingCount
                        });
                    } catch (err) {
                        console.error("toggleFollowGame: Service Error:", err);
                    }
                })();

                return newFollowedGames;
            });

        } catch (error) {
            console.error("Error toggling follow game:", error);
        }
    };

    const toggleFollowPlayer = async (targetUser) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        if (!targetUser || (!targetUser.uid && !targetUser.id)) return;

        const targetUid = targetUser.uid || targetUser.id;
        if (targetUid === currentUser.uid) return;

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            const targetRef = doc(db, 'users', targetUid);

            // Use functional update to avoid closures issues with stale state
            setFollowedPlayers(currentFollowed => {
                const isFollowing = currentFollowed.some(p => (p.uid || p.id) === targetUid);
                let newFollowedPlayers;

                if (isFollowing) {
                    // Unfollow
                    newFollowedPlayers = currentFollowed.filter(p => (p.uid || p.id) !== targetUid);
                } else {
                    // Follow
                    newFollowedPlayers = [...currentFollowed, {
                        uid: targetUid,
                        id: targetUid,
                        displayName: targetUser.displayName || targetUser.name || 'Unknown',
                        photoURL: targetUser.photoURL || targetUser.avatar || null,
                        username: targetUser.username || ''
                    }];
                }

                const newFollowedUids = newFollowedPlayers.map(p => p.uid || p.id);
                setFollowedUids(newFollowedUids);

                const currentSubscribedGamesCount = followedGames.length;
                const newFollowingCount = newFollowedPlayers.length + currentSubscribedGamesCount;
                setFollowingCount(newFollowingCount);

                // Start Firestore updates asynchronously via Centralized Service
                (async () => {
                    try {
                        await updateFollowingStatus(currentUser.uid, targetUid, !isFollowing, {
                            newFollowedPlayers: newFollowedPlayers,
                            newFollowedUids: newFollowedUids,
                            newCount: newFollowingCount
                        });

                        // CREATE NOTIFICATION (if following)
                        if (!isFollowing) {
                            await sendNotification({
                                recipientId: targetUid,
                                senderId: currentUser.uid,
                                type: 'follow',
                                title: t('notifications.newFollower'),
                                content: `${currentUser.displayName || 'Someone'} ${t('notifications.followedYou')}`,
                                time: 'Just now',
                                isUnread: true,
                                icon: 'person-add',
                                iconColor: '#FF4081'
                            });
                        }
                    } catch (err) {
                        console.error("toggleFollowPlayer: Service Error:", err);
                    }
                })();

                return newFollowedPlayers;
            });

        } catch (error) {
            console.error("Error toggling follow player:", error);
        }
    };



    const removeUserClip = async (videoId) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            // Find the video data first to get its title/URL for thorough cleanup
            const videoToDelete = userClips.find(c => c.id === videoId);
            const videoTitle = videoToDelete?.title;
            const videoUrl = videoToDelete?.videoUrl || videoToDelete?.cloudinaryUrl;

            // 1. Delete from Firestore via Service (includes ghost cleanup and likes)
            await deleteUserVideo(videoId, currentUser.uid, {
                title: videoTitle,
                url: videoUrl
            });

            // 2. Delete from SQLite
            await deleteVideoFromDB(videoId);

            // 3. Update local state
            setUserClips(prev => prev.filter(clip => clip.id !== videoId));

            // Decrement postsCount via Service
            const newPostsCount = Math.max(0, (postsCount || 0) - 1);
            setPostsCount(newPostsCount);
            await updateUserPostsCount(currentUser.uid, -1);

            return true;
        } catch (error) {
            console.error('Error removing video:', error);
            throw error;
        }
    };

    const updateUserGames = async (newGames, newRanks, newGameNames, newPlatforms) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        try {
            // Local update for immediate UI response
            setGames(newGames);
            setRanks(newRanks);
            setGameNames(newGameNames);
            if (newPlatforms) setPlatforms(newPlatforms);

            // Firestore update via Service
            await updateUserGamesAndRanks(currentUser.uid, {
                games: newGames,
                ranks: newRanks,
                gameNames: newGameNames,
                platforms: newPlatforms || platforms
            });
            return true;
        } catch (error) {
            console.error('Error updating profile games/ranks:', error);
            throw error;
        }
    };

    return (
        <UserContext.Provider value={{
            isOnline,
            setIsOnline: setOnlineStatus, // Overriding with the sync function
            username,
            setUsername,
            location,
            setLocation,
            bio,
            setBio,
            avatar,
            setAvatar,
            coverPhoto,
            setCoverPhoto,
            postsCount,
            followersCount,
            followingCount,
            userClips,
            games,
            gameNames,
            platforms,
            ranks,
            followedGames,
            followedPlayers,
            toggleFollowGame,
            toggleFollowPlayer,
            addUserClip,
            removeUserClip,
            updateUserGames
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}
