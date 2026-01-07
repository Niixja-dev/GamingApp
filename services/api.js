// RAWG API Service - External game data API
// Documentation: https://api.rawg.io/docs/

const RAWG_API_KEY = 'c691b064e6df4824ac386a504445bae7'; // Get your free API key from https://rawg.io/apidocs
const RAWG_BASE_URL = 'https://api.rawg.io/api';

/**
 * Fetch games by genre
 * @param {string} genre - Genre name (e.g., 'action', 'shooter', 'rpg')
 * @param {number} pageSize - Number of games to fetch (default: 6)
 * @returns {Promise<Array>} Array of game objects
 */
export const fetchGamesByGenre = async (genre, pageSize = 6) => {
    try {
        const cacheKey = `genre_${genre.toLowerCase()}`;

        // 1. Try Cache
        const cached = await getCachedGames(cacheKey);
        if (cached.length > 0) {
            console.log(`Serving ${genre} Games from SQLite Cache`);
            return cached.map(g => ({ ...g, title: g.title.toUpperCase() }));
        }

        const response = await fetch(
            `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&genres=${genre.toLowerCase()}&page_size=${pageSize}&ordering=-metacritic,-added&metacritic=70,100`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const transformed = data.results.map(game => ({
            id: game.id,
            title: game.name,
            image: game.background_image,
            genres: game.genres.map(g => g.name).join(' - '),
            description: game.description_raw || game.description || 'No description available.',
            rating: game.rating,
            released: game.released,
            platforms: game.platforms?.map(p => p.platform.name) || [],
        }));

        // 2. Save Cache
        await cacheGames(transformed, cacheKey);

        return transformed.map(g => ({ ...g, title: g.title.toUpperCase() }));
    } catch (error) {
        console.error('Error fetching games by genre:', error);
        return [];
    }
};

/**
 * Fetch game details by ID
 * @param {number} gameId - RAWG game ID
 * @returns {Promise<Object>} Game details object
 */
export const fetchGameDetails = async (gameId) => {
    try {
        const response = await fetch(
            `${RAWG_BASE_URL}/games/${gameId}?key=${RAWG_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const game = await response.json();

        return {
            id: game.id,
            title: game.name.toUpperCase(),
            image: game.background_image,
            backgroundImage: game.background_image_additional || game.background_image,
            genres: game.genres.map(g => g.name).join(' - '),
            description: game.description_raw || 'No description available.',
            rating: game.rating,
            released: game.released,
            platforms: game.platforms?.map(p => p.platform.name) || [],
            developers: game.developers?.map(d => d.name) || [],
            publishers: game.publishers?.map(p => p.name) || [],
            website: game.website,
            metacritic: game.metacritic,
        };
    } catch (error) {
        console.error('Error fetching game details:', error);
        return null;
    }
};

/**
 * Search games by name
 * @param {string} query - Search query
 * @param {number} pageSize - Number of results (default: 10)
 * @returns {Promise<Array>} Array of game objects
 */
export const searchGames = async (query, pageSize = 10) => {
    try {
        const response = await fetch(
            `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=${pageSize}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return data.results.map(game => ({
            id: game.id,
            title: game.name.toUpperCase(),
            image: game.background_image,
            genres: game.genres.map(g => g.name).join(' - '),
            description: game.description_raw || game.description || 'No description available.',
            rating: game.rating,
        }));
    } catch (error) {
        console.error('Error searching games:', error);
        return [];
    }
};

import { cacheGames, getCachedGames } from './database';

/**
 * Fetch trending games (top-rated recent games)
 * @param {number} pageSize - Number of games to fetch (default: 10)
 * @returns {Promise<Array>} Array of game objects
 */
export const fetchTrendingGames = async (pageSize = 10) => {
    try {
        // 1. Try to get from SQLite Cache first
        const cached = await getCachedGames('trending');
        if (cached.length > 0) {
            console.log('Serving Trending Games from SQLite Cache');
            // Background update (optional): fetch new data but return cached for now
            // For now, just return cached.
            return cached;
        }

        const currentDate = new Date();
        const pastDate = new Date(currentDate.setMonth(currentDate.getMonth() - 6));
        const dateString = pastDate.toISOString().split('T')[0];

        const response = await fetch(
            `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&dates=${dateString},${new Date().toISOString().split('T')[0]}&ordering=-added&page_size=${pageSize}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const transformed = data.results.map(game => ({
            id: game.id,
            title: game.name, // Keep original case for DB, UI can uppercase
            image: game.background_image,
            genres: game.genres.map(g => g.name).join(' - '),
            description: game.description_raw || game.description || 'No description available.',
            rating: game.rating,
            released: game.released,
        }));

        // 2. Save to SQLite Cache
        await cacheGames(transformed, 'trending');

        return transformed.map(g => ({ ...g, title: g.title.toUpperCase() }));
    } catch (error) {
        console.error('Error fetching trending games:', error);
        // 3. Fallback to cache on error correctly handled by initial check
        return [];
    }
};

/**
 * Get game screenshots
 * @param {number} gameId - RAWG game ID
 * @returns {Promise<Array>} Array of screenshot URLs
 */
export const fetchGameScreenshots = async (gameId) => {
    try {
        const response = await fetch(
            `${RAWG_BASE_URL}/games/${gameId}/screenshots?key=${RAWG_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.results.map(screenshot => screenshot.image);
    } catch (error) {
        console.error('Error fetching game screenshots:', error);
        return [];
    }
};

// Genre mapping for RAWG API
export const GENRE_MAP = {
    'Action': 'action',
    'Shooter': 'shooter',
    'MOBA': 'massively-multiplayer',
    'RPG': 'role-playing-games-rpg',
    'Racing': 'racing',
};
