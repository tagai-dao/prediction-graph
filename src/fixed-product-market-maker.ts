import { Transfer as TransferEvent } from "../generated/templates/FixedProductMarketMaker/FixedProductMarketMaker"
import { FPMMFundingAdded as FPMMFundingAddedEvent, FPMMFundingRemoved as FPMMFundingRemovedEvent, FPMMBuy as FPMMBuyEvent, FPMMSell as FPMMSellEvent } from "../generated/templates/FixedProductMarketMaker/FixedProductMarketMaker"
import { Address } from "@graphprotocol/graph-ts"
import { getOrCreateUser, getOrCreateUserHolding, getIndex } from "./utils"
import { FPMMFundingAdded, FPMMFundingRemoved, FPMMBuy, FPMMSell, FixedProductMarketMakerCreation } from "../generated/schema"

export function handleTransfer(event: TransferEvent): void {
    let marketAddress = event.address
    let value = event.params.value
    let from = event.params.from
    let to = event.params.to
    
    let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000")

    // Update From
    if (from != zeroAddress) {
        getOrCreateUser(from, event.block, event.transaction)
        let holding = getOrCreateUserHolding(from, marketAddress)
        holding.lpHolding = holding.lpHolding.minus(value)
        holding.save()
    }

    // Update To
    if (to != zeroAddress) {
        getOrCreateUser(to, event.block, event.transaction)
        let holding = getOrCreateUserHolding(to, marketAddress)
        holding.lpHolding = holding.lpHolding.plus(value)
        holding.save()
    }
}

export function handleFPMMFundingAdded(event: FPMMFundingAddedEvent): void {
  let entity = new FPMMFundingAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.index = getIndex("FPMMFundingAdded")
  entity.fpmm = event.address
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
  entity.index = getIndex("FPMMFundingRemoved")
  entity.fpmm = event.address
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
  entity.index = getIndex("FPMMBuy")
  entity.fpmm = event.address
  entity.buyer = event.params.buyer
  entity.investmentAmount = event.params.investmentAmount
  entity.feeAmount = event.params.feeAmount
  entity.outcomeIndex = event.params.outcomeIndex
  entity.outcomeTokensBought = event.params.outcomeTokensBought

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Update Market Volume
  let market = FixedProductMarketMakerCreation.load(event.address)
  if (market != null) {
      market.collateralVolume = market.collateralVolume.plus(event.params.investmentAmount)
      market.save()
  }
}

export function handleFPMMSell(event: FPMMSellEvent): void {
  let entity = new FPMMSell(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.index = getIndex("FPMMSell")
  entity.fpmm = event.address
  entity.seller = event.params.seller
  entity.returnAmount = event.params.returnAmount
  entity.feeAmount = event.params.feeAmount
  entity.outcomeIndex = event.params.outcomeIndex
  entity.outcomeTokensSold = event.params.outcomeTokensSold

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  // Update Market Volume
  let market = FixedProductMarketMakerCreation.load(event.address)
  if (market != null) {
      market.collateralVolume = market.collateralVolume.plus(event.params.returnAmount)
      market.save()
  }
}
