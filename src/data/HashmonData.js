/**
 * HashmonData.js
 * ──────────────────────────────────────────────────────────────
 * Central game-data registry: type chart, move database, and
 * species definitions for every Hashmon in the game.
 * ──────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════
// TYPE EFFECTIVENESS TABLE
// ═══════════════════════════════════════════════════════════════
// Maps attackingType → { defendingType: multiplier }
// Missing entries default to 1.0× (neutral).
export const TYPE_CHART = {
    Water: { Fire: 2.0, Water: 0.5, Grass: 0.5 },
    Fire:  { Water: 0.5, Fire: 0.5, Grass: 2.0 },
    Grass: { Water: 2.0, Fire: 0.5, Grass: 0.5 },
    Normal: {},   // Normal is neutral against everything
    Dark:  {},    // Placeholder for future expansion
};

/**
 * Look up the type effectiveness multiplier.
 * @param {string} atkType  - The type of the attacking move.
 * @param {string} defType  - The type of the defending Hashmon.
 * @returns {number} 0.5, 1.0, or 2.0
 */
export function getTypeEffectiveness(atkType, defType) {
    if (TYPE_CHART[atkType] && TYPE_CHART[atkType][defType] !== undefined) {
        return TYPE_CHART[atkType][defType];
    }
    return 1.0; // Neutral
}


// ═══════════════════════════════════════════════════════════════
// MOVE DATABASE
// ═══════════════════════════════════════════════════════════════
// category: 'Physical' uses atk/def, 'Special' uses spAtk/spDef,
//           'Status' applies a stat-stage change instead of damage.
// For Status moves: `statChange` = { target, stat, stages }
//   target: 'self' | 'enemy'
//   stat:   'atk' | 'def' | 'spAtk' | 'spDef' | 'speed'
//   stages: number of stages to raise (+) or lower (-)
export const MOVES = {
    // ── Water-type Moves ──
    splash: {
        name: 'Splash',
        type: 'Water',
        category: 'Special',
        power: 50,
        accuracy: 100,
        pp: 15,
        description: 'A burst of pressurised water.',
    },
    aquaJet: {
        name: 'Aqua Jet',
        type: 'Water',
        category: 'Physical',
        power: 40,
        accuracy: 100,
        pp: 20,
        description: 'Strikes at blinding speed.',
    },
    waterPulse: {
        name: 'Water Pulse',
        type: 'Water',
        category: 'Special',
        power: 65,
        accuracy: 95,
        pp: 10,
        description: 'An ultrasonic wave of water.',
    },

    // ── Normal-type Moves ──
    tackle: {
        name: 'Tackle',
        type: 'Normal',
        category: 'Physical',
        power: 40,
        accuracy: 100,
        pp: 35,
        description: 'A full-body charge attack.',
    },
    bite: {
        name: 'Bite',
        type: 'Dark',
        category: 'Physical',
        power: 60,
        accuracy: 100,
        pp: 15,
        description: 'Bites with sharp fangs.',
    },
    defend: {
        name: 'Defend',
        type: 'Normal',
        category: 'Status',
        power: 0,
        accuracy: 100,
        pp: 20,
        description: 'Hardens body, raising Defense.',
        statChange: { target: 'self', stat: 'def', stages: 1 },
    },

    // ── Fire-type Moves ──
    ember: {
        name: 'Ember',
        type: 'Fire',
        category: 'Special',
        power: 40,
        accuracy: 100,
        pp: 25,
        description: 'A small flame attack.',
    },
    flameCharge: {
        name: 'Flame Charge',
        type: 'Fire',
        category: 'Physical',
        power: 50,
        accuracy: 100,
        pp: 20,
        description: 'A fiery tackle that also raises Speed.',
        statChange: { target: 'self', stat: 'speed', stages: 1 },
    },
    fireFang: {
        name: 'Fire Fang',
        type: 'Fire',
        category: 'Physical',
        power: 65,
        accuracy: 95,
        pp: 10,
        description: 'Bites with flame-coated fangs.',
    },
    dragonBreath: {
        name: 'Dragon Breath',
        type: 'Fire',
        category: 'Special',
        power: 60,
        accuracy: 100,
        pp: 15,
        description: 'An infernal breath attack.',
    },
    intimidate: {
        name: 'Intimidate',
        type: 'Normal',
        category: 'Status',
        power: 0,
        accuracy: 100,
        pp: 15,
        description: 'Lowers the foe\'s Attack.',
        statChange: { target: 'enemy', stat: 'atk', stages: -1 },
    },
};


// ═══════════════════════════════════════════════════════════════
// SPECIES DEFINITIONS
// ═══════════════════════════════════════════════════════════════
// Base stats are comparable to Pokémon's 200-600 BST range
// but scaled to fit our small roster. Level formula will scale
// them at runtime.
export const SPECIES = {
    WaterRat: {
        name: 'WaterRat',
        type: 'Water',
        textureKey: 'water_rat',
        baseStats: {
            hp: 55,
            atk: 48,
            def: 45,
            spAtk: 62,
            spDef: 50,
            speed: 58,
        },
        baseNormalizedStats: {
            strength: 0.48, // maps to atk
            vitality: 0.55, // maps to hp
            agility: 0.58,  // maps to speed and movespeed in garden
            dexterity: 0.45, // maps to def
            intelligence: 0.62 // maps to spAtk
        },
        // The 4 moves this species knows
        moveKeys: ['splash', 'aquaJet', 'bite', 'defend'],
    },

    FireDragon: {
        name: 'FireDragon',
        type: 'Fire',
        textureKey: 'fire_dragon',
        baseStats: {
            hp: 60,
            atk: 65,
            def: 50,
            spAtk: 70,
            spDef: 50,
            speed: 55,
        },
        baseNormalizedStats: {
            strength: 0.65,
            vitality: 0.60,
            agility: 0.55,
            dexterity: 0.50,
            intelligence: 0.70
        },
        moveKeys: ['ember', 'fireFang', 'dragonBreath', 'intimidate'],
    },
};
