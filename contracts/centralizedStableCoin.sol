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

    event Blacklisted(address indexed _account);
    event UnBlacklisted(address indexed _account);
    event MinterConfigured(address indexed minter, uint256 indexed minterAllowed);
    event MinterRemoved(address indexed oldMinter);
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

    function mint(
        address _to,
        uint256 _amount
    ) external onlyminters notBlacklisted(msg.sender) notBlacklisted(_to) returns (bool) {
        require(_to != address(0), "not address zero");
        require(_amount > 0, "amount should be more than zero");
        uint256 mintingAllowed = s_mintersAllowed[msg.sender];
        require(_amount <= mintingAllowed, "amount exceeded");
        s_mintersAllowed[msg.sender] = mintingAllowed - _amount;
        _mint(msg.sender, mintingAllowed);
        return true;
    }

    function burn(uint256 _amount) public override onlyminters notBlacklisted(msg.sender) {
        require(_amount > 0, "amount should be more than zero");
        uint256 balance = balanceOf(msg.sender);
        require(balance >= _amount, "burn amount exceeds balance");
        _burn(_msgSender(), _amount);
    }

    /*******minter settings**************** */
    function configureMinter(
        address minter,
        uint256 minterAllowed
    ) external onlyOwner returns (bool) {
        s_minters[minter] = true;
        s_mintersAllowed[minter] = minterAllowed;
        emit MinterConfigured(minter, minterAllowed);
        return true;
    }

    function removeMinter(address minter) external onlyOwner returns (bool) {
        s_minters[minter] = false;
        s_mintersAllowed[minter] = 0;
        emit MinterRemoved(minter);
        return true;
    }

    //*****blacklisting functions*****/
    function isBlacklisted(address _account) external view returns (bool) {
        return s_blacklisted[_account];
    }

    function blacklist(address _account) external onlyOwner {
        s_blacklisted[_account] = true;
        emit Blacklisted(_account);
    }

    function unBlacklist(address _account) external onlyOwner {
        s_blacklisted[_account] = false;
        emit UnBlacklisted(_account);
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
