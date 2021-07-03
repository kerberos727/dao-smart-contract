import { should } from 'chai';
import BigNumber from 'bignumber.js';
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
// @ts-ignore
import {ethers} from "hardhat";
import type * as ethersTypes from "ethers";
import {log} from "util";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { expectRevert, expectEvent, time, constants } = require('@openzeppelin/test-helpers');

should();
enum BeneficiaryState {
  NONE = '0',
  Valid = '1',
  Locked = '2',
  Removed = '3'
}

//users
let adminAccount1: SignerWithAddress;
let adminAccount2: SignerWithAddress;
let adminAccount3: SignerWithAddress;
// community managers
let communityManagerA: SignerWithAddress;
let communityManagerB: SignerWithAddress;
let communityManagerC: SignerWithAddress;
// beneficiaries
let beneficiaryA: SignerWithAddress;
let beneficiaryB: SignerWithAddress;
let beneficiaryC: SignerWithAddress;
let beneficiaryD: SignerWithAddress;

let ImpactMarket: ethersTypes.ContractFactory;
let Community: ethersTypes.ContractFactory;
let CommunityFactory: ethersTypes.ContractFactory;
let cUSD: ethersTypes.ContractFactory;

// contract instances
let communityFactoryInstance: ethersTypes.Contract;
let communityInstance: ethersTypes.Contract;
let cUSDInstance: ethersTypes.Contract;

BigNumber.config({ EXPONENTIAL_AT: 25 })

const bigNum = (num: number) => (num + '0'.repeat(18))


