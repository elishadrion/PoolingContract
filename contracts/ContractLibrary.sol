pragma solidity ^0.7.4;

import './SafeMath.sol';
import './IERC20.sol';

library ContractLibrary {

  //EVENTS
  //============================
  event BuyTheTokens(address indexed sale, uint256 indexed amount, bytes data);
  event Contribution(address indexed contributor, uint256 indexed balance, uint256 indexed contract_balance);
  event Withdraw(address indexed contributor, uint256 indexed amount);
  event Refund(address indexed contributor, uint256 indexed amount, uint256 indexed contract_balance);
  event TokensReceived(uint256 indexed amount, uint256 indexed rounds);
  //============================

	using SafeMath for uint256;

	struct Contributor {
		uint256 balance;
	    uint256 rounds;
        bool whitelisted;
  	}

	struct Snapshot {
		uint256 tokens_balance;
		uint256 currency_balance;
	}

    struct ContractConfig {
        address sale;
		address owner;
		IERC20 token;
		IERC20 payableERC20;
		uint owner_fee;
        uint max_amount;
		uint max_individual_cap;
        uint min_individual_cap;
        bool is_distributing;
        bool using_whitelist;
    }

    struct ContractStats {
        uint const_currency_balance;
		uint rounds;
        Snapshot snapshot;
		bool bought_tokens;
		mapping (address => Contributor) contributors;
        address[] addresses;
    }

  	modifier underMaxAmount(ContractConfig storage config) {
        uint256 balance = usingPayableERC20(config) ? config.payableERC20.balanceOf(address(this)) : address(this).balance;
    	require(config.max_amount == 0 || balance <= config.max_amount, "POOL CAP REACHED");
        _;
  	}

	modifier onlyOwner(ContractConfig storage config) {
		require(msg.sender == config.owner, "Not the owner");
        _;
	}

	//FEES RELATED
	//============================
	address constant public DEVELOPER = 0xe31Bd1e474e64E03505Fe776c737926bC8aaBEA9;
	uint256 constant public FEE_DEV = 50; //0.5% fee in total
	//============================
	//
	//
	string constant public VERSION = "1.0.0";

  //###############################################################################################################################



	//OWNER FUNCTIONS
	//============================

	// Buy the tokens. Sends ETH to the presale wallet and records the ETH amount held in the contract.
	function buy_the_tokens(
        ContractConfig storage config,
        ContractStats storage stats,
        bytes memory _data) onlyOwner(config) public {
		//Avoids burning the funds
		require(!stats.bought_tokens, "BUY_TOKENS: TOKENS ALREADY BOUGHT");
		require(config.sale != address(0x0), "BUY_TOKENS: RECIPIENT CANT BE 0X0");
		bool isUsingPayable = usingPayableERC20(config);
		//Record that the contract has bought the tokens.
		uint256 currency_balance = isUsingPayable ? config.payableERC20.balanceOf(address(this)) : address(this).balance;
		stats.const_currency_balance = currency_balance;
		stats.bought_tokens = true;
		_take_fees_dev(config, currency_balance);
		_take_fees_owner(config, currency_balance);
		uint256 to_send = isUsingPayable ? config.payableERC20.balanceOf(address(this)) : address(this).balance;
		if (isUsingPayable) {
			require(config.payableERC20.transfer(config.sale, to_send),"BUY_TOKENS: ERC20 TRANSFER FAILED");
			emit BuyTheTokens(config.sale, currency_balance, _data);
			return;
		}
		// Transfer all the funds to the crowdsale address.
		(bool success, ) = config.sale.call{value:to_send, gas:gasleft()}(_data);
        require(success, "BUY_TOKENS: ETH TRANSFER FAILED");
		emit BuyTheTokens(config.sale, currency_balance, _data);
	}

	function set_sale_address(
        ContractStats storage stats,
        ContractConfig storage config,
        address _sale) onlyOwner(config) public {
		//Avoid mistake of putting 0x0
		require(_sale != address(0x0), "SET_SALE_ADDRESS: CANT BE 0x0 ADDRESS");
		require(!stats.bought_tokens, "SET_SALE_ADDRESS: FUNDS ALREADY SENT");
		config.sale = _sale;
	}

	function set_token_address(ContractConfig storage config, address _token) onlyOwner(config) public {
		require(_token != address(0x0), "SET_TOKEN_ADDRESS: CANT BE 0x0 ADDRESS");
		config.token = IERC20(_token);
	}

	function set_tokens_received(
        ContractStats storage stats,
        ContractConfig storage config) onlyOwner(config) public {
		_tokens_received(stats, config);
	}

	function change_max_individual_cap(ContractConfig storage config, uint256 _cap) onlyOwner(config) public {
		config.max_individual_cap = _cap;
	}

    function change_min_individual_cap(ContractConfig storage config, uint256 _cap) onlyOwner(config) public {
		config.min_individual_cap = _cap;
	}

	function change_max_amount(ContractConfig storage config, uint256 _amount) onlyOwner(config) public {
		//ATTENTION! The new amount should be in wei
		//Use https://etherconverter.online/
		//self.max_amount = _calculate_with_fees(self, _amount);
		config.max_amount = _amount;
	}

	function force_refund(
        ContractStats storage stats,
        ContractConfig storage config, address _addy) onlyOwner(config) public {
            Contributor memory contributor = stats.contributors[_addy];
            _refund(stats, config, contributor.balance, _addy);
	}

    function whitelist(
        ContractStats storage stats,
        ContractConfig storage config,
        address[] memory _to_whitelist
        ) onlyOwner(config) public {

            for(uint i = 0; i < _to_whitelist.length; i++) {
                Contributor storage contributor = stats.contributors[_to_whitelist[i]];
                contributor.whitelisted = true;
            }
    }

    function blacklist(
        ContractStats storage stats,
        ContractConfig storage config,
        address[] memory _to_blacklist
        ) onlyOwner(config) public {

            for(uint i = 0; i < _to_blacklist.length; i++) {
                Contributor storage contributor = stats.contributors[_to_blacklist[i]];
                contributor.whitelisted = false;
            }
    }

    function enable_whitelist(
        ContractConfig storage config,
        bool enable
        ) onlyOwner(config) public {
            config.using_whitelist = enable;
    }

	function emergency_token_withdraw(ContractConfig storage config, address _address) onlyOwner(config) public {
	 	IERC20 temp_token = IERC20(_address);
		require(temp_token.transfer(config.owner, temp_token.balanceOf(address(this))));
	}

	function emergency_eth_withdraw(ContractConfig storage config) onlyOwner(config) public {
		payable(config.owner).transfer(address(this).balance);
	}

//###############################################################################################################################


	//INTERNAL FUNCTIONS
	//============================
	// Allows any user to withdraw his tokens.
	function _withdraw(
        ContractStats storage stats,
        ContractConfig storage config,
        address _user) internal {
		// Disallow withdraw if tokens haven't been bought yet.
		require(stats.bought_tokens, "WITHDRAW: TOKENS NOT BOUGHT");
		uint256 contract_token_balance = config.token.balanceOf(address(this));
		// Disallow token withdrawals if there are no tokens to withdraw.
		//require(contract_token_balance != 0, "WITHDRAW: NO TOKENS AVAILABLE");
        if (contract_token_balance == 0) {
            emit Withdraw(_user, 0);
            return;
        }
		Contributor storage contributor = stats.contributors[_user];
		Snapshot storage snapshot = stats.snapshot;
        uint256 balance_multiplied = (stats.rounds.sub(contributor.rounds)).mul(contributor.balance);
		uint256 to_withdraw = balance_multiplied.mul(snapshot.tokens_balance).div(snapshot.currency_balance);
		contributor.rounds = stats.rounds;
		snapshot.tokens_balance = snapshot.tokens_balance.sub(to_withdraw);
		snapshot.currency_balance = snapshot.currency_balance.sub(balance_multiplied);
		// Send the funds.  Throws on failure to prevent loss of funds.
		require(config.token.transfer(_user, to_withdraw), "WITHDRAW: TOKEN TRANSFER FAILED");
		emit Withdraw(_user, to_withdraw);
	}

	// Allows any user to get his eth refunded before the purchase is made.
	function _refund(
        ContractStats storage stats,
        ContractConfig storage config,
        uint256 _amount_to_withdraw,
        address _user) internal {
		require(!stats.bought_tokens, "REFUND: SALE ENDED");
		Contributor storage contributor = stats.contributors[_user];
		// Update the user's balance prior to sending ETH to prevent recursive call.
        contributor.balance = contributor.balance.sub(_amount_to_withdraw);
		if (usingPayableERC20(config)) {
			require(config.payableERC20.transfer(_user, _amount_to_withdraw), "REFUND: TRANSFER FAILED");
			emit Refund(_user, _amount_to_withdraw, config.payableERC20.balanceOf(address(this)));
			return;
		}
		// Return the user's funds.  Throws on failure to prevent loss of funds.
        (bool success, ) = _user.call{value:_amount_to_withdraw}("");
        require(success, "REFUND: TRANSFER FAILED");
		emit Refund(_user, contributor.balance, address(this).balance);
	}

	function _take_fees_dev(ContractConfig storage config, uint256 currency_balance) internal {
		if (FEE_DEV != 0) {
			uint256 fee = currency_balance.mul(FEE_DEV).div(10000);
			if (usingPayableERC20(config)) {
				config.payableERC20.transfer(DEVELOPER, fee);
				return;
			}
			payable(DEVELOPER).transfer(fee);
		}
	}

	function _take_fees_owner(ContractConfig storage config, uint256 currency_balance) internal {
	//Owner takes fees on the ETH in this case
	//In case owner doesn't want to take fees
        if (config.owner_fee != 0) {
			uint256 fee = currency_balance.mul(config.owner_fee).div(10000);
			if (usingPayableERC20(config)) {
				config.payableERC20.transfer(config.owner, fee);
				return;
			}
			payable(config.owner).transfer(fee);
		}
	}

	function _tokens_received(
        ContractStats storage stats,
        ContractConfig storage config) internal {
		require(stats.bought_tokens, "TOKENS_RECEIVED: NOT TOKENS BOUGHT");
		Snapshot storage snapshot = stats.snapshot;
		stats.snapshot.currency_balance = stats.snapshot.currency_balance.add(stats.const_currency_balance);
		uint256 balance_diff = config.token.balanceOf(address(this)).sub(stats.snapshot.tokens_balance);
		stats.snapshot.tokens_balance = config.token.balanceOf(address(this));
		stats.rounds++;
		emit TokensReceived(balance_diff, stats.rounds);
	}

	function usingPayableERC20(ContractConfig storage config) view internal returns (bool) {
		return config.payableERC20 != IERC20(address(0x0));
	}


//###############################################################################################################################

  //PUBLIC FUNCTIONS
  //============================
  //
  //
  	function leftover_tokens(ContractStats storage stats, address _user) view public returns (uint256 tokens_to_withdraw) {
		Contributor memory contributor = stats.contributors[_user];
        Snapshot memory snapshot = stats.snapshot;
        uint256 balance_multiplied = (stats.rounds.sub(contributor.rounds)).mul(contributor.balance);
		tokens_to_withdraw = balance_multiplied.mul(snapshot.tokens_balance).div(snapshot.currency_balance);
	}

	function tokenFallback(
        ContractStats storage stats,
        ContractConfig storage config, address _from, uint _value, bytes memory _data) public {
		if (IERC20(msg.sender) == config.token) {
			_tokens_received(stats, config);
		}
	}

	function withdraw(
        ContractStats storage stats,
        ContractConfig storage config) public {
		_withdraw(stats, config, msg.sender);
	}

	function withdraw_for(
        ContractStats storage stats,
        ContractConfig storage config, address _for) public {
		_withdraw(stats, config, _for);
	}

	function refund(
        ContractStats storage stats,
        ContractConfig storage config,
        uint256 _amount) public {
		_refund(stats, config, _amount, msg.sender);
	}

	function distribute(
        ContractStats storage stats,
        ContractConfig storage config, uint _from, uint _to) public {
        for(uint i = _from; i < _to && i < stats.addresses.length; i++) {
            _withdraw(stats, config, stats.addresses[i]);
        }
	}

	function pay(
        ContractStats storage stats,
        ContractConfig storage config, uint256 _amount) underMaxAmount(config) public
        {
		require(!stats.bought_tokens, "PAY: SALE ENDED");
		//can't send eth if contract uses a payable ERC20
		if (usingPayableERC20(config) && msg.value > 0) revert("PAY: USING PAYABLE ERC20");

		Contributor storage contributor = stats.contributors[msg.sender];
        //whitelist check
        require(!config.using_whitelist || contributor.whitelisted, "PAY: NOT WHITELISTED");
		uint256 contribution = _amount == 0 ? msg.value: _amount;
		contributor.balance = contributor.balance.add(contribution);
        require(contributor.balance >= config.min_individual_cap, "PAY: UNDER MIN INDIVIDUAL CAP");

        if (config.is_distributing) stats.addresses.push(msg.sender);

		//Checks if the individual cap is respected
		require(config.max_individual_cap == 0 || contributor.balance <= config.max_individual_cap, "PAY: OVER MAX INDIVIDUAL CAP");
		if (usingPayableERC20(config)) {
			require(config.payableERC20.transferFrom(msg.sender, address(this), _amount), "PAY: ERC20 TRANSFERFROM FAILED");
			emit Contribution(msg.sender, contributor.balance, config.payableERC20.balanceOf(address(this)));
			return;
		}
		emit Contribution(msg.sender, contributor.balance, address(this).balance);
	}
}
