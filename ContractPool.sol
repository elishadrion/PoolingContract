import "./ContractLibrary.sol";
pragma solidity ^0.4.23;


contract ContractPool {
	using ContractLibrary for ContractLibrary.ContractPool;

	ContractLibrary.ContractPool public contract_pool;

	constructor(
		uint256 _max_amount,
		bool _whitelist,
		uint256 fee_divisor
		) {
			contract_pool.integer_variables.length = 9;
			contract_pool.bool_variables.length = 5;
			contract_pool.integer_variables[0] = fee_divisor;
			contract_pool.owner = msg.sender;
			ContractLibrary.change_max_amount(contract_pool, _max_amount);
			contract_pool.bool_variables[1] = _whitelist;
			contract_pool.bool_variables[2] = true;
			ContractLibrary.Contributor storage contributor = contract_pool.contributors[msg.sender];
			contributor.whitelisted = true;
  		}

  //###############################################################################################################################

	//OWNER FUNCTIONS
	//============================
	// Buy the tokens. Sends ETH to the presale wallet and records the ETH amount held in the contract.
	function buy_the_tokens(bytes _data) {
		ContractLibrary.buy_the_tokens(contract_pool, _data);
	}

	function whitelist_addys(address[] _addys, bool _state) {
		ContractLibrary.whitelist_addys(contract_pool, _addys, _state);
	}

	function set_gas_price_max(uint256 _gas_price) {
		ContractLibrary.set_gas_price_max(contract_pool, _gas_price);
	}

	function set_sale_address(address _sale) {
		ContractLibrary.set_sale_address(contract_pool, _sale);
	}

	function set_token_address(address _token) {
		ContractLibrary.set_token_address(contract_pool, _token);
	}

	function set_allow_contributions(bool _boolean) {
		ContractLibrary.set_allow_contributions(contract_pool, _boolean);
	}

	function set_tokens_received() {
		ContractLibrary.set_tokens_received(contract_pool);
	}

	function set_percent_reduction(uint256 _reduction,  bool _refunding_owner_fees, bool _refunding_devs_fees) payable {
		ContractLibrary.set_percent_reduction(contract_pool, _reduction, _refunding_owner_fees, _refunding_devs_fees);
	}

	function set_whitelist_enabled(bool _boolean) {
		ContractLibrary.set_whitelist_enabled(contract_pool, _boolean);
	}

	function change_individual_cap(uint256 _cap) {
		ContractLibrary.change_individual_cap(contract_pool, _cap);
	}

	function change_max_amount(uint256 _amount) {
		ContractLibrary.change_max_amount(contract_pool, _amount);
	}

	function change_fee(uint256 _fee) {
		ContractLibrary.change_fee(contract_pool, _fee);
	}

	function force_refund(address _addy) {
		ContractLibrary.force_refund(contract_pool, _addy);
	}

	function emergency_token_withdraw(address _address) {
		ContractLibrary.emergency_token_withdraw(contract_pool, _address);
	}

	function emergency_eth_withdraw() {
		ContractLibrary.emergency_eth_withdraw(contract_pool);
	}


//###############################################################################################################################

  //PUBLIC FUNCTIONS
  //============================

  function tokenFallback(address _from, uint _value, bytes _data) {
		ContractLibrary.tokenFallback(contract_pool, _from, _value, _data);
	}

	function withdraw_my_tokens() {
		ContractLibrary.withdraw_my_tokens(contract_pool);
	}

	function withdraw_tokens_for(address _addy) {
		ContractLibrary.withdraw_tokens_for(contract_pool, _addy);
	}

	function refund_my_ether() {
		ContractLibrary.refund_my_ether(contract_pool);
	}

	function partial_refund_my_ether() {
		ContractLibrary.partial_refund_my_ether(contract_pool);
	}

	function provide_eth() payable {}

	function () payable {
		ContractLibrary.pay(contract_pool);
	}
}
