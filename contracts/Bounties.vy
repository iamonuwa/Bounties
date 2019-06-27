struct Bounty:
    issuer: address
    deadline: timestamp
    data: bytes32
    status: uint256
    amount: wei_value

struct Fulfillment:
    accepted: bool
    fulfiller_address: address
    data: bytes32

BountyIssued: event({_id: int128, _issuer: indexed(address), _amount: wei_value, data: bytes32 })
BountyCancelled: event({ _id: int128, _issuer: indexed(address), _amount: wei_value })
BountyFulfilled: event({ _bountyId: int128, _issuer: indexed(address), _fulfiller: indexed(address), _fulfillmentId: int128, _amount: wei_value})
FulfillmentAccepted: event({ _bountyId: int128, _issuer: indexed(address), _fulfiller: indexed(address), _fulfillmentId: int128, _amount: wei_value })

CREATED: constant(uint256) = 0
ACCEPTED: constant(uint256) = 1
CANCELLED: constant(uint256) = 2

bounties: map(int128, Bounty)
fulfillments: map(int128, Fulfillment)

nextBountyIndex: int128
nextFulfillmentIndex: int128
    
@public  
@payable
def issueBounty(_data: bytes32, _deadline: timestamp):
    assert msg.value > 0
    assert _deadline > block.timestamp
    
    bIndex: int128 = self.nextBountyIndex
    
    self.bounties[bIndex] = Bounty({ issuer: msg.sender, deadline: _deadline, data: _data, status: 0, amount: msg.value })
    self.nextBountyIndex = bIndex + 1

    log.BountyIssued(bIndex, msg.sender, msg.value, _data)
    
@public
@payable
def fulfillBounty(_bountyId: int128, _data: bytes32):
    # confirm that bounty exists
    assert _bountyId < self.nextBountyIndex
    # assert _fulfillmentId < self.nextFulfillmentIndex
    # confirm fulfiller is not the issuer
    assert msg.sender != self.bounties[_bountyId].issuer
    # confirm bounty status is created
    assert self.bounties[_bountyId].status == 0
    # confirm submission is before deadline
    assert block.timestamp < self.bounties[_bountyId].deadline
    
    fIndex: int128 = self.nextFulfillmentIndex
    self.fulfillments[fIndex] = Fulfillment({ accepted: False, fulfiller_address: msg.sender, data: _data})
    
    log.BountyFulfilled(_bountyId, self.bounties[_bountyId].issuer, msg.sender, fIndex, msg.value)

@public
def acceptFulfillment(_bountyId: int128, _fulfillmentId: int128):
    # confirm that bounty exists
    assert _bountyId < self.nextBountyIndex
    assert _fulfillmentId < self.nextFulfillmentIndex
    # confirm fulfiller is not the issuer
    assert msg.sender == self.bounties[_bountyId].issuer
    # confirm bounty status is created
    assert self.bounties[_bountyId].status == 0
    # confirm bounty has not been accepted
    assert self.fulfillments[_fulfillmentId].accepted == False
    
    self.fulfillments[_fulfillmentId].accepted = True
    self.bounties[_bountyId].status = 1
    send(self.fulfillments[_fulfillmentId].fulfiller_address, self.bounties[_bountyId].amount)
    
    log.FulfillmentAccepted(_bountyId, self.bounties[_bountyId].issuer, self.fulfillments[_fulfillmentId].fulfiller_address, _fulfillmentId, self.bounties[_bountyId].amount)
    
    
@public
def cancelBounty(_bountyId: int128):
    assert _bountyId < self.nextBountyIndex
    assert msg.sender == self.bounties[_bountyId].issuer
    assert self.bounties[_bountyId].status == 0
    self.bounties[_bountyId].status = 2
    send(self.bounties[_bountyId].issuer, self.bounties[_bountyId].amount)
    clear(self.bounties[_bountyId])

    log.BountyCancelled(_bountyId, self.bounties[_bountyId].issuer, self.bounties[_bountyId].amount)