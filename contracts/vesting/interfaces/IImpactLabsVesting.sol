//SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.4;

import {IERC20Upgradeable as IERC20} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../../community/interfaces/ICommunityAdmin.sol";
import "../../treasury/interfaces/ITreasury.sol";
import "../../donationMiner/interfaces/IDonationMiner.sol";

interface IImpactLabsVesting {
    function getVersion() external pure returns (uint256);
    function impactLabs() external view returns (address);
    function PACT() external view returns (IERC20);
    function donationMiner() external view returns (IDonationMiner);
    function nextRewardPeriod() external view returns (uint256);
    function advancePayment() external view returns (uint256);
    function updateImpactLabs(address _impactLabs) external;
    function claim() external;
    function transfer(IERC20 _token, address _to, uint256 _amount) external;
}
