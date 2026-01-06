export const PLATFORMS = [
    { id: 'pc', name: 'PC', icon: 'desktop-outline', color: '#6366F1' },
    { id: 'ps5', name: 'PS5', icon: 'logo-playstation', color: '#003791' },
    { id: 'xbox', name: 'Xbox', icon: 'logo-xbox', color: '#107C10' },
    { id: 'switch', name: 'Switch', icon: 'game-controller-outline', color: '#E60012' },
    { id: 'mobile', name: 'Mobile', icon: 'phone-portrait-outline', color: '#10B981' },
];

export const GAMES = [
    { id: 'val', name: 'Valorant', genre: 'FPS', color: '#FF4655' },
    { id: 'lol', name: 'League of Legends', genre: 'MOBA', color: '#C89B3C' },
    { id: 'cod', name: 'Call of Duty', genre: 'FPS', color: '#FFFFFF' },
    { id: 'fort', name: 'Fortnite', genre: 'Battle Royale', color: '#F7ED3E' },
    { id: 'cs', name: 'CS:GO 2', genre: 'FPS', color: '#DE9B35' },
    { id: 'apex', name: 'Apex Legends', genre: 'Battle Royale', color: '#A52222' },
    { id: 'wow', name: 'World of Warcraft', genre: 'MMORPG', color: '#FFB100' },
    { id: 'mc', name: 'Minecraft', genre: 'Sandbox', color: '#2E8B57' },
];

export const PREMIUM_COLORS = [
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#8B5CF6', // Violet
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#ef4444', // Red
    '#06B6D4', // Cyan
    '#84cc16', // Lime
];

export const getGameColor = (gameId, gameName) => {
    // 1. Check if game is in our predefined list
    const predefinedGame = GAMES.find(g => g.id === gameId || g.name === gameName);
    if (predefinedGame && predefinedGame.color) {
        return predefinedGame.color;
    }

    // 2. Deterministic selection from PREMIUM_COLORS
    const seed = (gameId || gameName || '').toString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % PREMIUM_COLORS.length;
    return PREMIUM_COLORS[index];
};
