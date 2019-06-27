const Bounties = artifacts.require("Bounties");

module.exports = function(deployer) {
  deployer.deploy(Bounties);
};
