// var BigNumber = require('../lib/bignumber.js.min');
// var Refund = artifacts.require("refund.sol");
//
// function eth2wei(eth) {
//   return web3.toWei(eth.toString(), 'ether');
// }
//
// function wei2eth(wei) {
//   return web3.fromWei(wei.toString(), 'ether');
// }
//
// contract('Refund -- Basic', function(accounts) {
//   it("Test basic refund where user's perform their own refunds", async function() {
//     let contract = await Refund.new();
//     var reduction = 31;
//     var initialVal = new BigNumber(eth2wei(100));
//     var totalContribs = new BigNumber(eth2wei(75));
//     var gasCost = new BigNumber('1936900000000000');
//     console.log("Total Contributions: " + wei2eth(totalContribs.toNumber())+"ETH");
//     var totalRefund = totalContribs.mul(reduction).div(100);
//     console.log("Total Refund: " + wei2eth(totalRefund.toNumber())+"ETH");
//     await contract.sendTransaction({
//       from: accounts[0],
//       to: contract.address,
//       value: totalRefund
//     });
//
//     var refunds = [
//       new BigNumber(eth2wei(5)),
//       new BigNumber(eth2wei(5)), //split account 2 into two contribs
//       new BigNumber(eth2wei(15)),
//       new BigNumber(eth2wei(20)),
//       new BigNumber(eth2wei(25)),
//       new BigNumber(eth2wei(5)) //account 2 second tx
//     ];
//     await contract.add_addys(
//       [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5], accounts[2]],
//       refunds
//     );
//     console.log("Override User 5 Contribution");
//     await contract.change_specific_addy(accounts[5], eth2wei(10));
//
//     for(var i = 1; i <= 5; i ++) {
//       var thisContrib = refunds[i-1];
//       if(i == 5 || i == 2) { //account 5's value was changed and account 2 had two contribs
//         thisContrib = new BigNumber(eth2wei(10));
//       }
//       var thisRefund = thisContrib.mul(reduction).div(100).sub(gasCost);
//       console.log("["+i+"] Expected Refund: " + wei2eth(thisRefund.toNumber())+"ETH");
//       var balanceBefore = web3.eth.getBalance(accounts[i]).sub(initialVal);
//       await contract.refund({from: accounts[i]});
//       var balanceAfter = web3.eth.getBalance(accounts[i]).sub(initialVal);
//       assert.equal(thisRefund.toNumber(), balanceAfter.toNumber());
//       console.log("["+i+"] Balance After: " + wei2eth(balanceAfter.toNumber())+"ETH");
//       console.log("");
//     }
//
//     //check the proper remainer from editing contributor 5 remains
//     var fullRefund5 = refunds[5-1].mul(reduction).div(100).sub(gasCost);
//     var actualRefund5 = new BigNumber(eth2wei(10));
//     var actualRefund5 = actualRefund5.mul(reduction).div(100).sub(gasCost);
//     var expectBalanceAfter = fullRefund5.sub(actualRefund5);
//     var contractBalanceAfter = web3.eth.getBalance(contract.address);
//     assert.equal(expectBalanceAfter.toNumber(), contractBalanceAfter.toNumber());
//
//   });
// });
//
// contract('Refund -- Direct', function(accounts) {
//   it("Make sure direct refund works", async function() {
//     let contract = await Refund.new();
//     var reduction = 31;
//     var initialVal = new BigNumber(eth2wei(100));
//     var totalContribs = new BigNumber(eth2wei(75));
//     console.log("Total Contributions: " + wei2eth(totalContribs.toNumber())+"ETH");
//     var totalRefund = totalContribs.mul(reduction).div(100);
//     console.log("Total Refund: " + wei2eth(totalRefund.toNumber())+"ETH");
//     await contract.sendTransaction({
//       from: accounts[0],
//       to: contract.address,
//       value: totalRefund
//     });
//
//     var refunds = [
//       new BigNumber(eth2wei(5)),
//       new BigNumber(eth2wei(10)),
//       new BigNumber(eth2wei(15)),
//       new BigNumber(eth2wei(20)),
//       new BigNumber(eth2wei(25))
//     ];
//     await contract.direct_refunds(
//       [accounts[1], accounts[2], accounts[3], accounts[4], accounts[5]],
//       refunds
//     );
//
//     for(var i = 1; i <= 5; i ++) {
//       var thisContrib = refunds[i-1];
//       var thisRefund = thisContrib.mul(reduction).div(100);
//       console.log("["+i+"] Expected Refund: " + wei2eth(thisRefund.toNumber())+"ETH");;
//       var balance = web3.eth.getBalance(accounts[i]).sub(initialVal);
//       assert.equal(thisRefund.toNumber(), balance.toNumber());
//       console.log("["+i+"] Balance After: " + wei2eth(balance.toNumber())+"ETH");
//       console.log("");
//     }
//     //verify contract empty
//     var contractBalanceAfter = web3.eth.getBalance(contract.address);
//     assert.equal(0, contractBalanceAfter.toNumber());
//
//   });
// });
