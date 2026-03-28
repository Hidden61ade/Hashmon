/**
 * BattleEngine.js
 * ──────────────────────────────────────────────────────────────
 * Pure-logic turn-based battle engine. Zero Phaser dependencies.
 * The BattleScene calls into this engine and receives event
 * objects describing what happened so it can animate them.
 * ──────────────────────────────────────────────────────────────
 */
import { getTypeEffectiveness } from '../data/HashmonData.js';

export class BattleEngine {
    /**
     * @param {Hashmon} playerMon - The player's Hashmon instance.
     * @param {Hashmon} enemyMon  - The enemy's Hashmon instance.
     */
    constructor(playerMon, enemyMon) {
        this.playerMon = playerMon;
        this.enemyMon = enemyMon;
        this.turnNumber = 0;
    }

    // ═══════════════════════════════════════════════════════════
    // TURN RESOLUTION
    // ═══════════════════════════════════════════════════════════

    /**
     * Resolve a full turn where both sides pick a move.
     * Returns an array of BattleEvent objects in execution order.
     *
     * @param {number} playerMoveIndex - Index (0-3) of the player's chosen move.
     * @returns {BattleEvent[]} Ordered list of events for the scene to animate.
     */
    resolveTurn(playerMoveIndex) {
        this.turnNumber++;
        const events = [];

        // Determine turn order by Speed stat
        const playerSpeed = this.playerMon.getStat('speed');
        const enemySpeed = this.enemyMon.getStat('speed');
        const playerFirst = playerSpeed >= enemySpeed; // Ties go to player

        // Enemy picks a move (simple AI: random from available)
        const enemyMoveIndex = this.pickEnemyMove();

        if (playerFirst) {
            events.push(...this.executeMove(this.playerMon, this.enemyMon, playerMoveIndex, 'player'));
            // Only let enemy act if still alive
            if (this.enemyMon.isAlive()) {
                events.push(...this.executeMove(this.enemyMon, this.playerMon, enemyMoveIndex, 'enemy'));
            }
        } else {
            events.push(...this.executeMove(this.enemyMon, this.playerMon, enemyMoveIndex, 'enemy'));
            if (this.playerMon.isAlive()) {
                events.push(...this.executeMove(this.playerMon, this.enemyMon, playerMoveIndex, 'player'));
            }
        }

        return events;
    }

    // ═══════════════════════════════════════════════════════════
    // MOVE EXECUTION
    // ═══════════════════════════════════════════════════════════

    /**
     * Execute a single move from attacker → defender.
     * @returns {BattleEvent[]}
     */
    executeMove(attacker, defender, moveIndex, side) {
        const events = [];
        const move = attacker.moves[moveIndex];

        // ── PP Check ──
        if (!attacker.canUseMove(moveIndex)) {
            events.push({
                type: 'no_pp',
                side,
                attackerName: attacker.name,
                moveName: move.name,
                message: `${attacker.name} has no PP left for ${move.name}!`,
            });
            return events;
        }

        // Consume PP
        attacker.usePP(moveIndex);

        // Announce move
        events.push({
            type: 'use_move',
            side,
            attackerName: attacker.name,
            moveName: move.name,
            message: `${attacker.name} used ${move.name}!`,
        });

        // ── Accuracy Check ──
        if (Math.random() * 100 >= move.accuracy) {
            events.push({
                type: 'miss',
                side,
                attackerName: attacker.name,
                message: `${attacker.name}'s attack missed!`,
            });
            return events;
        }

        // ── Status Move ──
        if (move.category === 'Status') {
            return events.concat(this.resolveStatusMove(attacker, defender, move, side));
        }

        // ── Damaging Move ──
        return events.concat(this.resolveDamagingMove(attacker, defender, move, side));
    }

    // ═══════════════════════════════════════════════════════════
    // DAMAGE FORMULA (Gen-V style)
    // ═══════════════════════════════════════════════════════════

