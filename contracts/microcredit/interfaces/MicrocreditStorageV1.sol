// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.4;

import "./IMicrocredit.sol";

/**
 * @title Storage for Microcredit
 * @notice For future upgrades, do not change MicrocreditStorageV1. Create a new
 * contract which implements MicrocreditStorageV1 and following the naming convention
 * MicrocreditStorageVx.
 */
abstract contract MicrocreditStorageV1 is IMicrocredit {
    IERC20 public override cUSD;

    uint256 internal  _usersLength;
    mapping(uint256 => UserOld) internal _usersOld;

    mapping(address => WalletMetadata) internal _walletMetadata;
    EnumerableSet.AddressSet internal _walletList;
    EnumerableSet.AddressSet internal _managerList;
    address public override revenueAddress;

    mapping(address => Manager) internal _managers;

    IDonationMiner public override donationMiner;

    mapping(uint256 => User) internal _users;

    mapping(address => Token) internal _tokens;
    EnumerableSet.AddressSet internal _tokenList;

    IUniswapRouter02 public override uniswapRouter;
    IQuoter public override uniswapQuoter;

    IMicrocreditManager public override microcreditManager;

    EnumerableSet.AddressSet internal _maintainerList;
}
