// @ts-ignore
import { ethers } from "hardhat";
import { advanceBlockNTimes, advanceNSeconds } from "./TimeTravel";
import { parseEther, formatEther } from "@ethersproject/units";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import * as ethersTypes from "ethers";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";

export const governanceParams = {
	EXECUTION_DELAY: 2 * 24 * 60 * 60, //2 days in seconds
	VOTING_PERIOD: 720,
	VOTING_DELAY: 1,
	TOKEN_SUPPLY: parseEther("10000000000"), // 10 bil units
	PROPOSAL_THRESHOLD: parseEther("100000000"), // 100 millions units (1%)
	QUORUM_VOTES: parseEther("100000000"),
	GRACE_PERIOD: 3600 * 24 * 14, //fixed in timelock
};

export function toEther(value: number | string): BigNumber {
	return parseEther(value.toString());
}

export function fromEther(value: number | string | BigNumber): string {
	return formatEther(value.toString());
}

export async function createAndExecuteProposal(
	governanceDelegator: ethersTypes.Contract,
	proposer: SignerWithAddress,
	voters: SignerWithAddress[],
	targets: string[],
	values: any[],
	signatures: string[],
	calldataTyeps: string[][],
	calldataValues: any[][],
	description: string = ""
) {
	const calldatas: string[] = [];
	for (let i = 0; i < calldataTyeps.length; i++) {
		calldatas.push(
			ethers.utils.defaultAbiCoder.encode(
				calldataTyeps[i],
				calldataValues[i]
			)
		);
	}

	await governanceDelegator
		.connect(proposer)
		.propose(targets, values, signatures, calldatas, description);

	await advanceBlockNTimes(governanceParams.VOTING_DELAY);
	for (let i = 0; i < voters.length; i++) {
		await governanceDelegator.connect(voters[i]).castVote(1, 1);
	}

	await advanceBlockNTimes(governanceParams.VOTING_PERIOD);

	await governanceDelegator.queue(1);
	await advanceNSeconds(governanceParams.EXECUTION_DELAY);

	await governanceDelegator.execute(1);
}
