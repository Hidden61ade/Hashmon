/**
 * PlayerProfile.js
 * ──────────────────────────────────────────────────────────────
 * Mock player profile / wallet state for the Web3 layer.
 * Stores wallet address, rank, battle record, and owned
 * Hashmon NFTs. All data is placeholder — your blockchain
 * partner will replace the mock data with on-chain state.
 * ──────────────────────────────────────────────────────────────
 */

import { buildPortableCompanionProfile, defaultCompanionState, normalizeTokenId } from './CompanionProtocol.js';

// ═══════════════════════════════════════════════════════════════
// RANK TIERS (ladder-style ranking based on ELO / win count)
// ═══════════════════════════════════════════════════════════════
export const RANKS = [
    { name: 'Bronze',     minElo: 0,    color: '#cd7f32' },
    { name: 'Silver',     minElo: 1000, color: '#c0c0c0' },
    { name: 'Gold',       minElo: 1400, color: '#ffd700' },
    { name: 'Platinum',   minElo: 1700, color: '#44dddd' },
    { name: 'Diamond',    minElo: 2000, color: '#aa88ff' },
    { name: 'Legendary',  minElo: 2500, color: '#ff4488' },
];

/**
 * Singleton-like player profile. In production this would
 * be hydrated from the smart contract / IPFS after wallet connect.
 */
export class PlayerProfile {
    constructor() {
        // ── Wallet ──
        this.walletConnected = false;
        this.walletAddress = null;

        // ── Profile ──
        this.username = 'Trainer';
        this.coins = 0;                // Garden coins
        this.elo = 1150;               // Starting rating
        this.wins = 12;
        this.losses = 5;
        this.totalBattles = 17;

        // ── Owned Hashmon NFTs ──
        // Each entry simulates an NFT with on-chain metadata
        this.ownedHashmon = [
            {
                tokenId: '#0001',
                speciesKey: 'WaterRat',
                nickname: 'Bubbles',
                level: 10,
                mintedBy: '0x7a3b...f91d',
                isOriginalMinter: true,
                normalizedStats: {
                    strength: 0.48,
                    vitality: 0.55,
                    agility: 0.58,
                    dexterity: 0.45,
                    intelligence: 0.62,
                },
                companionState: {
                    battles: 2,
                    wins: 1,
                    gardenInteractions: 3,
                    happiness: 61,
                    expFromGarden: 20,
                    coinsFound: 2,
                },
            },
            {
                tokenId: '#0042',
                speciesKey: 'FireDragon',
                nickname: 'Blaze',
                level: 8,
                mintedBy: '0x1c4e...a820',
                isOriginalMinter: false,
                normalizedStats: {
                    strength: 0.66,
                    vitality: 0.52,
                    agility: 0.49,
                    dexterity: 0.42,
                    intelligence: 0.57,
                },
                companionState: {
                    battles: 1,
                    wins: 1,
                    gardenInteractions: 1,
                    happiness: 54,
                    expFromGarden: 10,
                    coinsFound: 1,
                },
            },
        ];

        this.activeHashmonTokenId = this.ownedHashmon[0]?.tokenId || null;

        // ── Marketplace listings (mock) ──
        this.marketplaceListings = [
            {
                tokenId: '#0108',
                speciesKey: 'FireDragon',
                nickname: 'Inferno',
                level: 15,
                price: '0.05 ETH',
                seller: '0x9f2a...b301',
            },
            {
                tokenId: '#0077',
                speciesKey: 'WaterRat',
                nickname: 'Torrent',
                level: 12,
                price: '0.03 ETH',
                seller: '0xd84c...e712',
            },
            {
                tokenId: '#0210',
                speciesKey: 'FireDragon',
                nickname: 'Scorch',
                level: 20,
                price: '0.12 ETH',
                seller: '0x55ab...1fa3',
            },
        ];
    }

    // ─────────────────── RANK UTILITIES ───────────────────────

    getRank() {
        let rank = RANKS[0];
        for (const r of RANKS) {
            if (this.elo >= r.minElo) rank = r;
        }
        return rank;
    }

    getWinRate() {
        if (this.totalBattles === 0) return '0%';
        return (this.wins / this.totalBattles * 100).toFixed(1) + '%';
    }

    // ─────────────────── BATTLE RECORD ───────────────────────

    recordWin() {
        this.wins++;
        this.totalBattles++;
        this.elo += 25;
    }

    recordLoss() {
        this.losses++;
        this.totalBattles++;
        this.elo = Math.max(0, this.elo - 20);
    }

    ensureCompanionState(nft) {
        if (!nft) return defaultCompanionState();
        nft.companionState = { ...defaultCompanionState(), ...(nft.companionState || {}) };
        return nft.companionState;
    }

    setActiveHashmon(tokenId) {
        const normalized = `#${normalizeTokenId(tokenId)}`;
        const found = this.ownedHashmon.find((item) => `#${normalizeTokenId(item.tokenId)}` === normalized);
        if (!found) return false;
        this.activeHashmonTokenId = normalized;
        return true;
    }

    getActiveHashmon() {
        if (!this.ownedHashmon.length) return null;
        const normalized = this.activeHashmonTokenId ? `#${normalizeTokenId(this.activeHashmonTokenId)}` : null;
        const found = this.ownedHashmon.find((item) => `#${normalizeTokenId(item.tokenId)}` === normalized);
        if (found) return found;
        this.activeHashmonTokenId = this.ownedHashmon[0].tokenId;
        return this.ownedHashmon[0];
    }

    getPortableHashmon(tokenId) {
        const normalized = tokenId ? `#${normalizeTokenId(tokenId)}` : null;
        const nft = normalized
            ? this.ownedHashmon.find((item) => `#${normalizeTokenId(item.tokenId)}` === normalized)
            : this.getActiveHashmon();

        if (!nft) return null;
        this.ensureCompanionState(nft);
        return buildPortableCompanionProfile(nft);
    }

    getPortableActiveHashmon() {
        return this.getPortableHashmon(this.activeHashmonTokenId);
    }

    registerBattleOutcome(didWin) {
        const nft = this.getActiveHashmon();
        if (!nft) return;
        const state = this.ensureCompanionState(nft);
        state.battles += 1;
        if (didWin) state.wins += 1;
    }

    registerGardenInteraction(tokenId, outcome) {
        const normalized = `#${normalizeTokenId(tokenId)}`;
        const nft = this.ownedHashmon.find((item) => `#${normalizeTokenId(item.tokenId)}` === normalized);
        if (!nft) return;

        const state = this.ensureCompanionState(nft);
        state.gardenInteractions += 1;
        state.happiness = Math.min(100, state.happiness + 3);

        if (outcome === 'coin') state.coinsFound += 1;
        if (outcome === 'exp') state.expFromGarden += 10;
    }
}

// ── Global singleton instance ──
// Shared across scenes so wallet state persists between navigations.
export const playerProfile = new PlayerProfile();
