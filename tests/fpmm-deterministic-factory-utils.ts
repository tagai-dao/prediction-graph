import { newMockEvent } from "matchstick-as"
import { ethereum, Address, Bytes, BigInt } from "@graphprotocol/graph-ts"
import {
  FixedProductMarketMakerCreation,
  OwnershipTransferred,
  FPMMFundingAdded,
  FPMMFundingRemoved,
  FPMMBuy,
  FPMMSell,
  CloneCreated
} from "../generated/FPMMDeterministicFactory/FPMMDeterministicFactory"

export function createFixedProductMarketMakerCreationEvent(
  creator: Address,
  fixedProductMarketMaker: Address,
  conditionalTokens: Address,
  collateralToken: Address,
  conditionIds: Array<Bytes>,
  fee: BigInt,
  maxFee: BigInt,
  endTime: BigInt
): FixedProductMarketMakerCreation {
  let fixedProductMarketMakerCreationEvent =
    changetype<FixedProductMarketMakerCreation>(newMockEvent())

  fixedProductMarketMakerCreationEvent.parameters = new Array()

  fixedProductMarketMakerCreationEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  fixedProductMarketMakerCreationEvent.parameters.push(
    new ethereum.EventParam(
      "fixedProductMarketMaker",
      ethereum.Value.fromAddress(fixedProductMarketMaker)
    )
  )
  fixedProductMarketMakerCreationEvent.parameters.push(
    new ethereum.EventParam(
      "conditionalTokens",
      ethereum.Value.fromAddress(conditionalTokens)
    )
  )
  fixedProductMarketMakerCreationEvent.parameters.push(
    new ethereum.EventParam(
      "collateralToken",
      ethereum.Value.fromAddress(collateralToken)
    )
  )
  fixedProductMarketMakerCreationEvent.parameters.push(
    new ethereum.EventParam(
      "conditionIds",
      ethereum.Value.fromFixedBytesArray(conditionIds)
    )
  )
  fixedProductMarketMakerCreationEvent.parameters.push(
    new ethereum.EventParam("fee", ethereum.Value.fromUnsignedBigInt(fee))
  )
  fixedProductMarketMakerCreationEvent.parameters.push(
    new ethereum.EventParam("maxFee", ethereum.Value.fromUnsignedBigInt(maxFee))
  )
  fixedProductMarketMakerCreationEvent.parameters.push(
    new ethereum.EventParam(
      "endTime",
      ethereum.Value.fromUnsignedBigInt(endTime)
    )
  )

  return fixedProductMarketMakerCreationEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createFPMMFundingAddedEvent(
  funder: Address,
  amountsAdded: Array<BigInt>,
  sharesMinted: BigInt
): FPMMFundingAdded {
  let fpmmFundingAddedEvent = changetype<FPMMFundingAdded>(newMockEvent())

  fpmmFundingAddedEvent.parameters = new Array()

  fpmmFundingAddedEvent.parameters.push(
    new ethereum.EventParam("funder", ethereum.Value.fromAddress(funder))
  )
  fpmmFundingAddedEvent.parameters.push(
    new ethereum.EventParam(
      "amountsAdded",
      ethereum.Value.fromUnsignedBigIntArray(amountsAdded)
    )
  )
  fpmmFundingAddedEvent.parameters.push(
    new ethereum.EventParam(
      "sharesMinted",
      ethereum.Value.fromUnsignedBigInt(sharesMinted)
    )
  )

  return fpmmFundingAddedEvent
}

export function createFPMMFundingRemovedEvent(
  funder: Address,
  amountsRemoved: Array<BigInt>,
  collateralRemovedFromFeePool: BigInt,
  sharesBurnt: BigInt
): FPMMFundingRemoved {
  let fpmmFundingRemovedEvent = changetype<FPMMFundingRemoved>(newMockEvent())

  fpmmFundingRemovedEvent.parameters = new Array()

  fpmmFundingRemovedEvent.parameters.push(
    new ethereum.EventParam("funder", ethereum.Value.fromAddress(funder))
  )
  fpmmFundingRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "amountsRemoved",
      ethereum.Value.fromUnsignedBigIntArray(amountsRemoved)
    )
  )
  fpmmFundingRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "collateralRemovedFromFeePool",
      ethereum.Value.fromUnsignedBigInt(collateralRemovedFromFeePool)
    )
  )
  fpmmFundingRemovedEvent.parameters.push(
    new ethereum.EventParam(
      "sharesBurnt",
      ethereum.Value.fromUnsignedBigInt(sharesBurnt)
    )
  )

  return fpmmFundingRemovedEvent
}

export function createFPMMBuyEvent(
  buyer: Address,
  investmentAmount: BigInt,
  feeAmount: BigInt,
  outcomeIndex: BigInt,
  outcomeTokensBought: BigInt
): FPMMBuy {
  let fpmmBuyEvent = changetype<FPMMBuy>(newMockEvent())

  fpmmBuyEvent.parameters = new Array()

  fpmmBuyEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  fpmmBuyEvent.parameters.push(
    new ethereum.EventParam(
      "investmentAmount",
      ethereum.Value.fromUnsignedBigInt(investmentAmount)
    )
  )
  fpmmBuyEvent.parameters.push(
    new ethereum.EventParam(
      "feeAmount",
      ethereum.Value.fromUnsignedBigInt(feeAmount)
    )
  )
  fpmmBuyEvent.parameters.push(
    new ethereum.EventParam(
      "outcomeIndex",
      ethereum.Value.fromUnsignedBigInt(outcomeIndex)
    )
  )
  fpmmBuyEvent.parameters.push(
    new ethereum.EventParam(
      "outcomeTokensBought",
      ethereum.Value.fromUnsignedBigInt(outcomeTokensBought)
    )
  )

  return fpmmBuyEvent
}

export function createFPMMSellEvent(
  seller: Address,
  returnAmount: BigInt,
  feeAmount: BigInt,
  outcomeIndex: BigInt,
  outcomeTokensSold: BigInt
): FPMMSell {
  let fpmmSellEvent = changetype<FPMMSell>(newMockEvent())

  fpmmSellEvent.parameters = new Array()

  fpmmSellEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  fpmmSellEvent.parameters.push(
    new ethereum.EventParam(
      "returnAmount",
      ethereum.Value.fromUnsignedBigInt(returnAmount)
    )
  )
  fpmmSellEvent.parameters.push(
    new ethereum.EventParam(
      "feeAmount",
      ethereum.Value.fromUnsignedBigInt(feeAmount)
    )
  )
  fpmmSellEvent.parameters.push(
    new ethereum.EventParam(
      "outcomeIndex",
      ethereum.Value.fromUnsignedBigInt(outcomeIndex)
    )
  )
  fpmmSellEvent.parameters.push(
    new ethereum.EventParam(
      "outcomeTokensSold",
      ethereum.Value.fromUnsignedBigInt(outcomeTokensSold)
    )
  )

  return fpmmSellEvent
}

export function createCloneCreatedEvent(
  target: Address,
  clone: Address
): CloneCreated {
  let cloneCreatedEvent = changetype<CloneCreated>(newMockEvent())

  cloneCreatedEvent.parameters = new Array()

  cloneCreatedEvent.parameters.push(
    new ethereum.EventParam("target", ethereum.Value.fromAddress(target))
  )
  cloneCreatedEvent.parameters.push(
    new ethereum.EventParam("clone", ethereum.Value.fromAddress(clone))
  )

  return cloneCreatedEvent
}
