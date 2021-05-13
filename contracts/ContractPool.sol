pragma experimental ABIEncoderV2;
pragma solidity ^0.7.4;

import "./ContractLibrary.sol";


contract ContractPool {

	ContractLibrary.ContractConfig public config;
	ContractLibrary.ContractStats public stats;

	string constant public VERSION = "1.0.0";
	uint public pointer = 0;

	constructor(
		uint256 max_amount,
		uint256 owner_fee,
		uint256 max_individual_cap,
		uint256 min_individual_cap,
		address payableERC20,
		address sale,
		bool is_distributing,
		bool using_whitelist,
		address[] memory to_whitelist
		) public {
			config.owner = msg.sender;
			config.owner_fee = owner_fee;
			config.payableERC20 = IERC20(payableERC20);
			config.sale = sale;
			config.is_distributing = is_distributing;
			config.using_whitelist = using_whitelist;
			change_max_amount(max_amount);
			change_max_individual_cap(max_individual_cap);
			change_min_individual_cap(min_individual_cap);
			whitelist(to_whitelist);
  		}

  //###############################################################################################################################

	//OWNER FUNCTIONS
	//============================
	// Buy the tokens. Sends ETH to the presale wallet and records the ETH amount held in the contract.
	function buy_the_tokens(bytes memory _data) public {
		ContractLibrary.buy_the_tokens(config, stats, _data);
	}

	function set_sale_address(address _sale) public {
		ContractLibrary.set_sale_address(stats, config, _sale);
	}

	function set_token_address(address _token) public {
		ContractLibrary.set_token_address(config, _token);
	}

	function set_tokens_received() public {
		ContractLibrary.set_tokens_received(stats, config);
		pointer = 0;
	}

	function change_max_individual_cap(uint256 _cap) public {
		ContractLibrary.change_max_individual_cap(config, _cap);
	}

	function change_min_individual_cap(uint256 _cap) public {
		ContractLibrary.change_min_individual_cap(config, _cap);
	}

	function change_max_amount(uint256 _amount) public {
		ContractLibrary.change_max_amount(config, _amount);
	}

	function force_refund(address _addy) public {
		ContractLibrary.force_refund(stats, config, _addy);
	}

	function whitelist(address[] memory _to_whitelist) public {
		ContractLibrary.whitelist(stats, config, _to_whitelist);
	}

	function blacklist(address[] memory _to_blacklist) public {
		ContractLibrary.blacklist(stats, config, _to_blacklist);
	}

	function enable_whitelist(bool enable) public {
		ContractLibrary.enable_whitelist(config, enable);
	}

	function emergency_token_withdraw(address _address) public {
		ContractLibrary.emergency_token_withdraw(config, _address);
	}

	function emergency_eth_withdraw() public {
		ContractLibrary.emergency_eth_withdraw(config);
	}


	//###############################################################################################################################

	//PUBLIC FUNCTIONS
	//============================
	//
	//
	function get_config() public view returns (
		address sale, address owner, address token,
		address payableERC20, uint owner_fee, uint max_amount, uint min_individual_cap,
		uint max_individual_cap, bool is_distributing, bool using_whitelist)
		{
			sale = config.sale;
			owner = config.owner;
			token = address(config.token);
			payableERC20 = address(config.payableERC20);
			owner_fee = config.owner_fee;
			max_amount = config.max_amount;
			max_individual_cap = config.max_individual_cap;
			min_individual_cap = config.min_individual_cap;
			is_distributing = config.is_distributing;
			using_whitelist = config.using_whitelist;
	}

	function get_stats() public view returns (
		uint const_currency_balance, uint rounds, uint num_contributors,
		uint pointer, bool bought_tokens) {
		const_currency_balance = stats.const_currency_balance;
		rounds = stats.rounds;
		bought_tokens = stats.bought_tokens;
		num_contributors = stats.addresses.length;
		pointer = pointer;
	}

 	function contributor(address _contributor) public view returns (ContractLibrary.Contributor memory contrib) {
		contrib = stats.contributors[_contributor];
	}

	function snapshot() public view returns (uint256 currency_balance, uint256 tokens_balance) {
		currency_balance = stats.snapshot.currency_balance;
		tokens_balance = stats.snapshot.tokens_balance;
	}

	function leftover_tokens(address _contributor) view public returns (uint256) {
		return ContractLibrary.leftover_tokens(stats, _contributor);
	}

	function tokenFallback(address _from, uint _value, bytes memory _data) public {
		ContractLibrary.tokenFallback(stats, config, _from, _value, _data);
	}

	function withdraw() public {
		ContractLibrary.withdraw(stats, config);
	}

	function refund(uint256 _amount) public {
		ContractLibrary.refund(stats, config, _amount);
	}

	function distribute() public {
		//distribute per 95 contributors
		uint max = 120;
		require(pointer < stats.addresses.length, "DISTRIBUTION: ALL DISTRIBUTED ALREADY");
		ContractLibrary.distribute(stats, config, pointer, pointer+max);
		pointer = pointer+max;
	}

	function payTokens(uint256 _amount) public {
		ContractLibrary.pay(stats, config, _amount);
	}

	function pay() external payable {
		ContractLibrary.pay(stats, config, 0);
	}
}
