import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedDietTracker = await deploy("DietTracker", {
    from: deployer,
    log: true,
  });

  console.log(`DietTracker contract deployed at: `, deployedDietTracker.address);
};
export default func;
func.id = "deploy_dietTracker"; // id required to prevent reexecution
func.tags = ["DietTracker"];

