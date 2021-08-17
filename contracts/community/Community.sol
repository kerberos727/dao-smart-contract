// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.5;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ICommunity.sol";
import "./interfaces/ICommunityAdmin.sol";

import "hardhat/console.sol";

/**
 * @notice Welcome to the Community contract. For each community
 * there will be one contract like this being deployed by
 * CommunityAdmin contract. This enable us to save tokens on the
 * contract itself, and avoid the problems of having everything
 * in one single contract. Each community has it's own members and
 * and managers.
 */
contract Community is AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    uint256 public constant DEFAULT_AMOUNT = 5e16;

    enum BeneficiaryState {
        NONE,
        Valid,
        Locked,
        Removed,
        MaxClaimed
    } // starts by 0 (when user is not added yet)

    mapping(address => uint256) public cooldown;
    mapping(address => uint256) public claimed;
    mapping(address => uint256) public claims;
    mapping(address => BeneficiaryState) public beneficiaries;
    address[] public beneficiariesList;

    uint256 public claimAmount;
    uint256 public baseInterval;
    uint256 public incrementInterval;
    uint256 public maxClaim;
    uint256 public validBeneficiaryCount;
    uint256 public governanceDonations;
    uint256 public privateDonations;

    address public previousCommunityContract;
    address public communityAdminAddress;
    address public cUSDAddress;
    bool public locked;

    event ManagerAdded(address indexed _account);
    event ManagerRemoved(address indexed _account);
    event BeneficiaryAdded(address indexed _account);
    event BeneficiaryLocked(address indexed _account);
    event BeneficiaryUnlocked(address indexed _account);
    event BeneficiaryRemoved(address indexed _account);
    event BeneficiaryClaim(address indexed _account, uint256 _amount);
    event CommunityEdited(
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementInterval
    );
    event CommunityLocked(address indexed _by);
    event CommunityUnlocked(address indexed _by);
    event MigratedFunds(address indexed _to, uint256 _amount);

    /**
     * @dev Constructor with custom fields, choosen by the community.
     * @param _firstManager Comminuty's first manager. Will
     * be able to add others.
     * @param _claimAmount Base amount to be claim by the benificiary.
     * @param _maxClaim Limit that a beneficiary can claim at once.
     * @param _baseInterval Base interval to start claiming.
     * @param _incrementInterval Increment interval used in each claim.
     * @param _previousCommunityContract previous smart contract address of community.
     * @param _cUSDAddress cUSD smart contract address.
     */
    constructor(
        address _firstManager,
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementInterval,
        address _previousCommunityContract,
        address _cUSDAddress,
        address _communityAdminAddress
    ) {
        require(_baseInterval > _incrementInterval, "");
        require(_maxClaim > _claimAmount, "");

        _setupRole(MANAGER_ROLE, _firstManager);
        _setRoleAdmin(MANAGER_ROLE, MANAGER_ROLE);
        emit ManagerAdded(_firstManager);

        claimAmount = _claimAmount;
        baseInterval = _baseInterval;
        incrementInterval = _incrementInterval;
        maxClaim = _maxClaim;

        previousCommunityContract = _previousCommunityContract;
        cUSDAddress = _cUSDAddress;
        communityAdminAddress = _communityAdminAddress;
        locked = false;
    }

    modifier onlyValidBeneficiary() {
        require(
            beneficiaries[msg.sender] == BeneficiaryState.Valid,
            "Community: NOT_VALID_BENEFICIARY"
        );
        _;
    }

    modifier onlyManagers() {
        require(hasRole(MANAGER_ROLE, msg.sender), "Community: NOT_MANAGER");
        _;
    }

    modifier onlyCommunityAdmin() {
        require(msg.sender == communityAdminAddress, "Community: NOT_ALLOWED");
        _;
    }

    /**
     * @dev Allow community managers to add other managers.
     */
    function addManager(address _account) external onlyManagers {
        grantRole(MANAGER_ROLE, _account);
        emit ManagerAdded(_account);
    }

    /**
     * @dev Allow community managers to remove other managers.
     */
    function removeManager(address _account) external onlyManagers {
        revokeRole(MANAGER_ROLE, _account);
        emit ManagerRemoved(_account);
    }

    /**
     * @dev Allow community managers to add beneficiaries.
     */
    function addBeneficiary(address _account) external onlyManagers {
        require(
            beneficiaries[_account] == BeneficiaryState.NONE,
            "Community::addBeneficiary: NOT_YET"
        );
        changeBeneficiaryState(_account, BeneficiaryState.Valid);
        // solhint-disable-next-line not-rely-on-time
        cooldown[_account] = block.timestamp;
        claims[_account] = 0;
        beneficiariesList.push(_account);
        // send default amount when adding a new beneficiary
        bool success = IERC20(cUSDAddress).transfer(_account, DEFAULT_AMOUNT);
        require(success, "Community::addBeneficiary: NOT_ALLOWED");
        emit BeneficiaryAdded(_account);
    }

    /**
     * @dev Allow community managers to lock beneficiaries.
     */
    function lockBeneficiary(address _account) external onlyManagers {
        require(
            beneficiaries[_account] == BeneficiaryState.Valid,
            "Community::lockBeneficiary: NOT_YET"
        );
        changeBeneficiaryState(_account, BeneficiaryState.Locked);
        emit BeneficiaryLocked(_account);
    }

    /**
     * @dev Allow community managers to unlock locked beneficiaries.
     */
    function unlockBeneficiary(address _account) external onlyManagers {
        require(
            beneficiaries[_account] == BeneficiaryState.Locked,
            "Community::unlockBeneficiary: NOT_YET"
        );
        changeBeneficiaryState(_account, BeneficiaryState.Valid);
        emit BeneficiaryUnlocked(_account);
    }

    /**
     * @dev Allow community managers to remove beneficiaries.
     */
    function removeBeneficiary(address _account) external onlyManagers {
        require(
            beneficiaries[_account] == BeneficiaryState.Valid ||
                beneficiaries[_account] == BeneficiaryState.Locked,
            "Community::removeBeneficiary: NOT_YET"
        );
        changeBeneficiaryState(_account, BeneficiaryState.Removed);
        emit BeneficiaryRemoved(_account);
    }

    /**
     * @dev Allow beneficiaries to claim.
     */
    function claim() external onlyValidBeneficiary {
        require(!locked, "LOCKED");
        // solhint-disable-next-line not-rely-on-time
        require(cooldown[msg.sender] <= block.timestamp, "Community::claim: NOT_YET");
        require((claimed[msg.sender] + claimAmount) <= maxClaim, "Community::claim: MAX_CLAIM");
        claimed[msg.sender] = claimed[msg.sender] + claimAmount;

        claims[msg.sender] += 1;
        cooldown[msg.sender] = uint256(block.timestamp + lastInterval(msg.sender));

        bool success = IERC20(cUSDAddress).transfer(msg.sender, claimAmount);
        require(success, "Community::claim: NOT_ALLOWED");
        emit BeneficiaryClaim(msg.sender, claimAmount);
    }

    function lastInterval(address _beneficiary) public view returns (uint256) {
        if (claims[_beneficiary] == 0) {
            return 0;
        }
        return baseInterval + (claims[_beneficiary] - 1) * incrementInterval;
    }

    /**
     * @dev Allow community managers to edit community variables.
     */
    function edit(
        uint256 _claimAmount,
        uint256 _maxClaim,
        uint256 _baseInterval,
        uint256 _incrementInterval
    ) external onlyManagers {
        require(_baseInterval > _incrementInterval, "");
        require(_maxClaim > _claimAmount, "");

        claimAmount = _claimAmount;
        baseInterval = _baseInterval;
        incrementInterval = _incrementInterval;
        maxClaim = _maxClaim;

        emit CommunityEdited(_claimAmount, _maxClaim, _baseInterval, _incrementInterval);
    }

    /**
     * Allow community managers to lock community claims.
     */
    function lock() external onlyManagers {
        locked = true;
        emit CommunityLocked(msg.sender);
    }

    /**
     * Allow community managers to unlock community claims.
     */
    function unlock() external onlyManagers {
        locked = false;
        emit CommunityUnlocked(msg.sender);
    }

    function requestFunds() external onlyManagers {
        ICommunityAdmin communityAdminInstance = ICommunityAdmin(communityAdminAddress);
        communityAdminInstance.fundCommunity();
    }

    /**
     * Migrate funds in current community to new one.
     */
    function migrateFunds(address _newCommunity, address _newCommunityManager)
        external
        onlyCommunityAdmin
    {
        ICommunity newCommunity = ICommunity(_newCommunity);
        require(
            newCommunity.hasRole(MANAGER_ROLE, _newCommunityManager) == true,
            "Community::migrateFunds: NOT_ALLOWED"
        );
        require(
            newCommunity.previousCommunityContract() == address(this),
            "Community::migrateFunds: NOT_ALLOWED"
        );
        uint256 balance = IERC20(cUSDAddress).balanceOf(address(this));
        bool success = IERC20(cUSDAddress).transfer(_newCommunity, balance);
        require(success, "Community::migrateFunds: NOT_ALLOWED");
        emit MigratedFunds(_newCommunity, balance);
    }

    function changeBeneficiaryState(address beneficiary, BeneficiaryState _newState) internal {
        if (beneficiaries[beneficiary] == _newState) {
            return;
        }

        beneficiaries[beneficiary] = _newState;

        (_newState == BeneficiaryState.Valid) ? validBeneficiaryCount++ : validBeneficiaryCount--;
    }
}
