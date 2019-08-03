const BN = require("bignumber.js");
const chai = require("chai");
const bnChai = require("bn-chai");
const { expect } = chai;
chai.use(bnChai(BN));
const Bounties = artifacts.require("Bounties");
const getCurrentTime = require("./utils/time").getCurrentTime;
const increaseTimeInSeconds = require("./utils/time").increaseTimeInSeconds;
const assertRevert = require("./utils/assertRevert").assertRevert;
const dayInSeconds = 86400;

contract("Bounties", function(accounts) {
  let bountiesInstance;

  beforeEach(async () => {
    bountiesInstance = await Bounties.new();
  });

  it("Should allow a user to issue a new bounty", async () => {
    let time = await getCurrentTime();
    let tx = await bountiesInstance.issueBounty(
      "0x736f6d6520726571756972656d656e7473",
      1691452800,
      { from: accounts[0], value: 500000000000 }
    );
    assert.strictEqual(
      tx.receipt.logs.length,
      1,
      "issueBounty() call did not log 1 event"
    );
    assert.strictEqual(
      tx.logs.length,
      1,
      "issueBounty() call did not log 1 event"
    );
    const logBountyIssued = tx.logs[0];
    assert.strictEqual(
      logBountyIssued.event,
      "BountyIssued",
      "issueBounty() call did not log event BountyIssued"
    );
    expect(logBountyIssued.args._id).to.eq.BN(0);
    assert.strictEqual(
      logBountyIssued.args._issuer,
      accounts[0],
      "BountyIssued event logged did not have expected issuer"
    );
    assert.strictEqual(
      logBountyIssued.args._amount.toNumber(),
      500000000000,
      "BountyIssued event logged did not have expected amount"
    );
  });
  it("Should return an integer when calling issueBounty", async () => {
    let time = await getCurrentTime();
    let result = await bountiesInstance.issueBounty.call(
      '0x736f6d6520726571756972656d656e7473',
      time + dayInSeconds * 2,
      { from: accounts[0], value: 500000000000, gas: 3000000 }
	);
	
	expect(result).to.be.empty;
  });
  it("Should not allow a user to issue a bounty without sending ETH", async () => {
    let time = await getCurrentTime()
    assertRevert(bountiesInstance.issueBounty('0x736f6d6520726571756972656d656e7473',
                                time + (dayInSeconds * 2),
                                {from: accounts[0]}), "Bounty issued without sending ETH");

  });

  it("Should not allow a user to issue a bounty when sending value of 0", async () => {
    let time = await getCurrentTime()
    assertRevert(bountiesInstance.issueBounty('0x736f6d6520726571756972656d656e7473',
                                time + (dayInSeconds * 2),
                                {from: accounts[0], value: 0}), "Bounty issued when sending value of 0");

  });

  it("Should not allow a user to issue a bounty with a deadline in the past", async () => {
    let time = await getCurrentTime()
    assertRevert(bountiesInstance.issueBounty('0x736f6d6520726571756972656d656e7473',
                                time - 1,
                                {from: accounts[0], value: 0}), "Bounty issued with deadline in the past");

  });

  it("Should not allow a user to issue a bounty with a deadline of now", async () => {
    let time = await getCurrentTime()
    assertRevert(bountiesInstance.issueBounty('0x736f6d6520726571756972656d656e7473',
                                time,
                                {from: accounts[0], value: 0}), "Bounty issued with deadline of now");

  });

  it("Should not allow a user to fulfil an existing bounty where the deadline has passed", async () => {
    let time = await getCurrentTime()
    await bountiesInstance.issueBounty('0x736f6d6520726571756972656d656e7473',
                      time+ (dayInSeconds * 2),
                      {from: accounts[0], value: 500000000000});

    await increaseTimeInSeconds((dayInSeconds * 2)+1)

    assertRevert(bountiesInstance.fulfillBounty(0,'0x736f6d6520726571756972656d656e7473',{from: accounts[1]}), "Fulfillment accepted when deadline has passed");

  });
});
