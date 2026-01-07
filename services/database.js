import * as SQLite from 'expo-sqlite';

let db = null;

/**
 * Initialize the SQLite database and create necessary tables
 */
export const initDatabase = async () => {
    try {
        db = await SQLite.openDatabaseAsync('gamingapp.db');

        // Create Games Cache Table
        // Migration: If the table exists but 'id' is the only PK, we drop and recreate
        const tableInfo = await db.getAllAsync("PRAGMA table_info(games_cache)");
        const isOldSchema = tableInfo.length > 0 && tableInfo.filter(c => c.pk > 0).length === 1;

        if (isOldSchema) {
            console.log('Migrating games_cache table to composite primary key...');
            await db.execAsync('DROP TABLE games_cache');
        }

        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS games_cache (
                id INTEGER,
                title TEXT,
                image TEXT,
                genres TEXT,
                rating REAL,
                released TEXT,
                category TEXT,
                cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id, category)
            );
        `);

        // Create Favorites Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY,
                title TEXT,
                image TEXT,
                rating REAL,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create Local Settings Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS local_settings (
                key TEXT PRIMARY KEY,
                value TEXT
            );
        `);

        // Create User Videos Table
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS user_videos (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                cloudinary_url TEXT,
                thumbnail_url TEXT,
                title TEXT,
                views INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('SQLite Database Initialized Successfully');
        return true;
    } catch (error) {
        console.error('SQLite Initialization Error:', error);
        return false;
    }
};

/**
 * Cache a list of games
 */
export const cacheGames = async (games, category) => {
    if (!db || !category) return;
    try {
        const safeCategory = String(category);
        // Delete old cache for this category
        await db.runAsync('DELETE FROM games_cache WHERE category = ?', [safeCategory]);

        for (const game of games) {
            // Defensive: ensure values are not null/undefined to prevent NPE in native bridge
            if (!game || game.id === null || game.id === undefined) continue;

            // Ensure we have numeric and defined values for native layer
            const id = parseInt(game.id, 10);
            if (isNaN(id)) continue; // Skip if ID is not a valid number

            const title = String(game.title || 'Untitled');
            const image = String(game.image || '');
            const genres = String(game.genres || '');
            const rating = parseFloat(game.rating) || 0;
            const released = String(game.released || '');

            // Use runAsync with explicit values, ensuring none are null or undefined
            await db.runAsync(
                'INSERT OR REPLACE INTO games_cache (id, title, image, genres, rating, released, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [id, title, image, genres, rating, released, safeCategory]
            );
        }
    } catch (error) {
        console.error('Error caching games:', error);
    }
};

/**
 * Get cached games for a category
 */
export const getCachedGames = async (category) => {
    if (!db || !category) return [];
    try {
        const safeCategory = String(category);
        const results = await db.getAllAsync('SELECT * FROM games_cache WHERE category = ? ORDER BY id', [safeCategory]);
        return results.map(row => ({
            ...row,
            title: row.title // UI expects uppercase usually, but we store what we get
        }));
    } catch (error) {
        console.error('Error getting cached games:', error);
        return [];
    }
};

/**
 * Favorites Management
 */
export const toggleFavorite = async (game) => {
    if (!db || !game || !game.id) return;
    try {
        const id = parseInt(game.id, 10);
        if (isNaN(id)) return;

        const existing = await db.getFirstAsync('SELECT id FROM favorites WHERE id = ?', [id]);
        if (existing) {
            await db.runAsync('DELETE FROM favorites WHERE id = ?', [id]);
            return false; // Removed
        } else {
            await db.runAsync(
                'INSERT INTO favorites (id, title, image, rating) VALUES (?, ?, ?, ?)',
                [id, String(game.title || 'Untitled'), String(game.image || ''), parseFloat(game.rating) || 0]
            );
            return true; // Added
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        return false;
    }
};

export const getFavorites = async () => {
    if (!db) return [];
    try {
        return await db.getAllAsync('SELECT * FROM favorites ORDER BY added_at DESC');
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return [];
    }
};

/**
 * Video Management
 */
export const saveVideo = async (video) => {
    if (!db || !video || !video.id) return;
    try {
        await db.runAsync(
            'INSERT OR REPLACE INTO user_videos (id, user_id, cloudinary_url, thumbnail_url, title, views) VALUES (?, ?, ?, ?, ?, ?)',
            [
                String(video.id),
                String(video.userId || ''),
                String(video.cloudinaryUrl || ''),
                String(video.thumbnailUrl || ''),
                String(video.title || 'Untitled'),
                parseInt(video.views, 10) || 0
            ]
        );
    } catch (error) {
        console.error('Error saving video:', error);
    }
};

export const getUserVideos = async (userId) => {
    if (!db) return [];
    if (!userId) {
        console.warn('getUserVideos: userId is null or undefined');
        return [];
    }
    try {
        // Ensure table exists (defensive programming)
        return await db.getAllAsync('SELECT * FROM user_videos WHERE user_id = ? ORDER BY created_at DESC', [String(userId)]);
    } catch (error) {
        console.warn('Error fetching user videos (handled):', error);
        return [];
    }
};

export const deleteVideo = async (videoId) => {
    if (!db) return;
    try {
        await db.runAsync('DELETE FROM user_videos WHERE id = ?', [videoId]);
    } catch (error) {
        console.error('Error deleting video:', error);
    }
};
