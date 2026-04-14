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

    function mint(address to, string memory tokenURI) external payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient mint price");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }

    function evolve(uint256 tokenId1, uint256 tokenId2, string memory newTokenURI) external returns (uint256) {
        require(ownerOf(tokenId1) == msg.sender, "Not owner of tokenId1");
        require(ownerOf(tokenId2) == msg.sender, "Not owner of tokenId2");
        _burn(tokenId1);
        _burn(tokenId2);
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, newTokenURI);
        return tokenId;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
}
