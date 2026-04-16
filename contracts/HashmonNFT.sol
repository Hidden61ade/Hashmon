// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract HashmonNFT is ERC721Enumerable, ERC721URIStorage {
    uint256 private _nextTokenId;
    uint256 public mintPrice = 0.02 ether;
    address public owner;

    constructor() ERC721("Hashmon", "HASHMON") {
        owner = msg.sender;
    }

    function mint(address to, string memory metadataURI) external payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient mint price");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        return tokenId;
    }

    function evolve(uint256 tokenId1, uint256 tokenId2, string memory newTokenURI) external returns (uint256) {
        require(ownerOf(tokenId1) == msg.sender, "Not owner of tokenId1");
        require(ownerOf(tokenId2) == msg.sender, "Not owner of tokenId2");
        _update(address(0), tokenId1, msg.sender);
        _update(address(0), tokenId2, msg.sender);
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, newTokenURI);
        return tokenId;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
}
