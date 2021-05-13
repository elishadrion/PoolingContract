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
 * Test ownerOnly functions
 */
contract('Contract -- onlyOwner', function(accounts) {
  it("verify onlyOwner modified functions only work for owner", async function() {

    let contract = await Contract.new(0, FEE_OWNER, 0, 0, NULL_TOKEN, BOGUS, true, false, []);

    let tst = await TestTokens.new(1000000, {
      from: accounts[9]
    });

    await tst.transfer(contract.address, 1000000, {from:accounts[9]});
    console.log(contract.address);
    await contract.set_sale_address(accounts[1], {
      from: accounts[1]
    }).then(
      () => assert.throw('set_sale_address() should fail -- not owner'),
      e => assert.isAtLeast(e.message.indexOf('revert'), 0)
    );

    await contract.set_token_address(accounts[1], {
      from: accounts[1]
    }).then(
      () => assert.throw('set_token_address() should fail -- not owner'),
      e => assert.isAtLeast(e.message.indexOf('revert'), 0)
    );

    await contract.set_tokens_received({
      from: accounts[1]
    }).then(
      () => assert.throw('set_tokens_received() should fail -- not owner'),
      e => assert.isAtLeast(e.message.indexOf('revert'), 0)
    );

    await contract.change_max_individual_cap(eth2wei(50), {
      from: accounts[1]
    }).then(
      () => assert.throw('change_individual_cap() should fail -- not owner'),
      e => assert.isAtLeast(e.message.indexOf('revert'), 0)
    );

    // await contract.change_owner(accounts[1], {
    //   from: accounts[1]
    // }).then(
    //   () => assert.throw('change_owner() should fail -- not owner'),
    //   e => assert.isAtLeast(e.message.indexOf('revert'), 0)
    // );

    await contract.change_max_amount(eth2wei(1000), {
      from: accounts[1]
    }).then(
      () => assert.throw('change_max_amount() should fail -- not owner'),
      e => assert.isAtLeast(e.message.indexOf('revert'), 0)
    );

    await contract.change_max_amount(eth2wei(1000), {
      from: accounts[1]
    }).then(
      () => assert.throw('change_max_amount() should fail -- not owner'),
      e => assert.isAtLeast(e.message.indexOf('revert'), 0)
    );

    await contract.emergency_eth_withdraw({
      from: accounts[1]
    }).then(
      () => assert.throw('emergency_eth_withdraw() should fail -- not owner'),
      e => assert.isAtLeast(e.message.indexOf('revert'), 0)
    );

    await contract.emergency_token_withdraw(tst.address,{
      from: accounts[1]
    }).then(
      () => assert.throw('emergency_token_withdraw() should fail -- not owner'),
      e => assert.isAtLeast(e.message.indexOf('revert'), 0)
    );
  });
});
