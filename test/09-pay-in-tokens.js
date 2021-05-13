var BigNumber = require('../lib/bignumber.js.min');
var TestTokens = artifacts.require("TestToken.sol");
var Contract = artifacts.require("ContractPool.sol");
const DEV = '0xEE06BdDafFA56a303718DE53A5bc347EfbE4C68f';
const AUD = '0x63F7547Ac277ea0B52A0B060Be6af8C5904953aa';
const BOGUS = '0x63F7547Ac277ea0B52A0B060Be6af8C5904953aa'
const FEE_OWNER = 100;
const FEE_DEV = 200;

function eth2wei(eth) {
  return web3.utils.toWei(eth.toString(), 'ether');
}

function wei2eth(wei) {
  return web3.utils.fromWei(wei.toString(), 'ether');
}

contract('Contract -- payable tokens', function(accounts) {

    const totalTokens = eth2wei(1000000);
    let contract;
    let USDT;


    async function distributePayTokens() {
        for (var i = 1; i < 9; i++) {
            await USDT.transfer(accounts[i], eth2wei(100*i), {from:accounts[0]});
        }
    };

    it("user pays in token, verifies correct balances", async function() {
        USDT = await TestTokens.new(totalTokens, {
            from: accounts[0]
        });
        contract = await Contract.new(0, FEE_OWNER, eth2wei(10).toString(), eth2wei(1) , USDT.address, accounts[9], true, false, []);
        await USDT.approve(contract.address, eth2wei(10000), {from:accounts[0]});
        await contract.payTokens(eth2wei(10).toString());
        const contribVars = await contract.contributor(accounts[0]);
        const contribActualTotal = parseInt(contribVars.balance);
        assert.equal(contribActualTotal, eth2wei(10));
        const balance = await USDT.balanceOf(contract.address);
        assert.equal(balance.toString(), eth2wei(10));
    });

    it("user can refund his tokens", async function() {
        const tokensBalanceBefore = await USDT.balanceOf(accounts[0]);
        const expectedBalance = new BigNumber(totalTokens-eth2wei(10))
        assert.equal(tokensBalanceBefore.toString(), expectedBalance.toFixed());
        await contract.refund(eth2wei(10), {from:accounts[0]});
        const tokensBalanceAfter = await USDT.balanceOf(accounts[0]);
        assert.equal(tokensBalanceAfter, totalTokens);
    });

    it("user cannot contribute in eth", async function() {
        await web3.eth.sendTransaction({
            from: accounts[0],
            to: contract.address,
            value: eth2wei(1)
        }).then(
            () => assert.throw('no fallback function'),
            e => assert.isAtLeast(e.message.indexOf('revert'), 0)
        );
        await contract.pay({
          from: accounts[0],
          value: eth2wei(1)
        }).then(
          () => assert.throw('Contract is using a payable ERC20'),
          e => assert.isAtLeast(e.message.indexOf('revert'), 0)
        );
    });

    it("user cannot send more than the individual cap", async function() {
        await contract.payTokens(eth2wei(11)).then(
            () => assert.throw('Over the individual cap'),
            e => assert.isAtLeast(e.message.indexOf('revert'), 0)
        );

        assert.equal(await USDT.balanceOf(contract.address), 0);
    });

    it("users contribute in ERC20 and get their reward tokens in one round", async function() {
        distributePayTokens();
        rewardTokens = await TestTokens.new(totalTokens, {
            from: accounts[0]
        });
        await contract.set_token_address(rewardTokens.address);
        /*
        Users contribute
        */
        var totalAmountPaid = 0;
        var realContributions = [];
        for (var i = 1; i < 9; i++) {
            const contribution = eth2wei(1*i);
            await USDT.approve(contract.address, contribution, {from:accounts[i]});
            await contract.payTokens(contribution, {from:accounts[i]});
            const realContribution = contribution - (contribution/FEE_DEV) - (contribution/FEE_OWNER);
            totalAmountPaid += realContribution;
            realContributions.push(realContribution);
        }
        /*
        Verifies the balance of the users
        */
        for (var i = 1; i < 9; i++) {
            var contribVars = await contract.contributor(accounts[i]);
            const totalSum = parseInt(contribVars.balance);
            assert.equal(totalSum.toFixed(), eth2wei(1*i));
        }
        // Buy the tokens
        await contract.buy_the_tokens("0x0");
        // balance should be empty
        const currencyBalance = await USDT.balanceOf(contract.address);
        assert.equal(currencyBalance, 0);
        await rewardTokens.transfer(contract.address, totalTokens)
        await contract.set_tokens_received();
        /*
        Users withdraw their tokens
        */
        for (var i = 1; i < 9; i++) {
            await contract.withdraw({from:accounts[i]});
        }

        /*
        Verifies that the reward tokens balance of each user corresponds to
        theoritical amount expected
        */
        var tokensToBePaid = new BigNumber(totalTokens);
        var totalAmountPaid = new BigNumber(totalAmountPaid);
        for (var i = 1; i < 9; i++) {
            const actualBalance =  await rewardTokens.balanceOf(accounts[i]);
            const contribution = new BigNumber(realContributions[i-1]);
            const expectedBalance = contribution.times(tokensToBePaid).dividedToIntegerBy(totalAmountPaid);
            assert.equal(actualBalance.toString(), expectedBalance.toFixed());
            totalAmountPaid = totalAmountPaid.minus(contribution);
            tokensToBePaid = tokensToBePaid.minus(actualBalance);
        }


        /*
        Contract should be empty of tokens
        */
        const tokensBalance = await USDT.balanceOf(contract.address);
        assert.equal(tokensBalance, 0);
    });

});
