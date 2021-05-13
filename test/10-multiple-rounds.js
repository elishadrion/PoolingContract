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

contract('Contract -- multiple rounds', function(accounts) {

    const totalTokens = eth2wei(720);
    const initialTokens = eth2wei(360);
    const bonusTokens1 = eth2wei(180);
    const bonusTokens2 = eth2wei(180);
    let contract;
    let token;
    let contributions = [null];
    let expectationsInitial = [null];
    let expectations1 = [null];
    let expectations2 = [null];

    async function emptyAccountsOfTokens() {
        for(var i = 1; i < 9; i++) {
            var balance = await token.balanceOf(accounts[i]);
            await token.transfer(accounts[9], balance.toString(), {from:accounts[i]});
            balance = await token.balanceOf(accounts[i]);
            assert.equal(balance.toString(), 0);
        }
    }

    it("users contribute", async function() {

        contract = await Contract.new(0, FEE_OWNER, 0, 0, NULL_TOKEN, accounts[9], true, false, []);
        token = await TestTokens.new(totalTokens);

        var total = 0;
        for(var i = 1; i < 9; i++) {
            var contribution = eth2wei(1*i);
            total += parseInt(contribution);
            contributions.push(contribution);
            await contract.pay({
                from:accounts[i],
                value:contribution
            });
        }
        //contract has correct balance
        assert.equal(await web3.eth.getBalance(contract.address), total);
        // Computes expected tokens balances
        for (var i=1; i < 9; i++) {
            var expectationInitial = contributions[i]*initialTokens/total;
            var expectation1 = contributions[i]*bonusTokens1/total;
            var expectation2 = contributions[i]*bonusTokens2/total;
            expectationsInitial.push(expectationInitial);
            expectations1.push(expectation1);
            expectations2.push(expectation2);
        }
    });

    it("initial round - all users withdraw", async function() {
        await contract.buy_the_tokens("0x0");
        await contract.set_token_address(token.address);
        await token.transfer(contract.address, initialTokens);
        await contract.set_tokens_received();
        //users withdraw
        for(var i = 1; i < 9; i++) {
            await contract.withdraw({
                from:accounts[i],
            });
            const actualBalance = await token.balanceOf(accounts[i]);
            assert.equal(actualBalance.toString(), expectationsInitial[i]);
        }
        //contract should be empty of tokens
        const contractBalance = await token.balanceOf(contract.address);
        assert.equal(contractBalance, 0);
    });

    it("first bonus round - some users don't withdraw", async function() {
        await emptyAccountsOfTokens();
        await token.transfer(contract.address, bonusTokens1);
        //contract should have just the balance equal to bonusTokens1
        assert.equal(await token.balanceOf(contract.address), bonusTokens1);
        await contract.set_tokens_received();
        //users withdraw
        for(var i = 1; i < 9; i++) {
            //skip withdrawing for users 5 and 6
            if (i == 5 || i == 6) continue;
            await contract.withdraw({
                from:accounts[i],
            });
            const actualBalance = await token.balanceOf(accounts[i]);
            assert.equal(actualBalance.toString(), expectations1[i]);
        }
        //contract should have tokens of user 5 and 6 left
        const expectedTokens = parseInt(expectations1[5])+parseInt(expectations1[6]);
        assert.equal(await token.balanceOf(contract.address), expectedTokens);
    });

    it("second bonus round - all users withdraw", async function() {
        await emptyAccountsOfTokens();
        await token.transfer(contract.address, bonusTokens2);
        //contract should have just the balance equal to bonusTokens2 + bonus1 of users 5 and 6
        var expectedTokens = parseInt(bonusTokens2)+parseInt(expectations1[5])+parseInt(expectations1[6]);
        assert.equal(await token.balanceOf(contract.address), expectedTokens);
        await contract.set_tokens_received();

        for(var i = 1; i < 9; i++) {
            await contract.withdraw({
                from:accounts[i],
            });
            const actualBalance = await token.balanceOf(accounts[i]);
            if (i == 5 || i == 6) {
                assert.equal(actualBalance.toString(), expectations2[i]*2);
            } else {
                assert.equal(actualBalance.toString(), expectations2[i]);

            }
        }
        //contract should be empty
        assert.equal(await token.balanceOf(contract.address), 0);
    });

});
