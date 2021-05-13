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
 * Test emergency_eth_withdraw
 */
contract('Contract -- emergency eth withdraw', function(accounts) {
  it("verify owner can withdraw eth in the event of an emergency", async function() {
    let contract = await Contract.new(0, FEE_OWNER, 0, 0,NULL_TOKEN, BOGUS, true, false, []);

    for(var i = 1; i <= 9; i++) {
      await contract.pay({
        from:accounts[i],
        to:contract.address,
        value:eth2wei(50)
      });
    }
    //verify balance
    var balance = await web3.eth.getBalance(contract.address);
    assert.equal(balance, eth2wei(50*9));

    //non-owner attempts emergency_eth_withdraw()

    await contract.emergency_eth_withdraw({
      from:accounts[9]
    }).then(
      () => assert.throw('emergency_eth_withdraw() should fail -- not owner'),
      e => assert.isAtLeast(e.message.indexOf('revert'), 0)
    );

    //owner withdraws eth
    var ownerBalanceBefore = new BigNumber(await web3.eth.getBalance(accounts[0]));
    var tx = await contract.emergency_eth_withdraw({gasPrice:100000000000});
    var gas = new BigNumber('100000000000');
    gas = gas.times(tx.receipt.gasUsed);

    //verify contract is empty
    balance = await web3.eth.getBalance(contract.address);
    assert.equal(balance, 0);

    //verify owner balance
    var ownerBalanceAfter = await web3.eth.getBalance(accounts[0]);
    var diff = ownerBalanceBefore.plus(eth2wei(50*9)).minus(gas);
    assert.equal(diff.toFixed(), ownerBalanceAfter);

  });
});

/**
 * Test emergency_token_withdraw
 */
contract('Contract -- emergency token withdraw', function(accounts) {
  it("verify owner can withdraw eth in the event of an emergency", async function() {
    var totalTokens = new BigNumber(eth2wei(10000000));

    let contract = await Contract.new(0, FEE_OWNER, 0, 0, BOGUS, BOGUS, true, false, []);

    let tst = await TestTokens.new(totalTokens.toFixed(), {
      from: accounts[9]
    });

    //verify contract balance
    var tokenBalance = await tst.balanceOf(accounts[9]);
    assert.equal(tokenBalance, totalTokens.toFixed());

    //transfer tokens to contract
    await tst.transfer(contract.address, totalTokens.toFixed(), {
      from: accounts[9]
    });

    await contract.emergency_token_withdraw(
      tst.address,
      {from:accounts[9]}
    ).then(
      () => assert.throw('emergency_token_withdraw() should fail -- not owner'),
      e => assert.isAtLeast(e.message.indexOf('revert'), 0)
    );

    //owner withdraws tokens
    await contract.emergency_token_withdraw(tst.address);

    //verify owner balances
    tokenBalance = await tst.balanceOf(accounts[0]);
    assert.equal(tokenBalance, totalTokens.toFixed());

    //verify contract balances
    tokenBalance = await tst.balanceOf(accounts[9]);
    assert.equal(tokenBalance, 0);
  });
});
