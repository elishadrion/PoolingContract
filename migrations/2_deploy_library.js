var ContractLib = artifacts.require("./ContractLibrary.sol");

module.exports = function(deployer) {
  deployer.deploy(ContractLib);
};
