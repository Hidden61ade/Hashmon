# Hashmon Presentation Script

## Cover
Hello everyone. I am Baohua Fang, student number 123090108. Today I will present Hashmon, a user-generated, cross-game digital companion ecosystem.

## Outline
In this presentation, I will cover four parts: first, the motivation and the problem that led to this project; second, the system design and workflow; third, the working prototype with evidence; and finally, the evaluation and conclusion.

## Section — Motivation & Problem

## Personal Motivation
This idea came from a personal feeling. When I played Pokémon, I became attached to my Eevee as if it were a real companion. I spent time with it, I watched it grow, and it felt like something that truly belonged to me. But once that game ended, I could not bring it anywhere else. There was no way to export it, no way to continue the adventure. That sense of loss is exactly what inspired Hashmon.

## The Problem: Companions Are Platform-Locked
And this feeling is not mine alone. More broadly, many players share the same frustration. They invest time, emotion, and creativity into digital companions, but traditional games lock those companions inside closed platforms. Ownership is an illusion, portability does not exist, and when the server shuts down, everything disappears. There is a clear gap: no lightweight framework currently lets players truly own and reuse their companions across different game contexts.

## Research Question & Contributions
So this leads to my research question: can a single NFT-based companion maintain meaningful identity and utility across multiple independent game scenes? To answer this, Hashmon makes four contributions. First, an end-to-end prototype that connects browser gameplay with on-chain ownership through ERC-721. Second, cross-scene reuse, where one NFT drives battle, garden, and marketplace contexts. Third, a decentralised asset pipeline using IPFS for metadata and artwork storage. And fourth, an in-game marketplace that enables peer-to-peer companion trading on Sepolia testnet.

## Section — System Design

## System Architecture
Now let me walk you through how the system is built. At the top, you can see the logos of the key technologies. Phaser 3 powers the game client, MetaMask and Ethers.js handle wallet interactions, the smart contracts live on Sepolia, and IPFS stores the metadata and artwork. Below the logos, the layered diagram shows how these components connect. The presentation layer talks to the integration layer, which communicates with the blockchain layer, and the storage layer sits at the bottom holding all the persistent data. Each layer has a clear responsibility, and they communicate through well-defined interfaces.

## Workflow: From Creation to Reuse
With this architecture in place, the user flow becomes straightforward. The player first designs a Hashmon, then uploads the metadata to IPFS, mints it as an ERC-721 token, and syncs it to their wallet. From there, the same companion fans out into three different game scenes: battle, garden, and marketplace. The key property here is that a single NFT companion is created once, owned cryptographically, and reused across all game scenes without duplication.

## Section — Prototype Evidence

## Evidence: Create & Mint
Now let me show you that this actually works. On the left, you can see the custom companion designer where the player creates their pixel-art Hashmon. On the right, after minting, the companion immediately appears in the wallet-synced NFT inventory. The entire flow from creation to on-chain ownership happens in real time.

## Evidence: Cross-Scene Interoperability
If the project stopped there, it would be just another Web3 game demo. But here is the key part. The same NFT companion appears in both the battle scene and the garden scene. Its identity is preserved, but each scene interprets the same Hashmon differently. In the battle scene, the stats affect combat performance. In the garden scene, they influence mood and interaction. This demonstrates what I call controlled interoperability: one asset, multiple meaningful contexts.

## Evidence: Marketplace & Ownership Loop
Beyond gameplay, Hashmon also supports an economic loop. Users can list their companions for sale, browse all listed assets, and purchase through MetaMask. The ownership transfer happens entirely on-chain. This means companions gain real economic value beyond just gameplay utility.

## Section — Evaluation & Conclusion

## Results & Current Limitations
Let me be honest about both what works and what still needs improvement. The prototype successfully demonstrates wallet-based authentication, on-chain NFT minting, IPFS-hosted metadata, cross-scene companion reuse, and a peer-to-peer marketplace. On the other hand, it still needs multi-chain support, deeper gameplay mechanics, wider standard adoption, better game balancing, and more UI polish. But importantly, these limitations are about engineering scope, not architectural feasibility. The core design holds.

## Future Work
Looking ahead, there are four directions I would like to explore. First, extending to Layer 2 chains like Polygon or Arbitrum for lower transaction costs. Second, integrating richer gameplay features like evolution and breeding. Third, proposing an open companion metadata standard as an EIP draft. And fourth, transitioning marketplace governance to a DAO structure for community ownership.

## References
These references support both the blockchain standards and the game development tools used in the project.

## Closing
To conclude, Hashmon demonstrates that a player-created companion can become a persistent digital asset with verifiable ownership and controlled reuse across multiple gameplay contexts. Thank you very much for listening. I am happy to take any questions. At the end of the presentation, I will play the demonstration video of Hashmon.
