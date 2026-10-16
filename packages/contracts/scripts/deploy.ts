import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const networkName = network.name;
  console.log(`[GXQ Deployment Pipeline] Initializing deployment for network: ${networkName}`);

  if (networkName === "mainnet") {
    console.warn("⚠️  WARNING: MAINNET DEPLOYMENT REQUIRES SIGN-OFF FROM MULTISIG GOVERNANCE AND SECURITY AUDIT CERTIFICATE.");
    if (process.env.CONFIRM_MAINNET_AUDITED !== "true") {
      throw new Error("Aborting mainnet deployment: Audit certification flag CONFIRM_MAINNET_AUDITED is not set.");
    }
  }

  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH/GXQ`);

  // 1. Deploy GXQToken
  console.log("1/4 Deploying GXQToken...");
  const initialSupply = ethers.parseEther("100000000"); // 100M GXQ
  const GXQTokenFactory = await ethers.getContractFactory("GXQToken");
  const gxqToken = await GXQTokenFactory.deploy(initialSupply);
  await gxqToken.waitForDeployment();
  const gxqAddress = await gxqToken.getAddress();
  console.log(`✓ GXQToken deployed at: ${gxqAddress}`);

  // 2. Deploy TokenFactory
  console.log("2/4 Deploying TokenFactory...");
  const FactoryContract = await ethers.getContractFactory("TokenFactory");
  const tokenFactory = await FactoryContract.deploy();
  await tokenFactory.waitForDeployment();
  const factoryAddress = await tokenFactory.getAddress();
  console.log(`✓ TokenFactory deployed at: ${factoryAddress}`);

  // 3. Deploy SimpleSwap
  console.log("3/4 Deploying SimpleSwap AMM...");
  const SimpleSwapFactory = await ethers.getContractFactory("SimpleSwap");
  // Using deployer as fee collector and temporary pair
  const simpleSwap = await SimpleSwapFactory.deploy(gxqAddress, gxqAddress, deployer.address);
  await simpleSwap.waitForDeployment();
  const swapAddress = await simpleSwap.getAddress();
  console.log(`✓ SimpleSwap deployed at: ${swapAddress}`);

  // 4. Deploy GXQStaking
  console.log("4/4 Deploying GXQStaking Vault...");
  const StakingContractFactory = await ethers.getContractFactory("GXQStaking");
  const staking = await StakingContractFactory.deploy(gxqAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log(`✓ GXQStaking deployed at: ${stakingAddress}`);

  // Export artifact
  const deploymentInfo = {
    network: networkName,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    contracts: {
      GXQToken: {
        address: gxqAddress,
        symbol: "GXQ",
        decimals: 18,
        totalSupply: initialSupply.toString(),
      },
      TokenFactory: {
        address: factoryAddress,
      },
      SimpleSwap: {
        address: swapAddress,
        feeBps: 30,
      },
      GXQStaking: {
        address: stakingAddress,
        baseAprBps: 1480,
      },
    },
  };

  const deploymentsDir = path.resolve(__dirname, "../../../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filePath = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✨ Deployment artifact saved successfully to: ${filePath}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
