var BigNumber = require('../lib/bignumber.js.min');
var TestTokens = artifacts.require("TestToken.sol");
var Contract = artifacts.require("ContractPool.sol");
const DEV = '0xEE06BdDafFA56a303718DE53A5bc347EfbE4C68f';
const AUD = '0x63F7547Ac277ea0B52A0B060Be6af8C5904953aa';
const BOGUS = '0x63F7547Ac277ea0B52A0B060Be6af8C5904953aa'
const NULL_TOKEN = '0x0000000000000000000000000000000000000000'
const FEE_OWNER = 0;
const FEE_DEV = 200;

function eth2wei(eth) {
  return web3.utils.toWei(eth.toString(), 'ether');
}

function wei2eth(wei) {
  return web3.utils.fromWei(wei.toString(), 'ether');
}
/**
 * Fill contract to threshold of max (250)
 * Verify more transactions fail
 */
contract('Contract -- pool and individual caps', function(accounts) {
    let contract;

    it('Cannot contribute over the pool cap', async function() {
        contract = await Contract.new(0, FEE_OWNER, 0, 0, NULL_TOKEN, BOGUS, true, false, []);
        //set max to 50 ETH
        await contract.change_max_amount(eth2wei(50));
        // //fill up 40 ETH
        for (var i = 1; i <= 4; i++) {
            await contract.pay({
                from: accounts[i],
                to: contract.address,
                value: eth2wei(10)
            });
        }
        //confirm balance is 200
        var actualBalance = await web3.eth.getBalance(contract.address);
        assert.equal(actualBalance, eth2wei(40));
        //final transaction to put balance on threshhold of cap
        await contract.pay({
            from: accounts[5],
            to: contract.address,
            value: eth2wei(10) //eat up the last 10
        });
        actualBalance = await web3.eth.getBalance(contract.address);
        assert.equal(actualBalance, eth2wei(50));
        //verify attempting to add more fails
        await contract.pay({
            from: accounts[6],
            to: contract.address,
            value: eth2wei(5)
        }).then(
            () => assert.throw('sendTransaction() should fail -- over limit'),
            e => assert.isAtLeast(e.message.indexOf('revert'), 0)
        );
    });

    it("the minimum and maximum individual caps should be respected", async function() {
        contract = await Contract.new(0, FEE_OWNER, eth2wei(5), eth2wei(1), NULL_TOKEN, BOGUS, true, false, []);
        //min cap test
        await contract.pay({
            from: accounts[0],
            to: contract.address,
            value: eth2wei(0.5)
        }).then(
            () => assert.throw('UNDER MINIMUM CONTRIBUTION'),
            e => assert.isAtLeast(e.message.indexOf('revert'), 0)
        );
        //max cap
        await contract.pay({
            from: accounts[0],
            to: contract.address,
            value: eth2wei(6)
        }).then(
            () => assert.throw('OVER INDIVIDUAL CAP'),
            e => assert.isAtLeast(e.message.indexOf('revert'), 0)
        );
    });
});
