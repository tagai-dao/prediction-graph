import {
  FixedProductMarketMakerCreation as FixedProductMarketMakerCreationEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  FPMMFundingAdded as FPMMFundingAddedEvent,
  FPMMFundingRemoved as FPMMFundingRemovedEvent,
  FPMMBuy as FPMMBuyEvent,
  FPMMSell as FPMMSellEvent,
  CloneCreated as CloneCreatedEvent
} from "../generated/FPMMDeterministicFactory/FPMMDeterministicFactory"
import {
  FixedProductMarketMakerCreation,
  OwnershipTransferred,
  FPMMFundingAdded,
  FPMMFundingRemoved,
  FPMMBuy,
  FPMMSell,
  CloneCreated
} from "../generated/schema"

export function handleFixedProductMarketMakerCreation(
  event: FixedProductMarketMakerCreationEvent
): void {
  let entity = new FixedProductMarketMakerCreation(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.creator = event.params.creator
  entity.fixedProductMarketMaker = event.params.fixedProductMarketMaker
  entity.conditionalTokens = event.params.conditionalTokens
  entity.collateralToken = event.params.collateralToken
  entity.conditionIds = event.params.conditionIds
  entity.fee = event.params.fee
  entity.maxFee = event.params.maxFee
  entity.endTime = event.params.endTime

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFPMMFundingAdded(event: FPMMFundingAddedEvent): void {
  let entity = new FPMMFundingAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.funder = event.params.funder
  entity.amountsAdded = event.params.amountsAdded
  entity.sharesMinted = event.params.sharesMinted

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFPMMFundingRemoved(event: FPMMFundingRemovedEvent): void {
  let entity = new FPMMFundingRemoved(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.funder = event.params.funder
  entity.amountsRemoved = event.params.amountsRemoved
  entity.collateralRemovedFromFeePool =
    event.params.collateralRemovedFromFeePool
  entity.sharesBurnt = event.params.sharesBurnt

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFPMMBuy(event: FPMMBuyEvent): void {
  let entity = new FPMMBuy(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.buyer = event.params.buyer
  entity.investmentAmount = event.params.investmentAmount
  entity.feeAmount = event.params.feeAmount
  entity.outcomeIndex = event.params.outcomeIndex
  entity.outcomeTokensBought = event.params.outcomeTokensBought

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFPMMSell(event: FPMMSellEvent): void {
  let entity = new FPMMSell(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.seller = event.params.seller
  entity.returnAmount = event.params.returnAmount
  entity.feeAmount = event.params.feeAmount
  entity.outcomeIndex = event.params.outcomeIndex
  entity.outcomeTokensSold = event.params.outcomeTokensSold

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleCloneCreated(event: CloneCreatedEvent): void {
  let entity = new CloneCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.target = event.params.target
  entity.clone = event.params.clone

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
