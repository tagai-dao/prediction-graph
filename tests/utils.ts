import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { FixedProductMarketMakerCreation } from "../generated/FPMMDeterministicFactory/FPMMDeterministicFactory"
import { TransferSingle } from "../generated/ConditionalTokens/ConditionalTokens"
import { Transfer } from "../generated/templates/FixedProductMarketMaker/ERC20"

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
  let mockEvent = newMockEvent()
  let newEvent = new FixedProductMarketMakerCreation(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt
  )

  newEvent.parameters = new Array()

  newEvent.parameters.push(
    new ethereum.EventParam("creator", ethereum.Value.fromAddress(creator))
  )
  newEvent.parameters.push(
    new ethereum.EventParam(
      "fixedProductMarketMaker",
      ethereum.Value.fromAddress(fixedProductMarketMaker)
    )
  )
  newEvent.parameters.push(
    new ethereum.EventParam(
      "conditionalTokens",
      ethereum.Value.fromAddress(conditionalTokens)
    )
  )
  newEvent.parameters.push(
    new ethereum.EventParam(
      "collateralToken",
      ethereum.Value.fromAddress(collateralToken)
    )
  )
  newEvent.parameters.push(
    new ethereum.EventParam(
      "conditionIds",
      ethereum.Value.fromFixedBytesArray(conditionIds)
    )
  )
  newEvent.parameters.push(
    new ethereum.EventParam("fee", ethereum.Value.fromUnsignedBigInt(fee))
  )
  newEvent.parameters.push(
    new ethereum.EventParam("maxFee", ethereum.Value.fromUnsignedBigInt(maxFee))
  )
  newEvent.parameters.push(
    new ethereum.EventParam("endTime", ethereum.Value.fromUnsignedBigInt(endTime))
  )

  return newEvent
}

export function createTransferSingleEvent(
  operator: Address,
  from: Address,
  to: Address,
  id: BigInt,
  value: BigInt
): TransferSingle {
  let mockEvent = newMockEvent()
  let newEvent = new TransferSingle(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt
  )

  newEvent.parameters = new Array()

  newEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  newEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  newEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  newEvent.parameters.push(
    new ethereum.EventParam("id", ethereum.Value.fromUnsignedBigInt(id))
  )
  newEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return newEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt,
  address: Address
): Transfer {
  let mockEvent = newMockEvent()
  mockEvent.address = address
  let newEvent = new Transfer(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    mockEvent.receipt
  )

  newEvent.parameters = new Array()

  newEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  newEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  newEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return newEvent
}

