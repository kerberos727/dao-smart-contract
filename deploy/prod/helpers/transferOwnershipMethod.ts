import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployments, ethers } from "hardhat";
import { createProposal } from "../../../test/utils/helpers";
import * as ethersTypes from "ethers";

const { deploy } = deployments;
let deployer: SignerWithAddress;

// mainnet
const governanceDelegatorAddress = "0x8f8BB984e652Cb8D0aa7C9D6712Ec2020EB1BAb4";
const target1Address = "0xFC641CE792c242EACcD545B7bee2028f187f61EC";
const target2Address = "0x1C51657af2ceBA3D5492bA0c5A17E562F7ba6593";
const newOwnerAddress = "0x0497b572842a178445fC29EbDDf6B220C40eE384";


// //alfajores
// const governanceDelegatorAddress = "0x5c27e2600a3eDEF53DE0Ec32F01efCF145419eDF";
// const target1Address = "0x79f9ca5f1A01e1768b9C24AD37FF63A0199E3Fe5";
// const target2Address = "0x09Cdc8f50994F63103bc165B139631A6ad18EF49";
// const newOwnerAddress = "0x9bDD1df7e44c120C51E74E5C6FA2e0b41487De9F";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	// @ts-ignore
	// const { deployments, ethers } = hre;

	const accounts: SignerWithAddress[] = await ethers.getSigners();
	deployer = accounts[0];

	await createUpgradeImplementation();
};

async function createUpgradeImplementation() {
	console.log("Creating new proposal");

	await createProposal(
		governanceDelegatorAddress,
		deployer,
		[
			target1Address,
			target2Address,
		],
		[0, 0],
		[
			"transferOwnership(address)",
			"transferOwnership(address)",
		],
		[
			["address"],
			["address"]]
		,
		[
			[newOwnerAddress],
			[newOwnerAddress],
		],
		'Change contracts ownership'
	);
}

export default func;
func.tags = ["TransferOwnership"];