async function init()  {
    const accounts: SignerWithAddress[] =  await ethers.getSigners();

    adminAccount1 = accounts[0];
    adminAccount2 = accounts[1];
    adminAccount3 = accounts[2];
    // community managers
    communityManagerA = accounts[3];
    communityManagerB = accounts[4];
    communityManagerC = accounts[5];
    // beneficiaries
    beneficiaryA = accounts[6];
    beneficiaryB = accounts[7];
    beneficiaryC = accounts[8];
    beneficiaryD = accounts[9];

  ImpactMarket = await ethers.getContractFactory("ImpactMarket");
  Community = await ethers.getContractFactory("Community");
  CommunityFactory = await ethers.getContractFactory("CommunityFactory");
  cUSD = await ethers.getContractFactory("cUSD");
}

  // constants
  const decimals = new BigNumber(10).pow(18);
  const hour = time.duration.hours(1);
  const day = time.duration.days(1);
  const week = time.duration.weeks(1);
  // const month = time.duration.days(30);
  const claimAmountTwo = bigNum(2);
  const maxClaimTen = bigNum(10);
  const fiveCents = new BigNumber('50000000000000000');

  describe('Community - Beneficiary', () => {
    before(async function () {
      await init();
    });

    beforeEach(async () => {
      cUSDInstance = await cUSD.deploy();
      communityFactoryInstance = await CommunityFactory.deploy(cUSDInstance.address, adminAccount1.address);

      const tx = await communityFactoryInstance.createCommunity(
          communityManagerA.address,
          claimAmountTwo,
          maxClaimTen,
          15180,
          630,
      );

    let receipt = await tx.wait();


      const communityAddress = receipt.events?.filter((x:any) => {return x.event == "CommunityAdded"})[0]['args']['_communityAddress'];
      communityInstance = await Community.attach(communityAddress);
      await cUSDInstance.testFakeFundAddress(communityAddress);
    });

    it('should be able to add beneficiary to community', async () => {
        // console.log(communityInstance.beneficiaries(beneficiaryA));
      (await communityInstance.beneficiaries(beneficiaryA.address)).toString().should.be.equal(BeneficiaryState.NONE);
      await communityInstance.connect(communityManagerA).addBeneficiary(
          beneficiaryA.address,
          // { from: communityManagerA.address }
      );
      (await communityInstance.beneficiaries(beneficiaryA.address)).toString().should.be.equal(BeneficiaryState.Valid);
    });

  //   it('should give beneficiary 5 cents when adding to community', async () => {
  //     (await cUSDInstance.balanceOf(beneficiaryA)).toString()
  //         .should.be.equal('0');
  //     await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
  //     (await cUSDInstance.balanceOf(beneficiaryA)).toString()
  //         .should.be.equal(fiveCents.toString());
  //   });
  //
  //   it('should be able to lock beneficiary from community', async () => {
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.NONE);
  //     await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Valid);
  //     await communityInstance.lockBeneficiary(beneficiaryA, { from: communityManagerA });
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Locked);
  //   });
  //
  //   it('should not be able to lock an invalid beneficiary from community', async () => {
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.NONE);
  //     await expectRevert(
  //         communityInstance.lockBeneficiary(beneficiaryA, { from: communityManagerA }),
  //         "NOT_YET"
  //     );
  //   });
  //
  //   it('should be able to unlock locked beneficiary from community', async () => {
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.NONE);
  //     await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Valid);
  //     await communityInstance.lockBeneficiary(beneficiaryA, { from: communityManagerA });
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Locked);
  //     await communityInstance.unlockBeneficiary(beneficiaryA, { from: communityManagerA });
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Valid);
  //   });
  //
  //   it('should not be able to unlock a not locked beneficiary from community', async () => {
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.NONE);
  //     await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Valid);
  //     await expectRevert(
  //         communityInstance.unlockBeneficiary(beneficiaryA, { from: communityManagerA }),
  //         "NOT_YET"
  //     );
  //   });
  //
  //   it('should be able to remove beneficiary from community', async () => {
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.NONE);
  //     await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Valid);
  //     await communityInstance.removeBeneficiary(beneficiaryA, { from: communityManagerA });
  //     (await communityInstance.beneficiaries(beneficiaryA)).toString().should.be.equal(BeneficiaryState.Removed);
  //   });
  // });
  //
  // describe('Community - Claim', () => {
  //   beforeEach(async () => {
  //     cUSDInstance = await cUSD.new();
  //     communityFactoryInstance = await ImpactMarket.new(cUSDInstance.address, [adminAccount1]);
  //     communityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, communityFactoryInstance.address);
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address);
  //     const tx = await communityFactoryInstance.addCommunity(
  //         communityManagerA,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         day,
  //         hour,
  //         { from: adminAccount1 },
  //     );
  //     const communityManagerAddress = tx.logs[1].args[0];
  //     communityInstance = await Community.at(communityManagerAddress);
  //     await cUSDInstance.testFakeFundAddress(communityManagerAddress, { from: adminAccount1 });
  //     await communityInstance.addBeneficiary(beneficiaryA, { from: communityManagerA });
  //   });
  //
  //   it('should not claim without belong to community', async () => {
  //     await expectRevert(
  //         communityInstance.claim({ from: beneficiaryB }),
  //         "NOT_BENEFICIARY"
  //     );
  //   });
  //
  //   it('should not claim after locked from community', async () => {
  //     await communityInstance.lockBeneficiary(beneficiaryA, { from: communityManagerA });
  //     await expectRevert(
  //         communityInstance.claim({ from: beneficiaryA }),
  //         "LOCKED"
  //     );
  //   });
  //
  //   it('should not claim after removed from community', async () => {
  //     await communityInstance.removeBeneficiary(beneficiaryA, { from: communityManagerA });
  //     await expectRevert(
  //         communityInstance.claim({ from: beneficiaryA }),
  //         "REMOVED"
  //     );
  //   });
  //
  //   it('should not claim if community is locked', async () => {
  //     const receipt = await communityInstance.lock({ from: communityManagerA });
  //     expectEvent(receipt, 'CommunityLocked', {
  //       _by: communityManagerA,
  //     });
  //     await expectRevert(
  //         communityInstance.claim({ from: beneficiaryA }),
  //         "LOCKED"
  //     );
  //   });
  //
  //   it('should not claim without waiting enough', async () => {
  //     const baseInterval = (await communityInstance.baseInterval()).toNumber();
  //     const incrementInterval = (await communityInstance.incrementInterval()).toNumber();
  //     await communityInstance.claim({ from: beneficiaryA });
  //     await time.increase(time.duration.seconds(baseInterval + 5));
  //     await communityInstance.claim({ from: beneficiaryA });
  //     await time.increase(time.duration.seconds(incrementInterval + 5));
  //     await expectRevert(
  //         communityInstance.claim({ from: beneficiaryA }),
  //         "NOT_YET"
  //     );
  //     await time.increase(time.duration.seconds(incrementInterval + 5));
  //     await expectRevert(
  //         communityInstance.claim({ from: beneficiaryA }),
  //         "NOT_YET"
  //     );
  //   });
  //
  //   it('should claim after waiting', async () => {
  //     const baseInterval = (await communityInstance.baseInterval()).toNumber();
  //     await time.increase(time.duration.seconds(baseInterval + 5));
  //     await communityInstance.claim({ from: beneficiaryA });
  //     (await cUSDInstance.balanceOf(beneficiaryA)).toString()
  //         .should.be.equal(claimAmountTwo.plus(fiveCents).toString());
  //   });
  //
  //   it('should not claim after max claim', async () => {
  //     const baseInterval = (await communityInstance.baseInterval()).toNumber();
  //     const incrementInterval = (await communityInstance.incrementInterval()).toNumber();
  //     const claimAmount = new BigNumber((await communityInstance.claimAmount()).toString()).div(decimals).toNumber();
  //     const maxClaimAmount = new BigNumber((await communityInstance.maxClaim()).toString()).div(decimals).toNumber();
  //     await communityInstance.claim({ from: beneficiaryA });
  //     for (let index = 0; index < (maxClaimAmount / claimAmount) - 1; index++) {
  //       await time.increase(time.duration.seconds(baseInterval + incrementInterval * index + 5));
  //       await communityInstance.claim({ from: beneficiaryA });
  //     }
  //     await time.increase(time.duration.seconds(baseInterval + incrementInterval * (maxClaimAmount / claimAmount) + 5));
  //     await expectRevert(
  //         communityInstance.claim({ from: beneficiaryA }),
  //         "MAX_CLAIM"
  //     );
  //   });
  // });
  //
  // describe('Community - Governance (1)', () => {
  //   it('should not be able to add community if missing signatures', async () => {
  //     cUSDInstance = await cUSD.new();
  //     communityFactoryInstance = await ImpactMarket.new(cUSDInstance.address, [adminAccount1, adminAccount2]);
  //     communityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, communityFactoryInstance.address);
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address, { from: adminAccount1 });
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address, { from: adminAccount2 });
  //     const tx = await communityFactoryInstance.addCommunity(
  //         communityManagerA,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         day,
  //         hour,
  //         { from: adminAccount1 },
  //     );
  //     tx.logs.length.should.be.equal(0);
  //   });
  //
  //   it('should use differente parameters for each community', async () => {
  //     cUSDInstance = await cUSD.new();
  //     communityFactoryInstance = await ImpactMarket.new(cUSDInstance.address, [adminAccount1, adminAccount2]);
  //     communityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, communityFactoryInstance.address);
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address, { from: adminAccount1 });
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address, { from: adminAccount2 });
  //     let tx = await communityFactoryInstance.addCommunity(
  //         communityManagerA,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         day,
  //         hour,
  //         { from: adminAccount1 },
  //     );
  //     tx.logs.length.should.be.equal(0);
  //     tx = await communityFactoryInstance.addCommunity(
  //         communityManagerA,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         week,
  //         hour,
  //         { from: adminAccount2 },
  //     );
  //     tx.logs.length.should.be.equal(0);
  //   });
  //
  //   it('should be able to add community if missing 1 in 3 signatures', async () => {
  //     cUSDInstance = await cUSD.new();
  //     communityFactoryInstance = await ImpactMarket.new(cUSDInstance.address, [adminAccount1, adminAccount2, adminAccount3]);
  //     communityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, communityFactoryInstance.address);
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address, { from: adminAccount1 });
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address, { from: adminAccount2 });
  //     const tx1 = await communityFactoryInstance.addCommunity(
  //         communityManagerA,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         day,
  //         hour,
  //         { from: adminAccount1 },
  //     );
  //     tx1.logs.length.should.be.equal(0);
  //     const tx2 = await communityFactoryInstance.addCommunity(
  //         communityManagerA,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         day,
  //         hour,
  //         { from: adminAccount2 },
  //     );
  //     const communityAddress = tx2.logs[1].args[0];
  //     communityInstance = await Community.at(communityAddress);
  //     (await communityInstance.claimAmount()).toString().should.be.equal(claimAmountTwo.toString());
  //   });
  //
  //   it('should be signined by the two admins', async () => {
  //     cUSDInstance = await cUSD.new();
  //     communityFactoryInstance = await ImpactMarket.new(cUSDInstance.address, [adminAccount1, adminAccount2]);
  //     communityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, communityFactoryInstance.address);
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address, { from: adminAccount1 });
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address, { from: adminAccount2 });
  //     await communityFactoryInstance.addCommunity(
  //         communityManagerA,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         day,
  //         hour,
  //         { from: adminAccount1 },
  //     );
  //     const tx = await communityFactoryInstance.addCommunity(
  //         communityManagerA,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         day,
  //         hour,
  //         { from: adminAccount2 },
  //     );
  //     const communityAddress = tx.logs[1].args[0];
  //     communityInstance = await Community.at(communityAddress);
  //     (await communityInstance.claimAmount()).toString().should.be.equal(claimAmountTwo.toString());
  //   });
  //
  //   it('should not be able to sign twice by the same admin', async () => {
  //     cUSDInstance = await cUSD.new();
  //     communityFactoryInstance = await ImpactMarket.new(cUSDInstance.address, [adminAccount1, adminAccount2]);
  //     communityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, communityFactoryInstance.address);
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address);
  //     await communityFactoryInstance.addCommunity(
  //         communityManagerA,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         day,
  //         hour,
  //         { from: adminAccount1 },
  //     );
  //     await expectRevert(
  //         communityFactoryInstance.addCommunity(
  //             communityManagerA,
  //             claimAmountTwo,
  //             maxClaimTen,
  //             day,
  //             hour,
  //             { from: adminAccount1 },
  //         ),
  //         'SIGNED'
  //     );
  //   });
  // });
  // describe('Community - Governance (2)', () => {
  //   beforeEach(async () => {
  //     cUSDInstance = await cUSD.new();
  //     communityFactoryInstance = await ImpactMarket.new(cUSDInstance.address, [adminAccount1]);
  //     communityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, communityFactoryInstance.address);
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address);
  //     const tx = await communityFactoryInstance.addCommunity(
  //         communityManagerA,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         day,
  //         hour,
  //         { from: adminAccount1 },
  //     );
  //     const communityAddress = tx.logs[1].args[0];
  //     communityInstance = await Community.at(communityAddress);
  //   });
  //
  //   it('should not be able to grantRole', async () => {
  //     await expectRevert(
  //         communityFactoryInstance.grantRole(
  //             await communityFactoryInstance.ADMIN_ROLE(),
  //             adminAccount2,
  //             { from: adminAccount1 },
  //         ),
  //         'NOT_ALLOWED'
  //     );
  //   });
  //
  //   it('should not be able to revokeRole', async () => {
  //     await expectRevert(
  //         communityFactoryInstance.revokeRole(
  //             await communityFactoryInstance.ADMIN_ROLE(),
  //             adminAccount1,
  //             { from: adminAccount1 },
  //         ),
  //         'NOT_ALLOWED'
  //     );
  //   });
  //
  //   it('should not be able to renounceRole', async () => {
  //     await expectRevert(
  //         communityFactoryInstance.renounceRole(
  //             await communityFactoryInstance.ADMIN_ROLE(),
  //             adminAccount1,
  //             { from: adminAccount1 },
  //         ),
  //         'NOT_ALLOWED'
  //     );
  //   });
  //
  //   it('should be able to migrate funds from community if impactMarket admin', async () => {
  //     const previousCommunityPreviousBalance = await cUSDInstance.balanceOf(communityInstance.address);
  //     const newCommunityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, communityFactoryInstance.address);
  //     const newTx = await communityFactoryInstance.migrateCommunity(
  //         communityManagerA,
  //         communityInstance.address,
  //         newCommunityFactoryInstance.address,
  //         { from: adminAccount1 },
  //     );
  //     const newCommunityAddress = newTx.logs[1].args[1];
  //     communityInstance = await Community.at(newCommunityAddress);
  //     const previousCommunityNewBalance = await cUSDInstance.balanceOf(communityInstance.address);
  //     const newCommunityNewBalance = await cUSDInstance.balanceOf(newCommunityAddress);
  //     previousCommunityPreviousBalance.toString().should.be.equal(newCommunityNewBalance.toString());
  //     previousCommunityNewBalance.toString().should.be.equal('0');
  //   });
  //
  //   it('should not be able toset factory from invalid impactMarket contract', async () => {
  //     const communityFactoryInstance2 = await ImpactMarket.new(cUSDInstance.address, [adminAccount2], { from: adminAccount2 });
  //     await expectRevert(
  //         communityFactoryInstance2.setCommunityFactory(communityFactoryInstance.address, { from: adminAccount2 }),
  //         'NOT_ALLOWED'
  //     );
  //   });
  //
  //   it('should not be able to migrate from invalid community', async () => {
  //     const newCommunityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, communityFactoryInstance.address);
  //     await expectRevert(
  //         communityFactoryInstance.migrateCommunity(
  //             communityManagerA,
  //             constants.ZERO_ADDRESS,
  //             newCommunityFactoryInstance.address,
  //             { from: adminAccount1 },
  //         ),
  //         'NOT_VALID'
  //     );
  //   });
  //
  //   it('should not be able to migrate community if not admin', async () => {
  //     const newCommunityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, communityFactoryInstance.address);
  //     await expectRevert(
  //         communityFactoryInstance.migrateCommunity(
  //             communityManagerA,
  //             cUSDInstance.address, // wrong on purpose
  //             newCommunityFactoryInstance.address,
  //             { from: adminAccount2 },
  //         ),
  //         'NOT_ADMIN'
  //     );
  //   });
  //
  //   it('should be able edit community if manager', async () => {
  //     (await communityInstance.incrementInterval()).toString().should.be.equal(hour.toString());
  //     await communityInstance.edit(
  //         claimAmountTwo,
  //         maxClaimTen,
  //         week,
  //         day,
  //         { from: communityManagerA }
  //     );
  //     (await communityInstance.incrementInterval()).toString().should.be.equal(day.toString());
  //   });
  //
  //   it('should not be able edit community if not manager', async () => {
  //     await expectRevert(
  //         communityInstance.edit(
  //             claimAmountTwo,
  //             maxClaimTen,
  //             day,
  //             day,
  //             { from: communityManagerB }
  //         ),
  //         "NOT_MANAGER"
  //     );
  //   });
  //
  //   it('should not be able edit community with invalid values', async () => {
  //     await expectRevert.unspecified(
  //         communityInstance.edit(
  //             claimAmountTwo,
  //             maxClaimTen,
  //             day,
  //             week,
  //             { from: communityManagerA }
  //         )
  //     );
  //     await expectRevert.unspecified(
  //         communityInstance.edit(
  //             maxClaimTen, // supposed to be wrong
  //             claimAmountTwo,
  //             week,
  //             day,
  //             { from: communityManagerA }
  //         )
  //     );
  //   });
  //
  //   it('should not be able to add manager to community if not manager', async () => {
  //     await expectRevert(
  //         communityInstance.addManager(communityManagerB, { from: communityManagerC }),
  //         "NOT_MANAGER"
  //     );
  //   });
  //
  //   it('should not be able to remove manager from community if not manager', async () => {
  //     await communityInstance.addManager(communityManagerB, { from: communityManagerA });
  //     await expectRevert(
  //         communityInstance.removeManager(communityManagerB, { from: communityManagerC }),
  //         "NOT_MANAGER"
  //     );
  //   });
  //
  //   it('should be able to add manager to community if manager', async () => {
  //     await communityInstance.addManager(communityManagerB, { from: communityManagerA });
  //   });
  //
  //   it('should be able to remove manager to community if manager', async () => {
  //     await communityInstance.addManager(communityManagerB, { from: communityManagerA });
  //     await communityInstance.removeManager(communityManagerB, { from: communityManagerA });
  //   });
  //
  //   it('should be able to renounce from manager of community if manager', async () => {
  //     await communityInstance.addManager(communityManagerB, { from: communityManagerA });
  //     await communityInstance.renounceRole(
  //         await communityInstance.MANAGER_ROLE(),
  //         communityManagerB, { from: communityManagerB }
  //     );
  //   });
  //
  //   it('should be able to lock community if manager', async () => {
  //     const receipt = await communityInstance.lock({ from: communityManagerA });
  //     expectEvent(receipt, 'CommunityLocked', {
  //       _by: communityManagerA,
  //     });
  //   });
  //
  //   it('should be able to lock community if manager', async () => {
  //     let receipt = await communityInstance.lock({ from: communityManagerA });
  //     expectEvent(receipt, 'CommunityLocked', {
  //       _by: communityManagerA,
  //     });
  //     receipt = await communityInstance.unlock({ from: communityManagerA });
  //     expectEvent(receipt, 'CommunityUnlocked', {
  //       _by: communityManagerA,
  //     });
  //   });
  // });
  //
  // describe('ImpactMarket', () => {
  //   beforeEach(async () => {
  //     cUSDInstance = await cUSD.new();
  //     communityFactoryInstance = await ImpactMarket.new(cUSDInstance.address, [adminAccount1]);
  //     communityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, communityFactoryInstance.address);
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address);
  //   });
  //
  //   it('should be able to add a community if admin', async () => {
  //     const tx = await communityFactoryInstance.addCommunity(
  //         communityManagerA,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         day,
  //         hour,
  //         { from: adminAccount1 },
  //     );
  //     const communityManagerAddress = tx.logs[1].args[0];
  //     communityInstance = await Community.at(communityManagerAddress);
  //     (await communityInstance.claimAmount()).toString().should.be.equal(
  //         claimAmountTwo.toString()
  //     );
  //     (await communityInstance.baseInterval()).toString().should.be.equal('86400');
  //     (await communityInstance.incrementInterval()).toString().should.be.equal('3600');
  //     (await communityInstance.maxClaim()).toString().should.be.equal(
  //         maxClaimTen.toString()
  //     );
  //
  //   });
  //
  //   it('should be able to remove a community if admin', async () => {
  //     const tx = await communityFactoryInstance.addCommunity(
  //         communityManagerA,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         day,
  //         hour,
  //         { from: adminAccount1 },
  //     );
  //     const communityManagerAddress = tx.logs[1].args[0];
  //     await communityFactoryInstance.removeCommunity(communityManagerAddress, { from: adminAccount1 });
  //   });
  //
  //   it('should not be able to create a community with invalid values', async () => {
  //     await expectRevert.unspecified(
  //         communityFactoryInstance.addCommunity(
  //             communityManagerA,
  //             claimAmountTwo,
  //             maxClaimTen,
  //             hour,
  //             day,
  //             { from: adminAccount1 },
  //         )
  //     );
  //     await expectRevert.unspecified(
  //         communityFactoryInstance.addCommunity(
  //             communityManagerA,
  //             maxClaimTen, // it's supposed to be wrong!
  //             claimAmountTwo,
  //             day,
  //             hour,
  //             { from: adminAccount1 },
  //         )
  //     );
  //   });
  // });
  //
  // describe('Chaos test (complete flow)', async () => {
  //   // add community
  //   const addCommunity = async (communityManager: string): Promise<CommunityInstance> => {
  //     const tx = await communityFactoryInstance.addCommunity(
  //         communityManager,
  //         claimAmountTwo,
  //         maxClaimTen,
  //         day,
  //         hour,
  //         { from: adminAccount1 },
  //     );
  //     // eslint-disable-next-line prefer-const
  //     const communityManagerAddress = tx.logs[1].args[0] as string;
  //     const instance = await Community.at(communityManagerAddress);
  //     await cUSDInstance.testFakeFundAddress(communityManagerAddress, { from: adminAccount1 });
  //     return instance;
  //   }
  //   // add beneficiary
  //   const addBeneficiary = async (instance: CommunityInstance, beneficiaryAddress: string, communityManagerAddress: string): Promise<void> => {
  //     const tx = await instance.addBeneficiary(
  //         beneficiaryAddress,
  //         { from: communityManagerAddress },
  //     );
  //     const blockData = await web3.eth.getBlock(tx.receipt.blockNumber);
  //     (await instance.beneficiaries(beneficiaryAddress)).toString().should.be.equal(BeneficiaryState.Valid);
  //     (await instance.cooldown(beneficiaryAddress)).toNumber().should.be.equal(blockData.timestamp);
  //   }
  //   // wait claim time
  //   const waitClaimTime = async (instance: CommunityInstance, beneficiaryAddress: string): Promise<void> => {
  //     const waitIs = (await instance.lastInterval(beneficiaryAddress)).toNumber();
  //     await time.increase(time.duration.seconds(waitIs + 5)); // wait is + 5
  //   }
  //   // claim
  //   const beneficiaryClaim = async (instance: CommunityInstance, beneficiaryAddress: string): Promise<void> => {
  //     const previousBalance = new BigNumber(await cUSDInstance.balanceOf(beneficiaryAddress));
  //     const previousLastInterval = new BigNumber(await instance.lastInterval(beneficiaryAddress));
  //     await instance.claim({ from: beneficiaryAddress });
  //     const currentBalance = new BigNumber(await cUSDInstance.balanceOf(beneficiaryAddress));
  //     const currentLastInterval = new BigNumber(await instance.lastInterval(beneficiaryAddress));
  //     previousBalance.plus(await instance.claimAmount()).toString()
  //         .should.be.equal(currentBalance.toString());
  //     previousLastInterval.plus(await instance.incrementInterval()).toString()
  //         .should.be.equal(currentLastInterval.toString());
  //   }
  //
  //   //
  //   beforeEach(async () => {
  //     cUSDInstance = await cUSD.new();
  //     communityFactoryInstance = await ImpactMarket.new(cUSDInstance.address, [adminAccount1]);
  //     communityFactoryInstance = await CommunityFactory.new(cUSDInstance.address, communityFactoryInstance.address);
  //     await communityFactoryInstance.setCommunityFactory(communityFactoryInstance.address);
  //   });
  //   it('one beneficiary to one community', async () => {
  //     const communityInstanceA = await addCommunity(communityManagerA);
  //     await addBeneficiary(communityInstanceA, beneficiaryA, communityManagerA);
  //     await waitClaimTime(communityInstanceA, beneficiaryA);
  //     await beneficiaryClaim(communityInstanceA, beneficiaryA);
  //     await expectRevert(
  //         beneficiaryClaim(communityInstanceA, beneficiaryA),
  //         "NOT_YET"
  //     );
  //     await waitClaimTime(communityInstanceA, beneficiaryA);
  //     await beneficiaryClaim(communityInstanceA, beneficiaryA);
  //   });
  //
  //   it('many beneficiaries to one community', async () => {
  //     const communityInstanceA = await addCommunity(communityManagerA);
  //     const previousCommunityBalance = new BigNumber((await cUSDInstance.balanceOf(communityInstanceA.address)).toString());
  //     await addBeneficiary(communityInstanceA, beneficiaryA, communityManagerA);
  //     await addBeneficiary(communityInstanceA, beneficiaryB, communityManagerA);
  //     await addBeneficiary(communityInstanceA, beneficiaryC, communityManagerA);
  //     await addBeneficiary(communityInstanceA, beneficiaryD, communityManagerA);
  //     // beneficiary A claims twice
  //     await waitClaimTime(communityInstanceA, beneficiaryA);
  //     await beneficiaryClaim(communityInstanceA, beneficiaryA);
  //     await waitClaimTime(communityInstanceA, beneficiaryA);
  //     await beneficiaryClaim(communityInstanceA, beneficiaryA);
  //     // beneficiary B claims once
  //     await waitClaimTime(communityInstanceA, beneficiaryB);
  //     await beneficiaryClaim(communityInstanceA, beneficiaryB);
  //     // beneficiary C claims it all
  //     const claimAmount = new BigNumber((await communityInstanceA.claimAmount()).toString()).div(decimals).toNumber();
  //     const maxClaimAmount = new BigNumber((await communityInstanceA.maxClaim()).toString()).div(decimals).toNumber();
  //     const maxClaimsPerUser = maxClaimAmount / claimAmount;
  //     for (let index = 0; index < maxClaimsPerUser; index++) {
  //       await waitClaimTime(communityInstanceA, beneficiaryC);
  //       await beneficiaryClaim(communityInstanceA, beneficiaryC);
  //     }
  //     // beneficiary B can still claim
  //     await waitClaimTime(communityInstanceA, beneficiaryB);
  //     await beneficiaryClaim(communityInstanceA, beneficiaryB);
  //     // beneficiary A can still claim
  //     await waitClaimTime(communityInstanceA, beneficiaryA);
  //     await beneficiaryClaim(communityInstanceA, beneficiaryA);
  //     // beneficiary C can't claim anymore
  //     await waitClaimTime(communityInstanceA, beneficiaryC);
  //     await expectRevert(
  //         beneficiaryClaim(communityInstanceA, beneficiaryC),
  //         "MAX_CLAIM"
  //     );
  //     const currentCommunityBalance = new BigNumber((await cUSDInstance.balanceOf(communityInstanceA.address)).toString());
  //     previousCommunityBalance.minus(currentCommunityBalance).toString().should.be
  //         .equal(new BigNumber(claimAmount * (5 + maxClaimsPerUser)).multipliedBy(decimals).plus(4 * fiveCents.toNumber()).toString());
  //   });
  //
  //   it('many beneficiaries to many communities', async () => {
  //     // community A
  //     const communityInstanceA = await addCommunity(communityManagerA);
  //     const communityInstanceB = await addCommunity(communityManagerB);
  //     const previousCommunityBalanceA = new BigNumber((await cUSDInstance.balanceOf(communityInstanceA.address)).toString());
  //     const previousCommunityBalanceB = new BigNumber((await cUSDInstance.balanceOf(communityInstanceB.address)).toString());
  //     //
  //     await addBeneficiary(communityInstanceA, beneficiaryA, communityManagerA);
  //     await addBeneficiary(communityInstanceA, beneficiaryB, communityManagerA);
  //     //
  //     await addBeneficiary(communityInstanceB, beneficiaryC, communityManagerB);
  //     await addBeneficiary(communityInstanceB, beneficiaryD, communityManagerB);
  //     // beneficiary A claims twice
  //     await waitClaimTime(communityInstanceA, beneficiaryA);
  //     await beneficiaryClaim(communityInstanceA, beneficiaryA);
  //     await waitClaimTime(communityInstanceA, beneficiaryA);
  //     await beneficiaryClaim(communityInstanceA, beneficiaryA);
  //     // beneficiary B claims it all
  //     const claimAmountA = new BigNumber((await communityInstanceA.claimAmount()).toString()).div(decimals).toNumber();
  //     const maxClaimAmountA = new BigNumber((await communityInstanceA.maxClaim()).toString()).div(decimals).toNumber();
  //     const maxClaimsPerUserA = maxClaimAmountA / claimAmountA;
  //     for (let index = 0; index < maxClaimsPerUserA; index++) {
  //       await waitClaimTime(communityInstanceA, beneficiaryB);
  //       await beneficiaryClaim(communityInstanceA, beneficiaryB);
  //     }
  //     // beneficiary C claims it all
  //     const claimAmountB = new BigNumber((await communityInstanceB.claimAmount()).toString()).div(decimals).toNumber();
  //     const maxClaimAmountB = new BigNumber((await communityInstanceB.maxClaim()).toString()).div(decimals).toNumber();
  //     const maxClaimsPerUserB = maxClaimAmountB / claimAmountB;
  //     for (let index = 0; index < maxClaimsPerUserB; index++) {
  //       await waitClaimTime(communityInstanceB, beneficiaryC);
  //       await beneficiaryClaim(communityInstanceB, beneficiaryC);
  //     }
  //     // beneficiary D claims three times
  //     await waitClaimTime(communityInstanceB, beneficiaryD);
  //     await beneficiaryClaim(communityInstanceB, beneficiaryD);
  //     await waitClaimTime(communityInstanceB, beneficiaryD);
  //     await beneficiaryClaim(communityInstanceB, beneficiaryD);
  //     await waitClaimTime(communityInstanceB, beneficiaryD);
  //     await beneficiaryClaim(communityInstanceB, beneficiaryD);
  //     // beneficiary A can still claim
  //     await waitClaimTime(communityInstanceA, beneficiaryA);
  //     await beneficiaryClaim(communityInstanceA, beneficiaryA);
  //     // beneficiary C can't claim anymore
  //     await waitClaimTime(communityInstanceB, beneficiaryC);
  //     await expectRevert(
  //         beneficiaryClaim(communityInstanceB, beneficiaryC),
  //         "MAX_CLAIM"
  //     );
  //     // beneficiary B can't claim anymore
  //     await waitClaimTime(communityInstanceB, beneficiaryC);
  //     await expectRevert(
  //         beneficiaryClaim(communityInstanceB, beneficiaryC),
  //         "MAX_CLAIM"
  //     );
  //     // beneficiary D can still claim
  //     await waitClaimTime(communityInstanceB, beneficiaryD);
  //     await beneficiaryClaim(communityInstanceB, beneficiaryD);
  //     // balances
  //     const currentCommunityBalanceA = new BigNumber((await cUSDInstance.balanceOf(communityInstanceA.address)).toString());
  //     previousCommunityBalanceA.minus(currentCommunityBalanceA).toString().should.be
  //         .equal(new BigNumber(claimAmountA * (3 + maxClaimsPerUserA)).multipliedBy(decimals).plus(2 * fiveCents.toNumber()).toString());
  //     const currentCommunityBalanceB = new BigNumber((await cUSDInstance.balanceOf(communityInstanceB.address)).toString());
  //     previousCommunityBalanceB.minus(currentCommunityBalanceB).toString().should.be
  //         .equal(new BigNumber(claimAmountB * (4 + maxClaimsPerUserB)).multipliedBy(decimals).plus(2 * fiveCents.toNumber()).toString());
  //   });
  });
