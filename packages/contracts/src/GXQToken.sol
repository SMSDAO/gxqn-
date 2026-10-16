// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GXQToken
 * @dev Native Utility & Governance Token for GXQ Network V3.0.0
 * Features: ERC20 compliant, mintable by owner, burning capabilities, emergency pause
 */
contract GXQToken {
    string public name = "GXQ Network Token";
    string public symbol = "GXQ";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public owner;
    bool public paused;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);

    modifier onlyOwner() {
        require(msg.sender == owner, "GXQ: caller is not the owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "GXQ: token transfer is paused");
        _;
    }

    constructor(uint256 initialSupply) {
        owner = msg.sender;
        _mint(msg.sender, initialSupply);
    }

    function transfer(address to, uint256 amount) external whenNotPaused returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external whenNotPaused returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "GXQ: insufficient allowance");
        unchecked {
            allowance[from][msg.sender] = currentAllowance - amount;
        }
        _transfer(from, to, amount);
        return true;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external whenNotPaused {
        _burn(msg.sender, amount);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        if (_paused) emit Paused(msg.sender);
        else emit Unpaused(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "GXQ: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "GXQ: transfer from the zero address");
        require(to != address(0), "GXQ: transfer to the zero address");
        require(balanceOf[from] >= amount, "GXQ: transfer amount exceeds balance");

        unchecked {
            balanceOf[from] -= amount;
            balanceOf[to] += amount;
        }
        emit Transfer(from, to, amount);
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "GXQ: mint to the zero address");
        totalSupply += amount;
        unchecked {
            balanceOf[account] += amount;
        }
        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(account != address(0), "GXQ: burn from the zero address");
        require(balanceOf[account] >= amount, "GXQ: burn amount exceeds balance");
        unchecked {
            balanceOf[account] -= amount;
            totalSupply -= amount;
        }
        emit Transfer(account, address(0), amount);
    }
}
