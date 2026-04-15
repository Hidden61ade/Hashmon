import { SPECIES } from './HashmonData.js';

export const COMPANION_SCHEMA_VERSION = 'hashmon-companion/v1';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function normalizeTokenId(tokenId) {
    return String(tokenId ?? '').replace('#', '').padStart(4, '0');
}

export function defaultCompanionState() {
    return {
        battles: 0,
        wins: 0,
        gardenInteractions: 0,
        happiness: 50,
        expFromGarden: 0,
        coinsFound: 0,
    };
}

function deriveNormalizedStats(nft, species) {
    if (nft?.normalizedStats) {
        return { ...species.baseNormalizedStats, ...nft.normalizedStats };
    }

    if (nft?.stats) {
        return {
            strength: clamp((nft.stats.atk ?? species.baseStats.atk) / 100, 0, 1),
            vitality: clamp((nft.stats.hp ?? species.baseStats.hp) / 100, 0, 1),
            agility: clamp((nft.stats.speed ?? species.baseStats.speed) / 100, 0, 1),
            dexterity: clamp((nft.stats.def ?? species.baseStats.def) / 100, 0, 1),
            intelligence: clamp((nft.stats.spAtk ?? species.baseStats.spAtk) / 100, 0, 1),
        };
    }

    return { ...species.baseNormalizedStats };
}

export function buildPortableCompanionProfile(nft) {
    if (!nft) return null;

    const species = SPECIES[nft.speciesKey] || SPECIES.WaterRat;
    const normalizedStats = deriveNormalizedStats(nft, species);
    const battleStats = { ...species.baseStats, ...(nft.stats || {}) };
    const state = { ...defaultCompanionState(), ...(nft.companionState || {}) };
    const tokenId = `#${normalizeTokenId(nft.tokenId)}`;

    return {
        schema: COMPANION_SCHEMA_VERSION,
        tokenId,
        identity: {
            nickname: nft.nickname || species.name,
            speciesKey: nft.speciesKey,
            type: nft.type || species.type,
            level: nft.level || 10,
        },
        source: {
            mintedBy: nft.mintedBy || 'Unknown',
            isOriginalMinter: Boolean(nft.isOriginalMinter),
            image: nft.image || '',
        },
        appearance: {
            textureKey: nft.customTextureKey || species.textureKey,
        },
        stats: {
            normalized: normalizedStats,
            battle: battleStats,
        },
        moves: Array.isArray(nft.moves) && nft.moves.length ? [...nft.moves] : [...species.moveKeys],
        state,
        adapters: {
            battle: {
                hp: battleStats.hp,
                atk: battleStats.atk,
                speed: battleStats.speed,
                preBattleBoost: Math.min(12, Math.floor(state.expFromGarden / 10) + Math.floor(state.happiness / 25)),
            },
            garden: {
                roamingSpeed: Math.round(50 + normalizedStats.agility * 200),
                friendliness: state.happiness,
                curiosity: Math.round(20 + normalizedStats.intelligence * 80),
            },
        },
    };
}
