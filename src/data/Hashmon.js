/**
 * Hashmon.js
 * ──────────────────────────────────────────────────────────────
 * Runtime class representing a single Hashmon instance in
 * battle or inventory. Tracks HP, PP, stat stages, level, etc.
 * ──────────────────────────────────────────────────────────────
 */
import { SPECIES, MOVES } from './HashmonData.js';

export class Hashmon {
    /**
     * @param {string} speciesKey - Key into SPECIES (e.g. 'WaterRat').
     * @param {number} level      - Level 1–100.
     */
    constructor(speciesKey, level = 5) {
        const species = SPECIES[speciesKey];
        if (!species) throw new Error(`Unknown species: ${speciesKey}`);

        this.speciesKey = speciesKey;
        this.name = species.name;
        this.type = species.type;
        this.textureKey = species.textureKey;
        this.level = level;
        this.baseStats = { ...species.baseStats };

        // ── Moves & PP ──
        // Each entry: { ...moveData, currentPP: number }
        this.moves = species.moveKeys.map(key => {
            const move = MOVES[key];
            if (!move) throw new Error(`Unknown move key: ${key}`);
            return { ...move, currentPP: move.pp };
        });

        // ── Stat Stages ── (range: -6 to +6)
        this.statStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, speed: 0 };

        // ── HP ──
        this.maxHp = this.calcMaxHp();
        this.currentHp = this.maxHp;
    }

    // ─────────────────── STAT CALCULATIONS ───────────────────

    /**
     * Pokémon-style HP formula:
     *   HP = floor((2 * base + 31) * level / 100) + level + 10
     * (We simplify by assuming IV=31, EV=0)
     */
    calcMaxHp() {
        const base = this.baseStats.hp;
        return Math.floor((2 * base + 31) * this.level / 100) + this.level + 10;
    }

    /**
     * Effective stat for ATK/DEF/SPATK/SPDEF/SPEED:
     *   stat = floor((2 * base + 31) * level / 100) + 5
     * Then apply stage multiplier.
     */
    getStat(statName) {
        const base = this.baseStats[statName];
        const raw = Math.floor((2 * base + 31) * this.level / 100) + 5;
        return Math.floor(raw * this.getStageMultiplier(statName));
    }

    /**
     * Stat stage multipliers follow Pokémon rules:
     *   +1 → 1.5×, +2 → 2.0×, ... +6 → 4.0×
     *   -1 → 0.67×, -2 → 0.5×, ... -6 → 0.25×
     */
    getStageMultiplier(statName) {
        const stage = this.statStages[statName] || 0;
        if (stage >= 0) return (2 + stage) / 2;
        return 2 / (2 - stage);
    }

    // ─────────────────── STAT STAGE CHANGES ──────────────────

    /**
     * Apply a stat stage change, clamped to [-6, +6].
     * @returns {number} The actual change applied.
     */
    changeStatStage(statName, stages) {
        const old = this.statStages[statName];
        this.statStages[statName] = Math.max(-6, Math.min(6, old + stages));
        return this.statStages[statName] - old;
    }

    // ─────────────────── MOVE / PP UTILITIES ─────────────────

    /** Can this move still be used? */
    canUseMove(moveIndex) {
        return this.moves[moveIndex] && this.moves[moveIndex].currentPP > 0;
    }

    /** Consume 1 PP. Returns false if already at 0. */
    usePP(moveIndex) {
        if (!this.canUseMove(moveIndex)) return false;
        this.moves[moveIndex].currentPP--;
        return true;
    }

    /** Does this Hashmon have any usable moves left? */
    hasAnyPP() {
        return this.moves.some(m => m.currentPP > 0);
    }

    // ─────────────────── HP UTILITIES ────────────────────────

    isAlive() {
        return this.currentHp > 0;
    }

    /**
     * Apply damage (clamped to 0).
     * @returns {number} Actual damage dealt.
     */
    takeDamage(amount) {
        const actual = Math.min(this.currentHp, Math.max(0, Math.floor(amount)));
        this.currentHp -= actual;
        return actual;
    }

    /** Heal (clamped to maxHp). */
    heal(amount) {
        this.currentHp = Math.min(this.maxHp, this.currentHp + Math.floor(amount));
    }

    // ─────────────────── BATTLE RESET ────────────────────────

    /** Reset HP, PP, and stat stages to pristine state. */
    resetForBattle() {
        this.currentHp = this.maxHp;
        this.statStages = { atk: 0, def: 0, spAtk: 0, spDef: 0, speed: 0 };
        this.moves.forEach(m => { m.currentPP = m.pp; });
    }
}
