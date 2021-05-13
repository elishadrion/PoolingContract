var ContractLib = artifacts.require("./ContractLibrary.sol");
var Contract = artifacts.require("./ContractPool.sol");

const BOGUS = "0x0fFa68181FCD4a47Ba8C33E5e254505F3C87ca77";
const NULL =  "0x0000000000000000000000000000000000000000";

module.exports = function(deployer) {
  deployer.link(ContractLib, Contract);
  deployer.deploy(Contract, (10**20).toString(), 0, 0, 0, NULL, BOGUS, true, false, []);
};
