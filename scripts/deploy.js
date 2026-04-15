const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const HashmonNFT = await hre.ethers.getContractFactory("HashmonNFT");
  const nft = await HashmonNFT.deploy();
  await nft.deployed();
  console.log("HashmonNFT deployed to:", nft.address);

  const HashmonMarketplace = await hre.ethers.getContractFactory("HashmonMarketplace");
  const market = await HashmonMarketplace.deploy(nft.address);
  await market.deployed();
  console.log("HashmonMarketplace deployed to:", market.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
