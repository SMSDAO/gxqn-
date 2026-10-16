// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GXQToken.sol";

/**
 * @title GXQStaking
 * @dev Staking rewards vault for GXQ Network V3.0.0 validators and delegators
 * Dynamic APY tiers, lock durations, and claimable reward distribution
 */
contract GXQStaking {
    struct StakePosition {
        uint256 amount;
        uint256 startTime;
        uint256 lockDuration;
        uint256 rewardDebt;
        uint256 multiplierBps; // e.g. 10000 = 1x, 15000 = 1.5x for locked
    }

    address public gxqToken;
    address public owner;
    uint256 public baseAprBps = 1480; // 14.80% base APR
    uint256 public totalStaked;

    mapping(address => StakePosition[]) public stakes;

    event Staked(address indexed user, uint256 index, uint256 amount, uint256 lockDuration);
    event Withdrawn(address indexed user, uint256 index, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed user, uint256 index, uint256 reward);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _gxqToken) {
        gxqToken = _gxqToken;
        owner = msg.sender;
    }

    function stake(uint256 amount, uint256 lockDuration) external {
        require(amount > 0, "Cannot stake 0");
        GXQToken(gxqToken).transferFrom(msg.sender, address(this), amount);

        uint256 multiplier = 10000;
        if (lockDuration >= 365 days) {
            multiplier = 20000; // 2x for 1 year
        } else if (lockDuration >= 90 days) {
            multiplier = 15000; // 1.5x for 90 days
        } else if (lockDuration >= 30 days) {
            multiplier = 12000; // 1.2x for 30 days
        }

        stakes[msg.sender].push(StakePosition({
            amount: amount,
            startTime: block.timestamp,
            lockDuration: lockDuration,
            rewardDebt: 0,
            multiplierBps: multiplier
        }));

        totalStaked += amount;
        emit Staked(msg.sender, stakes[msg.sender].length - 1, amount, lockDuration);
    }

    function calculateReward(address user, uint256 index) public view returns (uint256) {
        require(index < stakes[user].length, "Invalid stake index");
        StakePosition memory pos = stakes[user][index];
        uint256 elapsed = block.timestamp - pos.startTime;
        
        // reward = amount * (baseAprBps * multiplier / 10000) * elapsed / (365 days * 10000)
        uint256 effectiveAprBps = (baseAprBps * pos.multiplierBps) / 10000;
        uint256 totalReward = (pos.amount * effectiveAprBps * elapsed) / (365 days * 10000);
        
        if (totalReward > pos.rewardDebt) {
            return totalReward - pos.rewardDebt;
        }
        return 0;
    }

    function claimReward(uint256 index) external {
        uint256 reward = calculateReward(msg.sender, index);
        require(reward > 0, "No reward to claim");

        stakes[msg.sender][index].rewardDebt += reward;
        GXQToken(gxqToken).transfer(msg.sender, reward);

        emit RewardClaimed(msg.sender, index, reward);
    }

    function withdraw(uint256 index) external {
        require(index < stakes[msg.sender].length, "Invalid index");
        StakePosition memory pos = stakes[msg.sender][index];
        require(block.timestamp >= pos.startTime + pos.lockDuration, "Lock duration not expired");

        uint256 reward = calculateReward(msg.sender, index);
        uint256 amount = pos.amount;

        totalStaked -= amount;
        
        // Remove stake position by swapping with last
        uint256 lastIdx = stakes[msg.sender].length - 1;
        if (index != lastIdx) {
            stakes[msg.sender][index] = stakes[msg.sender][lastIdx];
        }
        stakes[msg.sender].pop();

        GXQToken(gxqToken).transfer(msg.sender, amount);
        if (reward > 0) {
            GXQToken(gxqToken).transfer(msg.sender, reward);
        }

        emit Withdrawn(msg.sender, index, amount, reward);
    }

    function getUserStakes(address user) external view returns (StakePosition[] memory) {
        return stakes[user];
    }
}
