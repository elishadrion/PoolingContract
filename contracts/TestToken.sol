pragma solidity ^0.7.4;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';


contract TestToken is ERC20 {

    uint256 constant SUPPLY  = (10**6) * (10**18);

    constructor(uint256 _supply) public ERC20("TEST", "TST") {
        if (_supply == 0) {
            _supply = SUPPLY;
        }
        _mint(msg.sender, _supply);
    }

}
