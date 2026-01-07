import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { db, getUserPublicData, fetchDiscoveryUids, fetchVideosByUsers, deleteUserVideo } from '../services/firestore';
import { auth } from '../services/firebase';
import { useUser } from './UserContext';

const FeedContext = createContext();

export function FeedProvider({ children, userId = null }) {
    const { followedPlayers, userClips, username, avatar } = useUser();
    const [feedItems, setFeedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchFeed = useCallback(async (isRefreshing = false) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            // 1. Collect all UIDs we care about
            let finalQueryUids = [];

            if (userId) {
                // Specific user profile feed
                finalQueryUids = [userId];
            } else {
                // General social feed
                const followUids = followedPlayers.map(p => p.uid || p.id);
                const allTargetUids = [currentUser.uid, ...followUids];

                // 2. Multi-level Discovery (Friend of Friend) via Service
                const discoveryFocus = followUids.slice(0, 10);
                const uniqueFofUids = await fetchDiscoveryUids(discoveryFocus);

                const filteredFofUids = uniqueFofUids.filter(uid => !allTargetUids.includes(uid));
                finalQueryUids = [...allTargetUids, ...filteredFofUids].slice(0, 30);
            }

            if (finalQueryUids.length === 0) {
                setFeedItems([]);
                return;
            }

            // 4. Query Videos via Service
            const videos = await fetchVideosByUsers(finalQueryUids, 50);

            // 5. Enhance with User Data
            const enhancedFeed = await Promise.all(videos.map(async (video) => {
                if (video.userId === currentUser.uid) {
                    return { ...video, streamer: username, avatar: avatar, type: 'self' };
                }

                // Check if direct follow
                const followData = followedPlayers.find(p => (p.uid || p.id) === video.userId);
                if (followData) {
                    return {
                        ...video,
                        streamer: followData.displayName || followData.username || 'Gamer',
                        avatar: followData.photoURL || followData.avatar || null,
                        type: 'follow'
                    };
                }

                // FoF/Discovery - fetch user info via Service
                const userData = await getUserPublicData(video.userId);
                if (userData) {
                    return {
                        ...video,
                        streamer: userData.displayName,
                        avatar: userData.photoURL,
                        type: 'fof'
                    };
                }

                return { ...video, streamer: 'Gamer', type: 'unknown' };
            }));

            // 6. DE-DUPLICATION (Self-Healing)
            const deDuplicated = [];
            const seenKeys = new Set();

            // Sort by createdAt desc
            const sortedFeed = [...enhancedFeed].sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return dateB - dateA;
            });

            for (const item of sortedFeed) {
                const dedupeKey = `${item.title}_${item.userId}`;
                const isDuplicate = seenKeys.has(dedupeKey);

                if (!isDuplicate) {
                    seenKeys.add(dedupeKey);
                    deDuplicated.push(item);
                } else {
                    // Background cleanup if it's our own video
                    if (item.userId === currentUser.uid) {
                        deleteUserVideo(item.id, currentUser.uid).catch(err =>
                            console.warn(`[FeedContext] Cleanup failed for ${item.id}:`, err)
                        );
                    }
                }
            }

            setFeedItems(deDuplicated);
        } catch (error) {
            console.error("Error fetching feed:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [followedPlayers, username, avatar, userId]);

    // Initial load and sync when follows/clips change
    useEffect(() => {
        fetchFeed();
    }, [followedPlayers.length, userClips.length, userId]);

    return (
        <FeedContext.Provider value={{
            feedItems,
            loading,
            refreshing,
            refreshFeed: () => fetchFeed(true),
            fetchFeed
        }}>
            {children}
        </FeedContext.Provider>
    );
}

export function useFeed() {
    return useContext(FeedContext);
}
