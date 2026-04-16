// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

interface IHashmonNFT {
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

contract HashmonMarketplace is ERC721Holder {
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Listing) public listings;
    address public nftContract;
    address public owner;

    event ItemListed(uint256 indexed tokenId, address seller, uint256 price);
    event ItemSold(uint256 indexed tokenId, address buyer, uint256 price);
    event ListingCancelled(uint256 indexed tokenId);

    constructor(address _nftContract) {
        nftContract = _nftContract;
        owner = msg.sender;
    }

    function listItem(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than 0");
        IHashmonNFT(nftContract).safeTransferFrom(msg.sender, address(this), tokenId);
        listings[tokenId] = Listing({seller: msg.sender, price: price, active: true});
        emit ItemListed(tokenId, msg.sender, price);
    }

    function buyItem(uint256 tokenId) external payable {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        listing.active = false;

        (bool success, ) = payable(listing.seller).call{value: listing.price}("");
        require(success, "Payment transfer failed");

        IHashmonNFT(nftContract).safeTransferFrom(address(this), msg.sender, tokenId);
        emit ItemSold(tokenId, msg.sender, listing.price);
    }

    function cancelListing(uint256 tokenId) external {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");
        require(listing.seller == msg.sender, "Not seller");
        listing.active = false;
        IHashmonNFT(nftContract).safeTransferFrom(address(this), msg.sender, tokenId);
        emit ListingCancelled(tokenId);
    }

    function getActiveListings() external view returns (uint256[] memory tokenIds, Listing[] memory outListings) {
        uint256 total = 0;
        for (uint256 i = 0; i < 10000; i++) {
            if (listings[i].active) total++;
        }
        tokenIds = new uint256[](total);
        outListings = new Listing[](total);
        uint256 idx = 0;
        for (uint256 i = 0; i < 10000; i++) {
            if (listings[i].active) {
                tokenIds[idx] = i;
                outListings[idx] = listings[i];
                idx++;
            }
        }
    }
}
