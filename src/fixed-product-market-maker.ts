import { Transfer as TransferEvent } from "../generated/templates/FixedProductMarketMaker/FixedProductMarketMaker"
import { FPMMFundingAdded as FPMMFundingAddedEvent, FPMMFundingRemoved as FPMMFundingRemovedEvent, FPMMBuy as FPMMBuyEvent, FPMMSell as FPMMSellEvent } from "../generated/templates/FixedProductMarketMaker/FixedProductMarketMaker"
import { Address, BigDecimal, Bytes } from "@graphprotocol/graph-ts"
import { getOrCreateUser, getOrCreateUserHolding, getIndex } from "./utils"
import { FPMMFunding, FPMMTrade, FixedProductMarketMakerCreation, UserHolding } from "../generated/schema"

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
  let entity = new FPMMFunding(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.index = getIndex("FPMMFunding")
  entity.type = "Added"
  entity.fpmm = event.address
  entity.funder = event.params.funder
  entity.amounts = event.params.amountsAdded
  entity.shares = event.params.sharesMinted
  entity.collateralRemovedFromFeePool = null

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFPMMFundingRemoved(event: FPMMFundingRemovedEvent): void {
  let entity = new FPMMFunding(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.index = getIndex("FPMMFunding")
  entity.type = "Removed"
  entity.fpmm = event.address
  entity.funder = event.params.funder
  entity.amounts = event.params.amountsRemoved
  entity.shares = event.params.sharesBurnt
  entity.collateralRemovedFromFeePool = event.params.collateralRemovedFromFeePool

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleFPMMBuy(event: FPMMBuyEvent): void {
  let entity = new FPMMTrade(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.index = getIndex("FPMMTrade")
  entity.type = "Buy"
  entity.fpmm = event.address
  entity.creator = event.params.buyer
  entity.collateralAmount = event.params.investmentAmount
  entity.feeAmount = event.params.feeAmount
  entity.outcomeIndex = event.params.outcomeIndex
  entity.outcomeTokensAmount = event.params.outcomeTokensBought

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.outcomeTokenMarginalPrices = calculatePrices(event.address);

  entity.save()

  // Update Market Volume
  let market = FixedProductMarketMakerCreation.load(event.address)
  if (market != null) {
      market.collateralVolume = market.collateralVolume.plus(event.params.investmentAmount)
      market.save()
  }
}

export function handleFPMMSell(event: FPMMSellEvent): void {
  let entity = new FPMMTrade(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.index = getIndex("FPMMTrade")
  entity.type = "Sell"
  entity.fpmm = event.address
  entity.creator = event.params.seller
  entity.collateralAmount = event.params.returnAmount
  entity.feeAmount = event.params.feeAmount
  entity.outcomeIndex = event.params.outcomeIndex
  entity.outcomeTokensAmount = event.params.outcomeTokensSold

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.outcomeTokenMarginalPrices = calculatePrices(event.address);
  entity.save()

  // Update Market Volume
  let market = FixedProductMarketMakerCreation.load(event.address)
  if (market != null) {
      market.collateralVolume = market.collateralVolume.plus(event.params.returnAmount)
      market.save()
  }
}

function calculatePrices(fmpp: Address): Array<BigDecimal> {
  let marketHolding = UserHolding.load(fmpp.concat(fmpp))
  if (marketHolding == null) {
    return [];
  }
  let balances = marketHolding.balances;

  let weights = new Array<BigDecimal>(balances.length)
  let prices = new Array<BigDecimal>(balances.length)
  let weightSum = BigDecimal.fromString("0")

  for (let i = 0; i < balances.length; i++) {
    weights[i] = BigDecimal.fromString("1")
    for (let j = 0; j < balances.length; j++) {
      if (i == j) {
        continue
      }
      weights[i] = weights[i].times(balances[j].toBigDecimal())
    }
    weightSum = weightSum.plus(weights[i])
  }
  if (weightSum.equals(BigDecimal.fromString("0"))) {
    return prices
  }
  for (let i = 0; i < balances.length; i++) {
    prices[i] = weights[i].div(weightSum)
  }

  return prices;
}