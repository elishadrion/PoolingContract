var BigNumber = require('../lib/bignumber.js.min');
var TestTokens = artifacts.require("TestToken.sol");
var Contract = artifacts.require("ContractPool.sol");
const DEV = '0xEE06BdDafFA56a303718DE53A5bc347EfbE4C68f';
const AUD = '0x63F7547Ac277ea0B52A0B060Be6af8C5904953aa';
const BOGUS = '0x63F7547Ac277ea0B52A0B060Be6af8C5904953aa'
const NULL_TOKEN = '0x0000000000000000000000000000000000000000';
const FEE_OWNER = 100;
const FEE_DEV = 200;

function eth2wei(eth) {
  return web3.utils.toWei(eth.toString(), 'ether');
}

function wei2eth(wei) {
  return web3.utils.fromWei(wei.toString(), 'ether');
}

contract('The whitelist', function(accounts) {

    let contract;
    let token;
    let contributions = [];
    it("not whitelisted users cannot contribute", async function() {

        const totalTokens = eth2wei(1000000);
        contract = await Contract.new(0, FEE_OWNER, 0, 0, NULL_TOKEN, accounts[0], true, true, []);
        token = await TestTokens.new(totalTokens);

        for(var i = 1; i < 3; i++) {
            var contribution = eth2wei(1);
            await contract.pay({
                from:accounts[i],
                value:contribution
            }).then(
                () => assert.throw('Not whitelisted'),
                e => assert.isAtLeast(e.message.indexOf('revert'), 0)
            );;
        }
    });

    it("whitelisted users can contribute", async function() {
        await contract.whitelist([accounts[1], accounts[2]]);
        for(var i = 1; i < 3; i++) {
            var contribution = eth2wei(1);
            await contract.pay({
                from:accounts[i],
                value:contribution
            });
        }
    });

});
