var BigNumber = require('../lib/bignumber.js.min');
var TestTokens = artifacts.require("TestToken.sol");
var Contract = artifacts.require("ContractPool.sol");
const DEV = '0xEE06BdDafFA56a303718DE53A5bc347EfbE4C68f';
const AUD = '0x63F7547Ac277ea0B52A0B060Be6af8C5904953aa';
const BOGUS = '0x63F7547Ac277ea0B52A0B060Be6af8C5904953aa';
const NULL_TOKEN = '0x0000000000000000000000000000000000000000';
const FEE_OWNER = 0;
const FEE_DEV = 200;

function eth2wei(eth) {
  return web3.utils.toWei(eth.toString(), 'ether');
}

function wei2eth(wei) {
  return web3.utils.fromWei(wei.toString(), 'ether');
}
/**
 * Test contracts most basic functions a user contributing
 * and being able to refund themselves
 */
contract('Contract -- basic payable fallback and refund test', function(accounts) {
  it("check basic contribution and refund functions", async function() {
    let contract = await Contract.new(0, FEE_OWNER, 0, 0,NULL_TOKEN, BOGUS, true, false, []);
    var total = new BigNumber(eth2wei(10));
    /**
     * User can send and verify balance updates in contract
     */
    await contract.pay({
      from: accounts[1],
      to: contract.address,
      value: eth2wei(10)
    });
    var testBalance = await web3.eth.getBalance(contract.address);
    assert.equal(eth2wei(10), testBalance);

    var userBalanceBefore = await web3.eth.getBalance(accounts[1]);
    await contract.refund(eth2wei(5), {
      from: accounts[1]
    });
    var userBalanceAfter = await web3.eth.getBalance(accounts[1]);
    assert.isBelow(parseInt(userBalanceBefore), parseInt(userBalanceAfter));
    var contractBalanceAfter = await web3.eth.getBalance(contract.address);
    assert.equal(eth2wei(5), parseInt(contractBalanceAfter));
  });
});
