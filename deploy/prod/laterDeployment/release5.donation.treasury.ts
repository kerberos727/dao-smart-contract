import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployments, ethers } from "hardhat";
import { createProposal } from "../../../test/utils/helpers";
import * as ethersTypes from "ethers";

const { deploy } = deployments;
let deployer: SignerWithAddress;

// alfajores
// const governanceDelegatorAddress = "0x5c27e2600a3eDEF53DE0Ec32F01efCF145419eDF";
// const proxyAdminAddress = "0x79f9ca5f1A01e1768b9C24AD37FF63A0199E3Fe5";
// const stakingProxyAddress = "0x2Bdd85857eDd9A4fAA72b663536189e38D8E3C71";
// const donationMinerProxyAddress = "0x09Cdc8f50994F63103bc165B139631A6ad18EF49";

// // mainnet
const governanceDelegatorAddress = "0x8f8BB984e652Cb8D0aa7C9D6712Ec2020EB1BAb4";
const proxyAdminAddress = "0xFC641CE792c242EACcD545B7bee2028f187f61EC";
const stakingProxyAddress = "0x1751e740379FC08b7f0eF6d49183fc0931Bd8179";
const donationMinerProxyAddress = "0x1C51657af2ceBA3D5492bA0c5A17E562F7ba6593";

let stakingNewImplementationAddress: string;
let donationNewImplementationAddress: string;

let GovernanceProxy: ethersTypes.Contract;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	// @ts-ignore
	// const { deployments, ethers } = hre;

	const accounts: SignerWithAddress[] = await ethers.getSigners();
	deployer = accounts[0];

	GovernanceProxy = await ethers.getContractAt(
		"PACTDelegate",
		governanceDelegatorAddress
	);

	await deployNewStaking();
	await deployNewDonationMiner();
	await createUpgradeProposal();
};

async function deployNewStaking() {
	console.log("Deploying new contract for staking");
	await new Promise((resolve) => setTimeout(resolve, 6000));
	stakingNewImplementationAddress = (
		await deploy("StakingImplementation", {
			from: deployer.address,
			args: [],
			log: true,
			// gasLimit: 13000000,
		})
	).address;
}

async function deployNewDonationMiner() {
	console.log("Deploying new contract for DonationMiner");
	await new Promise((resolve) => setTimeout(resolve, 6000));
	donationNewImplementationAddress = (
		await deploy("DonationMinerImplementation", {
			from: deployer.address,
			args: [],
			log: true,
			// gasLimit: 13000000,
		})
	).address;
}

async function createUpgradeProposal() {
	console.log("Creating new proposal");

	await new Promise((resolve) => setTimeout(resolve, 6000));
	await createProposal(
		GovernanceProxy,
		deployer,
		[proxyAdminAddress, stakingProxyAddress, proxyAdminAddress, donationMinerProxyAddress],
		[0, 0, 0, 0],
		["upgrade(address,address)", "stakeholder(address)", "upgrade(address,address)", "generalApr()"],
		[["address", "address"], ["address"], ["address", "address"], []],
		[
			[stakingProxyAddress, stakingNewImplementationAddress],
			[deployer.address],
			[donationMinerProxyAddress, donationNewImplementationAddress],
			[],
		],
		'Upgrade staking implementation. Upgrade donationMiner implementation.'
	);
}

export default func;
func.tags = ["Release5StakingDonationMiner"];
