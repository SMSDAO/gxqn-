import { run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function verifyContracts() {
  const networkName = network.name;
  console.log(`[Verification] Verifying contracts on network: ${networkName}`);

  const deploymentPath = path.resolve(__dirname, `../../../deployments/${networkName}.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}`);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  const contracts = deployment.contracts;

  if (contracts.GXQToken?.address) {
    console.log(`Verifying GXQToken at ${contracts.GXQToken.address}...`);
    try {
      await run("verify:verify", {
        address: contracts.GXQToken.address,
        constructorArguments: [contracts.GXQToken.totalSupply || "100000000000000000000000000"],
      });
      console.log(`✓ GXQToken verified on ${networkName} explorer!`);
    } catch (e: any) {
      console.log(`Verification note: ${e.message}`);
    }
  }

  if (contracts.TokenFactory?.address) {
    console.log(`Verifying TokenFactory at ${contracts.TokenFactory.address}...`);
    try {
      await run("verify:verify", {
        address: contracts.TokenFactory.address,
        constructorArguments: [],
      });
      console.log(`✓ TokenFactory verified!`);
    } catch (e: any) {
      console.log(`Verification note: ${e.message}`);
    }
  }

  if (contracts.SimpleSwap?.address) {
    console.log(`Verifying SimpleSwap at ${contracts.SimpleSwap.address}...`);
    try {
      await run("verify:verify", {
        address: contracts.SimpleSwap.address,
        constructorArguments: [contracts.GXQToken.address, contracts.GXQToken.address, deployment.deployer],
      });
      console.log(`✓ SimpleSwap verified!`);
    } catch (e: any) {
      console.log(`Verification note: ${e.message}`);
    }
  }
}

verifyContracts().catch(console.error);
