// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.4;

interface IOwnable {
    function owner() external view virtual returns (address);
}
