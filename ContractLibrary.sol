pragma solidity ^0.4.23;

//--------- OpenZeppelin's Safe Math
//Source : https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/math/SafeMath.sol
/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {
  	function mul(uint256 a, uint256 b) internal pure returns (uint256) {
		if (a == 0) {
		return 0;
		}
		uint256 c = a * b;
		assert(c / a == b);
		return c;
	}

  	function div(uint256 a, uint256 b) internal pure returns (uint256) {
    	uint256 c = a / b;
    	return c;
  	}

  	function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    	assert(b <= a);
    	return a - b;
  	}

  	function add(uint256 a, uint256 b) internal pure returns (uint256) {
    	uint256 c = a + b;
    	assert(c >= a);
    	return c;
  	}
}
//-----------------------------------------------------B


//"EXTERN" CONTRACTS
//============================
// ERC20 Interface: https://github.com/ethereum/EIPs/issues/20
contract ERC20 {
  	function transfer(address _to, uint256 _value) public returns (bool success);
  	function balanceOf(address _owner) public constant returns (uint256 balance);
}

//============================

library ContractLibrary {

	using SafeMath for uint256;

	struct Contributor {
		uint256 balance;
	    uint256 fee_owner;
	    uint8 rounds;
	    bool whitelisted;
  	}

	struct Snapshot {
		uint256 tokens_balance;
		uint256 eth_balance;
	}

	struct ContractPool {
		address sale;
		address owner;
		ERC20 token;
		//Since per struct, we are limited to 16 variables by Solidity, we are using an array for integers
		//to save space for other variables if needed
		// index 0 : FEE    				  : value as divisor (ie. 1 / FEE_OWNER = % Rate) or (1 / 200 = 0.4%)
		// index 1 : max_amount
		// index 2 : individual_cap
		// index 3 : gas_price_max
		// index 4 : const_contract_eth_value : Record ETH value of tokens currently held by contract.
		// index 5 : percent_reduction 	      : The reduction of the allocation in % | example : 40 -> 40% reduction
		// index 6 : fees
		// index 7 : rounds
		uint256[] integer_variables;
		// index 0 : bought_tokens
		// index 1 : whitelist_enabled
		// index 2 : allow_contributions
		// index 3 : refund_fees		     : tracks if owner refunds his fees for partial_refund
		bool[] bool_variables;
		mapping (address => Contributor) contributors;
		//First element will be the first wave of tokens, and so forth
		Snapshot[] snapshots;
	}

  	function underMaxAmount(ContractPool storage self) {
    	require(self.integer_variables[1] == 0 || this.balance <= self.integer_variables[1]);
  	}

	function onlyOwner(ContractPool storage self) {
		require(msg.sender == self.owner);
	}

  //###############################################################################################################################


	//OWNER FUNCTIONS
	//============================

	// Buy the tokens. Sends ETH to the presale wallet and records the ETH amount held in the contract.
	function buy_the_tokens(ContractPool storage self, bytes _data) {
		onlyOwner(self);
		//Avoids burning the funds
		require(!self.bool_variables[0] && self.sale != 0x0);
		//Record that the contract has bought the tokens.
		self.bool_variables[0] = true;
		self.integer_variables[4] = this.balance;
		take_fees_eth_owner(self);
        //Records the quantity of ETH sent
		self.integer_variables[4] = this.balance;
		// Transfer all the funds to the crowdsale address.
		require(self.sale.call.gas(msg.gas).value(this.balance)(_data));
	}

	//These two functions concern the "temporary" whitelist
	function whitelist_addys(ContractPool storage self, address[] _addys, bool _state) {
		onlyOwner(self);
		for (uint256 i = 0; i < _addys.length; i++) {
			Contributor storage contributor = self.contributors[_addys[i]];
			contributor.whitelisted = _state;
		}
	}

	function set_gas_price_max(ContractPool storage self, uint256 _gas_price) {
		onlyOwner(self);
		self.integer_variables[3] = _gas_price;
	}

	function set_sale_address(ContractPool storage self, address _sale) {
		onlyOwner(self);
		//Avoid mistake of putting 0x0
		require(_sale != 0x0);
		self.sale = _sale;
	}

	function set_token_address(ContractPool storage self, address _token) {
		onlyOwner(self);
		require(_token != 0x0);
		self.token = ERC20(_token);
	}

	function set_allow_contributions(ContractPool storage self, bool _boolean) {
		onlyOwner(self);
		self.bool_variables[2] = _boolean;
	}

	function set_tokens_received(ContractPool storage self) {
		onlyOwner(self);
		tokens_received(self);
	}

	function set_percent_reduction(ContractPool storage self, uint256 _reduction, bool _refunding_fees) {
		onlyOwner(self);
        //funds must have been sent and no tokens received yet
		require(self.bool_variables[0] && self.integer_variables[7] == 0 && _reduction <= 100);
        //True if the owner wants to refund the fees collected
		self.bool_variables[3] = _refunding_fees;
		self.integer_variables[5] = _reduction;
		//we substract by contract_eth_value*_reduction basically
		self.integer_variables[4] = self.integer_variables[4].sub((self.integer_variables[4].mul(_reduction)).div(100));
	}

	function set_whitelist_enabled(ContractPool storage self, bool _boolean) {
		onlyOwner(self);
		self.bool_variables[1] = _boolean;
		//Whitelist(_boolean);
	}

	function change_individual_cap(ContractPool storage self, uint256 _cap) {
		onlyOwner(self);
		self.integer_variables[2] = _cap;
	}

	function change_max_amount(ContractPool storage self, uint256 _amount) {
		onlyOwner(self);
		//ATTENTION! The new amount should be in wei
		//Use https://etherconverter.online/
		self.integer_variables[1] = calculate_with_fees(self, _amount);
	}

	function change_fee(ContractPool storage self, uint256 _fee) {
		onlyOwner(self);
		self.integer_variables[0] = _fee;
	}

	function force_refund(ContractPool storage self, address _addy) {
		onlyOwner(self);
		refund(self, _addy);
	}

	function emergency_token_withdraw(ContractPool storage self, address _address) {
		onlyOwner(self);
	 	ERC20 temp_token = ERC20(_address);
		require(temp_token.transfer(msg.sender, temp_token.balanceOf(this)));
	}

	function emergency_eth_withdraw(ContractPool storage self) {
		onlyOwner(self);
		msg.sender.transfer(this.balance);
	}

//###############################################################################################################################


	//INTERNAL FUNCTIONS
	//============================
	// Allows any user to withdraw his tokens.
	function withdraw(ContractPool storage self, address _user) internal {
		// Disallow withdraw if tokens haven't been bought yet.
		require(self.bool_variables[0]);
		uint256 contract_token_balance = self.token.balanceOf(address(this));
		// Disallow token withdrawals if there are no tokens to withdraw.
		require(contract_token_balance != 0);
		Contributor storage contributor = self.contributors[_user];
		if (contributor.rounds < self.integer_variables[7]) {
            //contributor can claim his bonus tokens of previous rounds if he didn't withdrawn
            //uint256 this_contribution_claim = (rounds-contributor.rounds)*contributor.balance;
			Snapshot storage snapshot = self.snapshots[contributor.rounds];
            uint256 tokens_to_withdraw = contributor.balance.mul(snapshot.tokens_balance).div(snapshot.eth_balance);
			snapshot.tokens_balance = snapshot.tokens_balance.sub(tokens_to_withdraw);
			snapshot.eth_balance = snapshot.eth_balance.sub(contributor.balance);
            // Update the value of tokens currently held by the contract.
            //contract_eth_value -= contributor.balance;
            contributor.rounds++;
            // Send the funds.  Throws on failure to prevent loss of funds.
            require(self.token.transfer(_user, tokens_to_withdraw));
        }
	}

	// Allows any user to get his eth refunded before the purchase is made.
	function refund(ContractPool storage self, address _user) internal {
		require(!self.bool_variables[0] && self.integer_variables[5] == 0);
		Contributor storage contributor = self.contributors[_user];
		self.integer_variables[6] -= contributor.fee_owner;
		uint256 eth_to_withdraw = contributor.balance.add(contributor.fee_owner);
		// Update the user's balance prior to sending ETH to prevent recursive call.
		contributor.balance = 0;
		contributor.fee_owner = 0;
		// Return the user's funds.  Throws on failure to prevent loss of funds.
		_user.transfer(eth_to_withdraw);
	}

	//Allows any user to get a part of his ETH refunded, in proportion
	//to the % reduced of the allocation
	function partial_refund(ContractPool storage self, address _user) internal {
		require(self.bool_variables[0] && self.integer_variables[7] == 0 && self.integer_variables[5] > 0);
		Contributor storage contributor = self.contributors[_user];
		require(contributor.rounds == 0);
		//Updates balance and fee of contributor
		uint256 eth_to_withdraw = contributor.balance.mul(self.integer_variables[5]).div(100);
		contributor.balance = contributor.balance.sub(eth_to_withdraw);
		//Refunds the fee of the owner if wanted
		if (self.bool_variables[3]) {
			uint256 fee = contributor.fee_owner.mul(self.integer_variables[5]).div(100);
			contributor.fee_owner -= fee;
			eth_to_withdraw = eth_to_withdraw.add(fee);
		}
		_user.transfer(eth_to_withdraw);
	}

	function take_fees_eth_owner(ContractPool self) internal {
	//Owner takes fees on the ETH in this case
	//In case owner doesn't want to take fees
		if (self.integer_variables[0] != 0) {
			self.owner.transfer(self.integer_variables[6]);
		}
	}

	function calculate_with_fees(ContractPool self, uint256 _amount) internal returns (uint256) {
		uint256 temp = _amount;
		if (self.integer_variables[0] != 0) {
			temp = temp.add(_amount.div(self.integer_variables[0]));
		}
		return temp;
	}

	function tokens_received(ContractPool storage self) internal {
		//We need to check the previous token balance
		uint256 previous_balance;
		for (uint8 i = 0; i < self.snapshots.length; i++) {
			previous_balance = previous_balance.add(self.snapshots[i].tokens_balance);
		}
		self.snapshots.push(Snapshot(self.token.balanceOf(address(this)).sub(previous_balance), self.integer_variables[4]));
		//we don't leave out the tokens that didn't get withdrawn
		self.integer_variables[7]++;
	}


//###############################################################################################################################

  //PUBLIC FUNCTIONS
  //============================

  function tokenFallback(ContractPool storage self, address _from, uint _value, bytes _data) {
		if (ERC20(msg.sender) == self.token) {
			tokens_received(self);
		}
	}

	function withdraw_my_tokens(ContractPool storage self) {
		for (uint8 i = self.contributors[msg.sender].rounds; i < self.integer_variables[7]; i++) {
			withdraw(self, msg.sender);
		}
	}

	function withdraw_tokens_for(ContractPool storage self, address _addy) {
		for (uint8 i = self.contributors[_addy].rounds; i < self.integer_variables[7]; i++) {
			withdraw(self, _addy);
		}
	}

	function refund_my_ether(ContractPool storage self) {
		refund(self, msg.sender);
	}

	function partial_refund_my_ether(ContractPool storage self) {
		partial_refund(self, msg.sender);
	}

	// Default function.  Called when a user sends ETH to the contract.
	function pay(ContractPool storage self) {
		underMaxAmount(self);
		require(!self.bool_variables[0] && self.bool_variables[2] && (self.integer_variables[3] == 0 || tx.gasprice <= self.integer_variables[3]));
		Contributor storage contributor = self.contributors[msg.sender];
		//Checks if contributor is whitelisted
		if (self.bool_variables[1]) {
			require(contributor.whitelisted);
		}
		//Manages cases of dev and/or owner taking fees
		//"Worst case", substract 0 from the msg.value
		uint256 fee = 0;
		if (self.integer_variables[0] != 0) {
			fee = SafeMath.div(msg.value, self.integer_variables[0]);
			contributor.fee_owner += fee;
			self.integer_variables[6] += fee;
		}
		uint256 fees = fee;
		//Updates both of the balances
		contributor.balance = contributor.balance.add(msg.value).sub(fees);

		//Checks if the individual cap is respected
		//If it's not, changes are reverted
		require(self.integer_variables[2] == 0 || contributor.balance <= self.integer_variables[2]);
	}
}
