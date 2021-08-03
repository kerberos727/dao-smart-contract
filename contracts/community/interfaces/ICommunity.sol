// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.5;

interface ICommunity {
    function claimAmount() external view returns(uint256);
    function baseInterval() external view returns(uint256);
    function incrementInterval() external view returns(uint256);
    function maxClaim() external view returns(uint256);
    function previousCommunityContract() external view returns(address);
    function hasRole(bytes32 role, address account) external view returns(bool);
    function migrateFunds(address _newCommunity, address _newCommunityManager) external;
    function validBeneficiaries() external view returns(uint);
    function validBeneficiariesClaims() external view returns(uint);
}
