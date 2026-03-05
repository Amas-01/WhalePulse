import hre from "hardhat";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config({ path: __dirname + "/../.env" });

async function main() {
  const SOMNIA_URL = process.env.SOMNIA_RPC_URL;
  const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
  if (!SOMNIA_URL) throw new Error("SOMNIA_RPC_URL not set in env");
  if (!DEPLOYER_KEY) throw new Error("DEPLOYER_PRIVATE_KEY not set in env");

  const artifact = await hre.artifacts.readArtifact("WhaleToken");

  const provider = new ethers.JsonRpcProvider(SOMNIA_URL);
  const wallet = new ethers.Wallet(DEPLOYER_KEY, provider);

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment?.();
  const address = contract.target || contract.address;
  console.log("WhaleToken deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
