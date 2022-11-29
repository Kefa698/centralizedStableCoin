// SPDX-License-Identifier: MIT

// This is considered an exogenous, centralized, anchored (pegged), fiat collateralized, low volitility coin

// Collateral: Exogenous
// Minting: Centralized
// Value: Anchored (Pegged to USD)
// Collateral Type: Fiat

// Also sometimes just refered to as "Fiat Collateralized Stablecoin"
// But maybe a better name would be "FiatCoin"

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
pragma solidity ^0.8.7;

contract centralizedStableCoin is ERC20Burnable, Ownable {
    mapping(address => bool) internal s_blacklisted;
    mapping(address => bool) internal s_minters;
    mapping(address => uint256) internal s_mintersAllowed;

    ////modifiers
    modifier onlyminters() {
        require(s_minters[msg.sender], "not minter");
        _;
    }
    modifier notBlacklisted(address addressToCheck) {
        require(!s_blacklisted[addressToCheck], "blacklisted");
        _;
    }

    constructor(uint initialSupply) ERC20("CentralizedStableCoin", "CSC") {
        _mint(msg.sender, initialSupply);
    }

    //backlisting overrides
    function approve(
        address spender,
        uint256 value
    ) public override notBlacklisted(msg.sender) notBlacklisted(spender) returns (bool) {
        super.approve(spender, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    )
        public
        override
        notBlacklisted(msg.sender)
        notBlacklisted(from)
        notBlacklisted(to)
        returns (bool)
    {
        super.transferFrom(from, to, value);
        return true;
    }

    function transfer(
        address to,
        uint256 value
    ) public override notBlacklisted(msg.sender) notBlacklisted(to) returns (bool) {
        super.transfer(msg.sender, value);
        return true;
    }
}
