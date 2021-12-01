//SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../community/interfaces/ICommunityAdmin.sol";
import "./ITreasury.sol";

interface IDonationMiner {
    struct RewardPeriod {
        uint256 rewardPerBlock; //reward tokens created per block.
        uint256 rewardAmount; //reward tokens from previous periods + reward tokens from this reward period
        uint256 startBlock; //block number at which reward period starts.
        uint256 endBlock; //block number at which reward period ends.
        uint256 donationsAmount; //total of donations for this rewardPeriod.
        mapping(address => uint256) donorAmounts; //amounts donated by every donor in this rewardPeriod.
    }

    struct Donor {
        uint256 lastClaim;  //last reward period index for which the donor has claimed the reward
        uint256 rewardPeriodsCount; //total number of reward periods in which the donor donated
        mapping(uint256 => uint256) rewardPeriods; //list of all reward period ids in which the donor donated
    }


    struct Donation {
        address donor;  //address of the donner
        address target;  //address of the receiver (community or treasury)
        uint256 rewardPeriod;  //number of the reward period in which the donation was made
        uint256 blockNumber;  //number of the block in which the donation was executed
        uint256 amount;  //number of tokens donated
        IERC20 token;  //address of the token
        uint256 tokenPrice;  //the price of the token in cUSD
    }

    function getVersion() external returns(uint256);
    function cUSD() external view returns (IERC20);
    function PACT() external view returns (IERC20);
    function treasury() external view returns (ITreasury);
    function rewardPeriodSize() external view returns (uint256);
    function decayNumerator() external view returns (uint256);
    function decayDenominator() external view returns (uint256);
    function rewardPeriodCount() external view returns (uint256);
    function donationCount() external view returns (uint256);
    function rewardPeriods(uint256 _period) external view returns (
        uint256 rewardPerBlock,
        uint256 rewardAmount,
        uint256 startBlock,
        uint256 endBlock,
        uint256 donationsAmount
    );
    function rewardPeriodDonorAmount(uint256 _period, address _donor) external view returns (uint256);
    function donors(address _donor) external view returns (uint256 rewardPeriodsCount, uint256 lastClaim);
    function donorRewardPeriod(address _donor, uint256 _rewardPeriodIndex) external view returns (uint256);
    function donations(uint256 _index) external view returns (
        address donor,
        address target,
        uint256 rewardPeriod,
        uint256 blockNumber,
        uint256 amount,
        IERC20 token,
        uint256 tokenPrice
    );
    function updateRewardPeriodParams(
        uint256 _newRewardPeriodSize,
        uint256 _newDecayNumerator,
        uint256 _newDecayDenominator
    ) external;
    function updateFirstRewardPeriodParams(
        uint256 _startingBlock,
        uint256 _firstRewardPerBlock
    ) external;
    function updateTreasury(ITreasury _newTreasury) external;
    function donate(uint256 _amount) external;
    function donateToCommunity(ICommunity _community, uint256 _amount) external;
    function claimRewards() external;
    function calculateClaimableRewards(address _donor) external returns (uint256);
    function estimateClaimableReward(address _donor) external view returns (uint256);
    function transfer(IERC20 _token, address _to, uint256 _amount) external;
}
