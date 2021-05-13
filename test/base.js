// var BigNumber = require('../lib/bignumber.js.min');
// var TestTokens = artifacts.require("testtoken.sol");
// var Contract = artifacts.require("contract.sol");
// var Viscous = artifacts.require("viscous.sol");
// const DEV = '0xEE06BdDafFA56a303718DE53A5bc347EfbE4C68f';
// const AUD = '0x63F7547Ac277ea0B52A0B060Be6af8C5904953aa';
// const FEE_OWNER = 0;
// const FEE_DEV = 500;
//
// function eth2wei(eth) {
//   return web3.toWei(eth.toString(), 'ether');
// }
//
// function wei2eth(wei) {
//   return web3.fromWei(wei.toString(), 'ether');
// }

// /**
//  * Similar to the test above, but tokens are automatically distributed
//  * via distribute() and distribute_bonus()
//  * Note: dist_limit will need to be manually set to 3
//  */
// contract('Contract -- tokens and bonus with automatic distribution', function(accounts) {
//   it('test distribute() and distribute_bonus()', async function() {
//     let contract = await Contract.new();
//     //disable whitelist for testing
//     await contract.set_whitelist_enabled(false);
//     //initials some values
//     var initialFunding = parseInt(eth2wei(100));
//     var totalTokens = parseInt(eth2wei(1000000000));
//     var numInitialTokens = parseInt(eth2wei(700000000));
//     var numBonusTokens = parseInt(eth2wei(300000000));
//     var contrib_step = 5;
//     var total = new BigNumber('0');
//     var fees = new BigNumber('0');
//     var feesBonus = new BigNumber('0');
//     var contribVals = [];
//     var feeVals = [];
//     var balancesPreBonus = [];
//     //users make contributitions in their account # * 5
//     for (var i = 1; i < 9; i++) {
//       contribVals[i] = new BigNumber(eth2wei(contrib_step * i));
//       await contract.sendTransaction({
//         from: accounts[i],
//         to: contract.address,
//         value: contribVals[i]
//       });
//       var thisFeeOwner = 0;
//       if (FEE_OWNER != 0) {
//         thisFeeOwner = thisFeeOwner.add(contribVals[i].div(FEE_OWNER));
//       }
//       var thisFeeDev = contribVals[i].div(FEE_DEV);
//       contribVals[i] = contribVals[i].sub(thisFeeOwner).sub(thisFeeDev).sub(thisFeeDev);
//       total = total.add(contribVals[i]);
//       fees = fees.add(thisFeeOwner).add(thisFeeDev).add(thisFeeDev);
//     }
//     //verify proper amount of contributes
//     var testBalance = web3.eth.getBalance(contract.address);
//     assert.equal(total.add(fees).toNumber(), testBalance.toNumber());
//     //check initial balance
//     testBalance = web3.eth.getBalance(accounts[9]);
//     assert.equal(initialFunding, testBalance.toNumber());
//     //set sale then buy
//     await contract.set_sale_address(accounts[9]);
//     await contract.buy_the_tokens('0x0');
//     //verify contract is empty
//     testBalance = web3.eth.getBalance(contract.address);
//     assert.equal(eth2wei(0), testBalance.toNumber());
//     //verify proper amount received
//     testBalance = web3.eth.getBalance(accounts[9]);
//     var expectedBalance = total.add(initialFunding); //dont forget address initial funding
//     assert.equal(expectedBalance.toNumber(), testBalance.toNumber());
//     //verify dev and audit fees
//     testBalance = web3.eth.getBalance(DEV);
//     var expectedBalance = total.add(fees).div(FEE_DEV);
//     assert.equal(expectedBalance.toNumber(), testBalance.toNumber());
//     //
//     testBalance = web3.eth.getBalance(AUD);
//     var expectedBalance = total.add(fees).div(FEE_AUDIT);
//     assert.equal(expectedBalance.toNumber(), testBalance.toNumber());
//     //launch tokens
//     let tst = await TestTokens.new(totalTokens, {
//       from: accounts[9]
//     });
//     var tokens = await tst.balanceOf(accounts[9]);
//     assert.equal(totalTokens, tokens.toNumber());
//     //send tokens to the contract
//     await tst.transfer(contract.address, numInitialTokens, {
//       from: accounts[9]
//     });
//     //verify token contract empty
//     tokens = await tst.balanceOf(accounts[9]);
//     assert.equal(numBonusTokens, tokens.toNumber());
//     //verify pool contract full
//     tokens = await tst.balanceOf(contract.address);
//     assert.equal(numInitialTokens, tokens.toNumber());
//     //set token addy
//     await contract.set_token_address(tst.address);
//
//     //verify all users tokens match their contribution
//     var tokenBalance = new BigNumber(numInitialTokens);
//     var tokenBalanceActual = await tst.balanceOf(contract.address);
//     assert.equal(tokenBalanceActual.toNumber(), tokenBalance.toNumber());
//
//     //Loop through distribute function until contact token balance is zero
//     while (true) {
//       var distBalance = await tst.balanceOf(contract.address);
//       if (distBalance == 0) {
//         break;
//       }
//       await contract.distribute();
//     }
//
//     var totalBalance = total;
//     //all users call withdraw_my_tokens
//     //check all user balances
//     for (var k = 1; k < 9; k++) {
//       var expected = contribVals[k].mul(tokenBalance).div(totalBalance);
//       tokenBalance = tokenBalance.sub(expected);
//       totalBalance = totalBalance.sub(contribVals[k]);
//       var balance = await tst.balanceOf(accounts[k]);
//       balancesPreBonus[k] = balance;
//       assert.equal(expected.toNumber(), balance.toNumber());
//     }
//     //send bonus tokens to the contract
//     await tst.transfer(contract.address, numBonusTokens, {
//       from: accounts[9]
//     });
//     tokens = await tst.balanceOf(accounts[9]);
//     //verify token contract empty
//     assert.equal(0, tokens.toNumber());
//     tokens = await tst.balanceOf(contract.address);
//     //verify pool contract full
//     assert.equal(numBonusTokens, tokens.toNumber());
//     // all withdraw_bonus attempts fail bonus_received not set
//     for (var j = 1; j < 9; j++) {
//       await contract.withdraw_my_bonus_tokens({
//         from: accounts[j]
//       }).then(
//         () => assert.throw('withdraw_my_bonus_tokens() should fail -- bonus_received not set'),
//         e => assert.isAtLeast(e.message.indexOf('revert'), 0)
//       );
//     }
//     await contract.distribute_bonus().then(
//       () => assert.throw('distribute_bonus() should fail -- bonus_received not set'),
//       e => assert.isAtLeast(e.message.indexOf('revert'), 0)
//     );
//     //set bonus tokens received
//     await contract.set_tokens_received();
//
//     var tokenBonusBalance = new BigNumber(numBonusTokens);
//
//     //Loop through distribute function until contact token balance is zero
//     while (true) {
//       var distBalance = await tst.balanceOf(contract.address);
//       if (distBalance == 0) {
//         break;
//       }
//       await contract.distribute_bonus();
//     }
//
//     var totalBonusBalance = total;
//     // all users call withdraw_my_tokens
//     for (var l = 1; l < 9; l++) {
//       var expected = contribVals[l].mul(tokenBonusBalance).div(totalBonusBalance);
//       tokenBonusBalance = tokenBonusBalance.sub(expected);
//       totalBonusBalance = totalBonusBalance.sub(contribVals[l]);
//       var balance = await tst.balanceOf(accounts[l]);
//       balance = balance.sub(balancesPreBonus[l]);
//       assert.equal(expected.toNumber(), balance.toNumber());
//     }
//     //verify contract has been emptied of tokens
//     tokens = await tst.balanceOf(contract.address);
//     assert(eth2wei(0), tokens.toNumber());
//   });
// });
//
// /**
//  * Similar to the test above, but owner takes fees in tokens and dev takes fees
//  * in eth
//  */
// contract('OwnerTokens -- owner takes fee in tokens, dev in eth', function(accounts) {
//   it('distribute and distribute bonus with fee type difference', async function() {
//     let contract = await Contract.new();
//     //disable whitelist for testing
//     await contract.set_whitelist_enabled(false);
//     //initials some values
//     var initialFunding = parseInt(eth2wei(100));
//     var totalTokens = parseInt(eth2wei(1000000000));
//     var numInitialTokens = parseInt(eth2wei(700000000));
//     var numBonusTokens = parseInt(eth2wei(300000000));
//     var contrib_step = 5;
//     var total = new BigNumber('0');
//     var fees = new BigNumber('0');
//     var feesBonus = new BigNumber('0');
//     var ownerContrib = new BigNumber('0');
//     var devContrib = new BigNumber('0');
//     var contribVals = [];
//     var feeVals = [];
//     var balancesPreBonus = [];
//     //users make contributitions in their account # * 5
//     for (var i = 1; i < 9; i++) {
//       contribVals[i] = new BigNumber(eth2wei(contrib_step * i));
//       await contract.sendTransaction({
//         from: accounts[i],
//         to: contract.address,
//         value: contribVals[i]
//       });
//       var thisFeeOwner = 0;
//       if (FEE_OWNER != 0) {
//         thisFeeOwner = thisFeeOwner.add(contribVals[i].div(FEE_OWNER));
//       }
//       var thisFeeDev = contribVals[i].div(FEE_DEV);
//       ownerContrib = ownerContrib.add(thisFeeOwner);
//       devContrib = devContrib.add(thisFeeDev);
//       contribVals[i] = contribVals[i].sub(thisFeeOwner).sub(thisFeeDev).sub(thisFeeDev);
//       total = total.add(contribVals[i]);
//       fees = fees.add(thisFeeOwner).add(thisFeeDev).add(thisFeeDev);
//     }
//     //verify proper amount of contributes
//     var testBalance = web3.eth.getBalance(contract.address);
//     assert.equal(total.add(fees).toNumber(), testBalance.toNumber());
//     //check initial balance
//     testBalance = web3.eth.getBalance(accounts[9]);
//     assert.equal(initialFunding, testBalance.toNumber());
//     //set sale then buy
//     await contract.set_sale_address(accounts[9]);
//     await contract.buy_the_tokens('0x0');
//     //verify contract is empty
//     testBalance = web3.eth.getBalance(contract.address);
//     assert.equal(eth2wei(0), testBalance.toNumber());
//     //verify proper amount received
//     testBalance = web3.eth.getBalance(accounts[9]);
//     var expectedBalance = total.add(initialFunding).add(ownerContrib); //dont forget address initial funding
//     assert.equal(expectedBalance.toNumber(), testBalance.toNumber());
//     //verify dev and audit fees
//     testBalance = web3.eth.getBalance(DEV);
//     var expectedBalance = total.add(fees).div(FEE_DEV);
//     assert.equal(expectedBalance.toNumber(), testBalance.toNumber());
//     //
//     testBalance = web3.eth.getBalance(AUD);
//     var expectedBalance = total.add(fees).div(FEE_AUDIT);
//     assert.equal(expectedBalance.toNumber(), testBalance.toNumber());
//     //launch tokens
//     let tst = await TestTokens.new(totalTokens, {
//       from: accounts[9]
//     });
//     var tokens = await tst.balanceOf(accounts[9]);
//     assert.equal(totalTokens, tokens.toNumber());
//     //send tokens to the contract
//     await tst.transfer(contract.address, numInitialTokens, {
//       from: accounts[9]
//     });
//     //verify token contract empty
//     tokens = await tst.balanceOf(accounts[9]);
//     assert.equal(numBonusTokens, tokens.toNumber());
//     //verify pool contract full
//     tokens = await tst.balanceOf(contract.address);
//     assert.equal(numInitialTokens, tokens.toNumber());
//     //set token addy
//     await contract.set_token_address(tst.address);
//     //verify tokens are in the contract
//     var tokenBalance = new BigNumber(numInitialTokens);
//     var tokenBalanceActual = await tst.balanceOf(contract.address);
//     assert.equal(tokenBalanceActual.toNumber(), tokenBalance.toNumber());
//     //verify owner tokens
//     var totalBalance = total;
//     if (FEE_OWNER != 0) {
//       totalBalance = totalBalance.add(ownerContrib);
//       await contract.withdraw_my_tokens({
//         from: accounts[0]
//       });
//       expectedOwnerTokens = ownerContrib.mul(tokenBalance).div(totalBalance);
//       tokens = await tst.balanceOf(accounts[0]);
//       assert.equal(expectedOwnerTokens.toNumber(), tokens.toNumber());
//       tokenBalance = tokenBalance.sub(expectedOwnerTokens);
//       totalBalance = totalBalance.sub(ownerContrib);
//       var ownerTokensBefore = tokens;
//     }
//
//     //Loop through distribute function until contact token balance is zero
//     while (true) {
//       var distBalance = await tst.balanceOf(contract.address);
//       if (distBalance == 0) {
//         break;
//       }
//       await contract.distribute();
//     }
//     //check all user balances
//     for (var k = 1; k < 9; k++) {
//       var expected = contribVals[k].mul(tokenBalance).div(totalBalance);
//       tokenBalance = tokenBalance.sub(expected);
//       totalBalance = totalBalance.sub(contribVals[k]);
//       var balance = await tst.balanceOf(accounts[k]);
//       balancesPreBonus[k] = balance;
//       assert.equal(expected.toNumber(), balance.toNumber());
//     }
//     //verify pool contract empty
//     tokens = await tst.balanceOf(contract.address);
//     assert.equal(eth2wei(0), tokens.toNumber());
//     //send bonus tokens to the contract
//     await tst.transfer(contract.address, numBonusTokens, {
//       from: accounts[9]
//     });
//     tokens = await tst.balanceOf(tst.address);
//     //verify token contract empty
//     assert.equal(0, tokens.toNumber());
//     tokens = await tst.balanceOf(contract.address);
//     //verify pool contract full
//     assert.equal(numBonusTokens, tokens.toNumber());
//     // all withdraw_bonus attempts fail bonus_received not set
//     for (var j = 1; j < 9; j++) {
//       await contract.withdraw_my_bonus_tokens({
//         from: accounts[j]
//       }).then(
//         () => assert.throw('withdraw_my_bonus_tokens() should fail -- bonus_received not set'),
//         e => assert.isAtLeast(e.message.indexOf('revert'), 0)
//       );
//     }
//     await contract.distribute_bonus().then(
//       () => assert.throw('distribute_bonus() should fail -- bonus_received not set'),
//       e => assert.isAtLeast(e.message.indexOf('revert'), 0)
//     );
//     //set bonus tokens received
//     await contract.set_tokens_received();
//     var tokenBonusBalance = new BigNumber(numBonusTokens);
//     var totalBonusBalance = total.add(ownerContrib);
//     //verify owner fee tokens
//     if (FEE_OWNER != 0) {
//       await contract.withdraw_my_bonus_tokens({
//         from: accounts[0]
//       });
//       expectedOwnerTokens = ownerContrib.mul(tokenBonusBalance).div(totalBonusBalance);
//       tokens = await tst.balanceOf(accounts[0]);
//       //subtract the balance before pulling the latest
//       assert.equal(expectedOwnerTokens.toNumber(), tokens.sub(ownerTokensBefore).toNumber());
//       tokenBonusBalance = tokenBonusBalance.sub(expectedOwnerTokens);
//       totalBonusBalance = totalBonusBalance.sub(ownerContrib);
//     }
//     // Loop through distribute function until contact token balance is zero
//     while (true) {
//       var distBalance = await tst.balanceOf(contract.address);
//       if (distBalance == 0) {
//         break;
//       }
//       await contract.distribute_bonus();
//     }
//     // all users call withdraw_my_tokens
//     for (var l = 1; l < 9; l++) {
//       var expected = contribVals[l].mul(tokenBonusBalance).div(totalBonusBalance);
//       tokenBonusBalance = tokenBonusBalance.sub(expected);
//       totalBonusBalance = totalBonusBalance.sub(contribVals[l]);
//       var balance = await tst.balanceOf(accounts[l]);
//       balance = balance.sub(balancesPreBonus[l]);
//       assert.equal(expected.toNumber(), balance.toNumber());
//     }
//     //verify contract has been emptied of tokens
//     tokens = await tst.balanceOf(contract.address);
//     assert(eth2wei(0), tokens.toNumber());
//   });
// });
//
// /**
//  * Similar to the test above, but owner takes fees in eth and dev takes fees
//  * in tokens
//  */
// contract('Contract -- owner takes fee in eth, dev in tokens', function(accounts) {
//   it('distribute and distribute bonus with fee type difference', async function() {
//     let contract = await Contract.new();
//     //disable whitelist for testing
//     await contract.set_whitelist_enabled(false);
//     //initials some values
//     var initialFunding = parseInt(eth2wei(100));
//     var totalTokens = parseInt(eth2wei(1000000000));
//     var numInitialTokens = parseInt(eth2wei(700000000));
//     var numBonusTokens = parseInt(eth2wei(300000000));
//     var contrib_step = 5;
//     var total = new BigNumber('0');
//     var fees = new BigNumber('0');
//     var feesBonus = new BigNumber('0');
//     var ownerContrib = new BigNumber('0');
//     var devContrib = new BigNumber('0');
//     var contribVals = [];
//     var feeVals = [];
//     var balancesPreBonus = [];
//     //users make contributitions in their account # * 5
//     for (var i = 1; i < 7; i++) {
//       contribVals[i] = new BigNumber(eth2wei(contrib_step * i));
//       await contract.sendTransaction({
//         from: accounts[i],
//         to: contract.address,
//         value: contribVals[i]
//       });
//       var thisFeeOwner = 0;
//       if (FEE_OWNER != 0) {
//         thisFeeOwner = thisFeeOwner.add(contribVals[i].div(FEE_OWNER));
//       }
//       var thisFeeDev = contribVals[i].div(FEE_DEV);
//       ownerContrib = ownerContrib.add(thisFeeOwner);
//       devContrib = devContrib.add(thisFeeDev);
//       contribVals[i] = contribVals[i].sub(thisFeeOwner).sub(thisFeeDev).sub(thisFeeDev);
//       total = total.add(contribVals[i]);
//       fees = fees.add(thisFeeOwner).add(thisFeeDev).add(thisFeeDev);
//     }
//     //verify proper amount of contributes
//     var testBalance = web3.eth.getBalance(contract.address);
//     assert.equal(total.add(fees).toNumber(), testBalance.toNumber());
//     //check initial balance
//     testBalance = web3.eth.getBalance(accounts[9]);
//     assert.equal(initialFunding, testBalance.toNumber());
//     //set sale then buy
//     var ownerBalanceBefore = web3.eth.getBalance(accounts[0]);
//     await contract.set_sale_address(accounts[9]);
//     await contract.buy_the_tokens('0x0');
//     //verify contract is empty
//     testBalance = web3.eth.getBalance(contract.address);
//     assert.equal(eth2wei(0), testBalance.toNumber());
//     //verify proper amount received
//     testBalance = web3.eth.getBalance(accounts[9]);
//     var expectedBalance = total.add(initialFunding).add(devContrib).add(devContrib); //dont forget address initial funding
//     assert.equal(expectedBalance.toNumber(), testBalance.toNumber());
//     //verify owner fee
//     if (FEE_OWNER != 0) {
//       testBalance = web3.eth.getBalance(accounts[0]);
//       var expectedBalance = total.add(fees).div(FEE_OWNER);
//       var feeGas = new BigNumber('17965200000000000');
//       assert.equal(expectedBalance.toNumber(), testBalance.sub(ownerBalanceBefore).add(feeGas).toNumber());
//     }
//     //launch tokens
//     let tst = await TestTokens.new(totalTokens, {
//       from: accounts[9]
//     });
//     var tokens = await tst.balanceOf(accounts[9]);
//     assert.equal(totalTokens, tokens.toNumber());
//     //send tokens to the contract
//     await tst.transfer(contract.address, numInitialTokens, {
//       from: accounts[9]
//     });
//     //verify token contract empty
//     tokens = await tst.balanceOf(accounts[9]);
//     assert.equal(numBonusTokens, tokens.toNumber());
//     //verify pool contract full
//     tokens = await tst.balanceOf(contract.address);
//     assert.equal(numInitialTokens, tokens.toNumber());
//     //set token addy
//     await contract.set_token_address(tst.address);
//     //verify tokens are in the contract
//     var tokenBalance = new BigNumber(numInitialTokens);
//     var tokenBalanceActual = await tst.balanceOf(contract.address);
//     assert.equal(tokenBalanceActual.toNumber(), tokenBalance.toNumber());
//     //verify dev1 tokens
//     var totalBalance = total.add(devContrib).add(devContrib);
//     await contract.withdraw_my_tokens({
//       from: accounts[7]
//     });
//     expectedOwnerTokens = devContrib.mul(tokenBalance).div(totalBalance);
//     tokens = await tst.balanceOf(accounts[7]);
//     assert.equal(expectedOwnerTokens.toNumber(), tokens.toNumber());
//     tokenBalance = tokenBalance.sub(expectedOwnerTokens);
//     totalBalance = totalBalance.sub(devContrib);
//     //verify dev2 tokens
//     await contract.withdraw_my_tokens({
//       from: accounts[8]
//     });
//     expectedOwnerTokens = devContrib.mul(tokenBalance).div(totalBalance);
//     tokens = await tst.balanceOf(accounts[8]);
//     assert.equal(expectedOwnerTokens.toNumber(), tokens.toNumber());
//     tokenBalance = tokenBalance.sub(expectedOwnerTokens);
//     totalBalance = totalBalance.sub(devContrib);
//
//     var devTokensBefore = tokens;
//     //Loop through distribute function until contact token balance is zero
//     while (true) {
//       var distBalance = await tst.balanceOf(contract.address);
//       if (distBalance == 0) {
//         break;
//       }
//       await contract.distribute();
//     }
//     //check all user balances
//     for (var k = 1; k < 7; k++) {
//       var expected = contribVals[k].mul(tokenBalance).div(totalBalance);
//       tokenBalance = tokenBalance.sub(expected);
//       totalBalance = totalBalance.sub(contribVals[k]);
//       var balance = await tst.balanceOf(accounts[k]);
//       balancesPreBonus[k] = balance;
//       assert.equal(expected.toNumber(), balance.toNumber());
//     }
//     //verify pool contract empty
//     tokens = await tst.balanceOf(contract.address);
//     assert.equal(eth2wei(0), tokens.toNumber());
//     //send bonus tokens to the contract
//     await tst.transfer(contract.address, numBonusTokens, {
//       from: accounts[9]
//     });
//     tokens = await tst.balanceOf(tst.address);
//     //verify token contract empty
//     assert.equal(0, tokens.toNumber());
//     tokens = await tst.balanceOf(contract.address);
//     //verify pool contract full
//     assert.equal(numBonusTokens, tokens.toNumber());
//     // all withdraw_bonus attempts fail bonus_received not set
//     for (var j = 1; j < 7; j++) {
//       await contract.withdraw_my_bonus_tokens({
//         from: accounts[j]
//       }).then(
//         () => assert.throw('withdraw_my_bonus_tokens() should fail -- bonus_received not set'),
//         e => assert.isAtLeast(e.message.indexOf('revert'), 0)
//       );
//     }
//     await contract.distribute_bonus().then(
//       () => assert.throw('distribute_bonus() should fail -- bonus_received not set'),
//       e => assert.isAtLeast(e.message.indexOf('revert'), 0)
//     );
//     //set bonus tokens received
//     await contract.set_tokens_received();
//     var tokenBonusBalance = new BigNumber(numBonusTokens);
//     var totalBonusBalance = total.add(devContrib).add(devContrib);
//     //verify dev1 bonus tokens
//     await contract.withdraw_my_bonus_tokens({
//       from: accounts[7]
//     });
//     expectedDevTokens = devContrib.mul(tokenBonusBalance).div(totalBonusBalance);
//     tokens = await tst.balanceOf(accounts[7]);
//     //subtract the balance before pulling the latest
//     assert.equal(expectedDevTokens.toNumber(), tokens.sub(devTokensBefore).toNumber());
//     tokenBonusBalance = tokenBonusBalance.sub(expectedDevTokens);
//     totalBonusBalance = totalBonusBalance.sub(devContrib);
//
//     await contract.withdraw_my_bonus_tokens({
//       from: accounts[8]
//     });
//     expectedDevTokens = devContrib.mul(tokenBonusBalance).div(totalBonusBalance);
//     tokens = await tst.balanceOf(accounts[8]);
//     //subtract the balance before pulling the latest
//     assert.equal(expectedDevTokens.toNumber(), tokens.sub(devTokensBefore).toNumber());
//     tokenBonusBalance = tokenBonusBalance.sub(expectedDevTokens);
//     totalBonusBalance = totalBonusBalance.sub(devContrib);
//     // Loop through distribute function until contact token balance is zero
//     while (true) {
//       var distBalance = await tst.balanceOf(contract.address);
//       if (distBalance == 0) {
//         break;
//       }
//       await contract.distribute_bonus();
//     }
//     // all users call withdraw_my_tokens
//     for (var l = 1; l < 7; l++) {
//       var expected = contribVals[l].mul(tokenBonusBalance).div(totalBonusBalance);
//       tokenBonusBalance = tokenBonusBalance.sub(expected);
//       totalBonusBalance = totalBonusBalance.sub(contribVals[l]);
//       var balance = await tst.balanceOf(accounts[l]);
//       balance = balance.sub(balancesPreBonus[l]);
//       assert.equal(expected.toNumber(), balance.toNumber());
//     }
//     //verify contract has been emptied of tokens
//     tokens = await tst.balanceOf(contract.address);
//     assert(eth2wei(0), tokens.toNumber());
//   });
// });
// /**
//  * Similar to the test above, but owner takes fees in eth and dev takes fees
//  * in tokens
//  */
// contract('Contract -- owner and dev take fee in tokens', function(accounts) {
//   it('distribute and distribute bonus with fee type difference', async function() {
//     let contract = await Contract.new();
//     //disable whitelist for testing
//     await contract.set_whitelist_enabled(false);
//     //initials some values
//     var initialFunding = parseInt(eth2wei(100));
//     var totalTokens = parseInt(eth2wei(1000000000));
//     var numInitialTokens = parseInt(eth2wei(700000000));
//     var numBonusTokens = parseInt(eth2wei(300000000));
//     var contrib_step = 5;
//     var total = new BigNumber('0');
//     var fees = new BigNumber('0');
//     var feesBonus = new BigNumber('0');
//     var ownerContrib = new BigNumber('0');
//     var devContrib = new BigNumber('0');
//     var contribVals = [];
//     var feeVals = [];
//     var balancesPreBonus = [];
//     //users make contributitions in their account # * 5
//     for (var i = 1; i < 7; i++) {
//       contribVals[i] = new BigNumber(eth2wei(contrib_step * i));
//       await contract.sendTransaction({
//         from: accounts[i],
//         to: contract.address,
//         value: contribVals[i]
//       });
//       var thisFeeOwner = 0;
//       if (FEE_OWNER != 0) {
//         thisFeeOwner = thisFeeOwner.add(contribVals[i].div(FEE_OWNER));
//       }
//       var thisFeeDev = contribVals[i].div(FEE_DEV);
//       ownerContrib = ownerContrib.add(thisFeeOwner);
//       devContrib = devContrib.add(thisFeeDev);
//       contribVals[i] = contribVals[i].sub(thisFeeOwner).sub(thisFeeDev).sub(thisFeeDev);
//       total = total.add(contribVals[i]);
//       fees = fees.add(thisFeeOwner).add(thisFeeDev).add(thisFeeDev);
//     }
//     //verify proper amount of contributes
//     var testBalance = web3.eth.getBalance(contract.address);
//     assert.equal(total.add(fees).toNumber(), testBalance.toNumber());
//     //check initial balance
//     testBalance = web3.eth.getBalance(accounts[9]);
//     assert.equal(initialFunding, testBalance.toNumber());
//     //set sale then buy
//     var ownerBalanceBefore = web3.eth.getBalance(accounts[0]);
//     await contract.set_sale_address(accounts[9]);
//     await contract.buy_the_tokens('0x0');
//     //verify contract is empty
//     testBalance = web3.eth.getBalance(contract.address);
//     assert.equal(eth2wei(0), testBalance.toNumber());
//     //verify proper amount received
//     testBalance = web3.eth.getBalance(accounts[9]);
//     var expectedBalance = total.add(initialFunding).add(fees); //dont forget address initial funding
//     assert.equal(expectedBalance.toNumber(), testBalance.toNumber());
//     //launch tokens
//     let tst = await TestTokens.new(totalTokens, {
//       from: accounts[9]
//     });
//     var tokens = await tst.balanceOf(accounts[9]);
//     assert.equal(totalTokens, tokens.toNumber());
//     //send tokens to the contract
//     await tst.transfer(contract.address, numInitialTokens, {
//       from: accounts[9]
//     });
//     //verify token contract empty
//     tokens = await tst.balanceOf(accounts[9]);
//     assert.equal(numBonusTokens, tokens.toNumber());
//     //verify pool contract full
//     tokens = await tst.balanceOf(contract.address);
//     assert.equal(numInitialTokens, tokens.toNumber());
//     //set token addy
//     await contract.set_token_address(tst.address);
//     //verify tokens are in the contract
//     var tokenBalance = new BigNumber(numInitialTokens);
//     var tokenBalanceActual = await tst.balanceOf(contract.address);
//     assert.equal(tokenBalanceActual.toNumber(), tokenBalance.toNumber());
//     var totalBalance = total.add(fees);
//     if (FEE_OWNER != 0) {
//       await contract.withdraw_my_tokens({
//         from: accounts[0]
//       });
//       expectedOwnerTokens = ownerContrib.mul(tokenBalance).div(totalBalance);
//       tokens = await tst.balanceOf(accounts[0]);
//       assert.equal(expectedOwnerTokens.toNumber(), tokens.toNumber());
//       tokenBalance = tokenBalance.sub(expectedOwnerTokens);
//       totalBalance = totalBalance.sub(ownerContrib);
//       var ownerTokensBefore = tokens;
//     }
//     //verify dev1 tokens
//     await contract.withdraw_my_tokens({
//       from: accounts[7]
//     });
//     expectedOwnerTokens = devContrib.mul(tokenBalance).div(totalBalance);
//     tokens = await tst.balanceOf(accounts[7]);
//     assert.equal(expectedOwnerTokens.toNumber(), tokens.toNumber());
//     tokenBalance = tokenBalance.sub(expectedOwnerTokens);
//     totalBalance = totalBalance.sub(devContrib);
//     //verify dev2 tokens
//     await contract.withdraw_my_tokens({
//       from: accounts[8]
//     });
//     expectedOwnerTokens = devContrib.mul(tokenBalance).div(totalBalance);
//     tokens = await tst.balanceOf(accounts[8]);
//     assert.equal(expectedOwnerTokens.toNumber(), tokens.toNumber());
//     tokenBalance = tokenBalance.sub(expectedOwnerTokens);
//     totalBalance = totalBalance.sub(devContrib);
//     var devTokensBefore = tokens;
//     //Loop through distribute function until contact token balance is zero
//     while (true) {
//       var distBalance = await tst.balanceOf(contract.address);
//       if (distBalance == 0) {
//         break;
//       }
//       await contract.distribute();
//     }
//     //check all user balances
//     for (var k = 1; k < 7; k++) {
//       var expected = contribVals[k].mul(tokenBalance).div(totalBalance);
//       tokenBalance = tokenBalance.sub(expected);
//       totalBalance = totalBalance.sub(contribVals[k]);
//       var balance = await tst.balanceOf(accounts[k]);
//       balancesPreBonus[k] = balance;
//       assert.equal(expected.toNumber(), balance.toNumber());
//     }
//     //verify pool contract empty
//     tokens = await tst.balanceOf(contract.address);
//     assert.equal(eth2wei(0), tokens.toNumber());
//     //send bonus tokens to the contract
//     await tst.transfer(contract.address, numBonusTokens, {
//       from: accounts[9]
//     });
//     tokens = await tst.balanceOf(tst.address);
//     //verify token contract empty
//     assert.equal(0, tokens.toNumber());
//     tokens = await tst.balanceOf(contract.address);
//     //verify pool contract full
//     assert.equal(numBonusTokens, tokens.toNumber());
//     // all withdraw_bonus attempts fail bonus_received not set
//     for (var j = 1; j < 7; j++) {
//       await contract.withdraw_my_bonus_tokens({
//         from: accounts[j]
//       }).then(
//         () => assert.throw('withdraw_my_bonus_tokens() should fail -- bonus_received not set'),
//         e => assert.isAtLeast(e.message.indexOf('revert'), 0)
//       );
//     }
//     await contract.distribute_bonus().then(
//       () => assert.throw('distribute_bonus() should fail -- bonus_received not set'),
//       e => assert.isAtLeast(e.message.indexOf('revert'), 0)
//     );
//     //set bonus tokens received
//     await contract.set_tokens_received();
//     var tokenBonusBalance = new BigNumber(numBonusTokens);
//     var totalBonusBalance = total.add(fees);
//     //verify owner fee tokens
//     if (FEE_OWNER != 0) {
//       await contract.withdraw_my_bonus_tokens({
//         from: accounts[0]
//       });
//       expectedOwnerTokens = ownerContrib.mul(tokenBonusBalance).div(totalBonusBalance);
//       tokens = await tst.balanceOf(accounts[0]);
//       //subtract the balance before pulling the latest
//       assert.equal(expectedOwnerTokens.toNumber(), tokens.sub(ownerTokensBefore).toNumber());
//       tokenBonusBalance = tokenBonusBalance.sub(expectedOwnerTokens);
//       totalBonusBalance = totalBonusBalance.sub(ownerContrib);
//     }
//     //verify dev1 bonus tokens
//     await contract.withdraw_my_bonus_tokens({
//       from: accounts[7]
//     });
//     expectedDevTokens = devContrib.mul(tokenBonusBalance).div(totalBonusBalance);
//     tokens = await tst.balanceOf(accounts[7]);
//     //subtract the balance before pulling the latest
//     assert.equal(expectedDevTokens.toNumber(), tokens.sub(devTokensBefore).toNumber());
//     tokenBonusBalance = tokenBonusBalance.sub(expectedDevTokens);
//     totalBonusBalance = totalBonusBalance.sub(devContrib);
//     //verify dev2 bonus tokens
//     await contract.withdraw_my_bonus_tokens({
//       from: accounts[8]
//     });
//     expectedDevTokens = devContrib.mul(tokenBonusBalance).div(totalBonusBalance);
//     tokens = await tst.balanceOf(accounts[8]);
//     //subtract the balance before pulling the latest
//     assert.equal(expectedDevTokens.toNumber(), tokens.sub(devTokensBefore).toNumber());
//     tokenBonusBalance = tokenBonusBalance.sub(expectedDevTokens);
//     totalBonusBalance = totalBonusBalance.sub(devContrib);
//     // Loop through distribute function until contact token balance is zero
//     while (true) {
//       var distBalance = await tst.balanceOf(contract.address);
//       if (distBalance == 0) {
//         break;
//       }
//       await contract.distribute_bonus();
//     }
//     // all users call withdraw_my_tokens
//     for (var l = 1; l < 7; l++) {
//       var expected = contribVals[l].mul(tokenBonusBalance).div(totalBonusBalance);
//       tokenBonusBalance = tokenBonusBalance.sub(expected);
//       totalBonusBalance = totalBonusBalance.sub(contribVals[l]);
//       var balance = await tst.balanceOf(accounts[l]);
//       balance = balance.sub(balancesPreBonus[l]);
//       assert.equal(expected.toNumber(), balance.toNumber());
//     }
//     //verify contract has been emptied of tokens
//     tokens = await tst.balanceOf(contract.address);
//     assert(eth2wei(0), tokens.toNumber());
//   });
// });