    resolveDamagingMove(attacker, defender, move, side) {
        const events = [];

        // Pick the right stats based on move category
        const atkStat = move.category === 'Physical'
            ? attacker.getStat('atk')
            : attacker.getStat('spAtk');
        const defStat = move.category === 'Physical'
            ? defender.getStat('def')
            : defender.getStat('spDef');

        // STAB (Same-Type Attack Bonus) — 1.5× if move type matches user type
        const stab = (move.type === attacker.type) ? 1.5 : 1.0;

        // Type effectiveness
        const effectiveness = getTypeEffectiveness(move.type, defender.type);

        // Random factor (0.85 – 1.0)
        const randomFactor = 0.85 + Math.random() * 0.15;

        // Critical hit (6.25% chance, 1.5× multiplier)
        const isCrit = Math.random() < 0.0625;
        const critMultiplier = isCrit ? 1.5 : 1.0;

        // ── Core damage formula ──
        const levelFactor = (2 * attacker.level / 5) + 2;
        const baseDamage = ((levelFactor * move.power * (atkStat / defStat)) / 50) + 2;
        const finalDamage = Math.max(1, Math.floor(
            baseDamage * stab * effectiveness * randomFactor * critMultiplier
        ));

        // Apply damage
        const actualDamage = defender.takeDamage(finalDamage);

        events.push({
            type: 'damage',
            side,
            damage: actualDamage,
            effectiveness,
            isCrit,
            defenderName: defender.name,
            defenderHp: defender.currentHp,
            defenderMaxHp: defender.maxHp,
        });

        // Effectiveness message
        if (effectiveness > 1) {
            events.push({ type: 'log', message: "It's super effective!" });
        } else if (effectiveness < 1) {
            events.push({ type: 'log', message: "It's not very effective..." });
        }

        // Critical hit message
        if (isCrit) {
            events.push({ type: 'log', message: 'A critical hit!' });
        }

        // Faint check
        if (!defender.isAlive()) {
            events.push({
                type: 'faint',
                side: side === 'player' ? 'enemy' : 'player',
                name: defender.name,
                message: `${defender.name} fainted!`,
            });
        }

        // Some damaging moves also have stat-change side effects (e.g. Flame Charge)
        if (move.statChange) {
            events.push(...this.applyStatChange(attacker, defender, move.statChange, side));
        }

        return events;
    }

    // ═══════════════════════════════════════════════════════════
    // STATUS MOVE RESOLUTION
    // ═══════════════════════════════════════════════════════════

    resolveStatusMove(attacker, defender, move, side) {
        if (!move.statChange) return [];
        return this.applyStatChange(attacker, defender, move.statChange, side);
    }

    applyStatChange(attacker, defender, statChange, side) {
        const events = [];
        const target = statChange.target === 'self' ? attacker : defender;
        const actualChange = target.changeStatStage(statChange.stat, statChange.stages);

        const statNames = {
            atk: 'Attack', def: 'Defense', spAtk: 'Sp. Atk',
            spDef: 'Sp. Def', speed: 'Speed',
        };
        const statLabel = statNames[statChange.stat] || statChange.stat;

        let verb;
        if (actualChange > 0) verb = actualChange >= 2 ? 'rose sharply!' : 'rose!';
        else if (actualChange < 0) verb = actualChange <= -2 ? 'fell sharply!' : 'fell!';
        else verb = "can't go any higher!" ;

        if (actualChange === 0 && statChange.stages < 0) verb = "can't go any lower!";

        events.push({
            type: 'stat_change',
            side,
            targetName: target.name,
            stat: statChange.stat,
            stages: actualChange,
            message: `${target.name}'s ${statLabel} ${verb}`,
        });

        return events;
    }

    // ═══════════════════════════════════════════════════════════
    // ENEMY AI
    // ═══════════════════════════════════════════════════════════

    /**
     * Simple AI: pick a random move that still has PP.
     * Falls back to move 0 (will trigger no_pp event if depleted).
     */
    pickEnemyMove() {
        const available = [];
        this.enemyMon.moves.forEach((m, i) => {
            if (m.currentPP > 0) available.push(i);
        });
        if (available.length === 0) return 0;
        return available[Math.floor(Math.random() * available.length)];
    }

    // ═══════════════════════════════════════════════════════════
    // STATE QUERIES
    // ═══════════════════════════════════════════════════════════

    isBattleOver() {
        return !this.playerMon.isAlive() || !this.enemyMon.isAlive();
    }

    didPlayerWin() {
        return this.playerMon.isAlive() && !this.enemyMon.isAlive();
    }
}
