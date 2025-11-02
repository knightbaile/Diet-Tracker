import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACT_NAME = "DietTracker";

// <root>/backend
const rel = "../backend";

// <root>/frontend/abi
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir);
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/backend${line}`
  );
  process.exit(1);
}

if (!fs.existsSync(outdir)) {
  console.error(`${line}Unable to locate ${outdir}.${line}`);
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

// Network configurations: chainName, chainId, chainDisplayName
const networks = [
  { chainName: "sepolia", chainId: 11155111, chainDisplayName: "sepolia" },
  { chainName: "localhost", chainId: 31337, chainDisplayName: "hardhat" },
  { chainName: "hardhat", chainId: 31337, chainDisplayName: "hardhat" },
];

/**
 * Read deployment information for a specific network
 * @param {string} chainName - Network name in deployments folder
 * @param {number} chainId - Chain ID
 * @param {string} contractName - Contract name
 * @returns {object|undefined} Deployment object or undefined if not found
 */
function readDeployment(chainName, chainId, contractName) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir)) {
    console.log(`Skipping ${chainName} (${chainId}): deployment directory not found`);
    return undefined;
  }

  const deploymentFile = path.join(chainDeploymentDir, `${contractName}.json`);
  if (!fs.existsSync(deploymentFile)) {
    console.log(`Skipping ${chainName} (${chainId}): deployment file not found`);
    return undefined;
  }

  try {
    const jsonString = fs.readFileSync(deploymentFile, "utf-8");
    const obj = JSON.parse(jsonString);
    obj.chainId = chainId;
    console.log(`Found deployment on ${chainName} (${chainId}): ${obj.address}`);
    return obj;
  } catch (error) {
    console.log(`Skipping ${chainName} (${chainId}): error reading deployment - ${error.message}`);
    return undefined;
  }
}

// Collect all available deployments
const deployments = [];
let primaryDeployment = null;

for (const network of networks) {
  const deployment = readDeployment(network.chainName, network.chainId, CONTRACT_NAME);
  if (deployment) {
    deployments.push({
      ...deployment,
      chainName: network.chainDisplayName,
    });
    // Use the first found deployment as primary for ABI
    if (!primaryDeployment) {
      primaryDeployment = deployment;
    }
  }
}

// If no deployments found, try to read ABI from artifacts
if (!primaryDeployment) {
  console.log("No deployments found. Attempting to read ABI from compiled artifacts...");
  const artifactsDir = path.join(dir, "artifacts", "contracts", `${CONTRACT_NAME}.sol`);
  const artifactFile = path.join(artifactsDir, `${CONTRACT_NAME}.json`);
  
  if (fs.existsSync(artifactFile)) {
    try {
      const artifactString = fs.readFileSync(artifactFile, "utf-8");
      const artifact = JSON.parse(artifactString);
      primaryDeployment = {
        abi: artifact.abi || [],
        address: "0x0000000000000000000000000000000000000000",
      };
      console.log("Successfully read ABI from compiled artifacts");
    } catch (error) {
      console.error(`Error reading artifact file: ${error.message}`);
      // Use empty ABI as fallback
      primaryDeployment = {
        abi: [],
        address: "0x0000000000000000000000000000000000000000",
      };
      console.log("Using empty ABI as fallback");
    }
  } else {
    console.warn("Artifact file not found. Using empty ABI as fallback.");
    // Use empty ABI as fallback
    primaryDeployment = {
      abi: [],
      address: "0x0000000000000000000000000000000000000000",
    };
  }
}

// Verify all deployments have the same ABI
const primaryABI = JSON.stringify(primaryDeployment.abi);
for (const deployment of deployments) {
  if (JSON.stringify(deployment.abi) !== primaryABI) {
    console.warn(
      `Warning: ABI mismatch detected for ${deployment.chainName}. Using primary ABI.`
    );
  }
}

// Generate addresses object
const addressesObj = {};
for (const deployment of deployments) {
  addressesObj[String(deployment.chainId)] = {
    address: deployment.address,
    chainId: deployment.chainId,
    chainName: deployment.chainName,
  };
}

// Ensure Sepolia (11155111) is in addresses, even if not deployed
if (!addressesObj["11155111"]) {
  addressesObj["11155111"] = {
    address: "0x0000000000000000000000000000000000000000",
    chainId: 11155111,
    chainName: "sepolia",
  };
  console.log("Note: Sepolia (11155111) not deployed, using zero address placeholder");
}

// Ensure localhost/hardhat (31337) is in addresses
if (!addressesObj["31337"]) {
  addressesObj["31337"] = {
    address: "0x0000000000000000000000000000000000000000",
    chainId: 31337,
    chainName: "hardhat",
  };
  console.log("Note: Localhost (31337) not deployed, using zero address placeholder");
}

const tsCode = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: primaryDeployment.abi }, null, 2)} as const;
\n`;

const tsAddresses = `
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = ${JSON.stringify(addressesObj, null, 2)};
`;

console.log(`\nGenerated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);

fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
fs.writeFileSync(
  path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
  tsAddresses,
  "utf-8"
);

