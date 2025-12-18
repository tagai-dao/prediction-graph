import {
  TransferSingle as TransferSingleEvent,
  TransferBatch as TransferBatchEvent,
  ApprovalForAll as ApprovalForAllEvent,
  URI as URIEvent,
  ConditionResolution as ConditionResolutionEvent,
} from "../generated/ConditionalTokens/ConditionalTokens"
import {
  PositionMap,
  FixedProductMarketMakerCreation,
  Condition,
  ConditionalTokensTransfer
} from "../generated/schema"
import { getOrCreateUser, getOrCreateUserHolding, getIndex } from "./utils"
import { Address, Bytes, BigInt } from "@graphprotocol/graph-ts"

// Helper to normalize position ID strings (ensure even length)
function normalizePositionId(id: BigInt): string {
  let hex = id.toHexString()
  let hexWithoutPrefix = hex.slice(2)
  if (hexWithoutPrefix.length % 2 == 1) {
    hexWithoutPrefix = "0" + hexWithoutPrefix
  }
  return "0x" + hexWithoutPrefix
}

export function handleTransferSingle(event: TransferSingleEvent): void {
  // Update User Balances
  let positionIdHex = normalizePositionId(event.params.id)
  let map = PositionMap.load(positionIdHex)
  
  if (map != null) {
    let marketAddress = map.fpmm
    let outcomeIndex = map.outcomeIndex
    let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000")

    // Record Transfer
    let transfer = new ConditionalTokensTransfer(
      event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    transfer.index = getIndex("ConditionalTokensTransfer")
    transfer.fpmm = marketAddress
    transfer.from = event.params.from
    transfer.to = event.params.to
    // Convert hex string back to Bytes for storage
    transfer.positionId = Bytes.fromHexString(positionIdHex)
    transfer.outcomeIndex = BigInt.fromI32(outcomeIndex)
    transfer.value = event.params.value
    transfer.blockNumber = event.block.number
    transfer.blockTimestamp = event.block.timestamp
    transfer.transactionHash = event.transaction.hash
    transfer.save()

    // From
    if (event.params.from != zeroAddress) {
        getOrCreateUser(event.params.from, event.block, event.transaction)
        let holding = getOrCreateUserHolding(event.params.from, marketAddress)
        let balances = holding.balances
        if (outcomeIndex < balances.length) {
          balances[outcomeIndex] = balances[outcomeIndex].minus(event.params.value)
          holding.balances = balances
          holding.save()
        }
    }

    // To
    if (event.params.to != zeroAddress) {
        getOrCreateUser(event.params.to, event.block, event.transaction)
        let holding = getOrCreateUserHolding(event.params.to, marketAddress)
        let balances = holding.balances
        if (outcomeIndex < balances.length) {
          balances[outcomeIndex] = balances[outcomeIndex].plus(event.params.value)
          holding.balances = balances
          holding.save()
        }
    }
  }
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  // Update User Balances
  let ids = event.params.ids
  let values = event.params.values
  let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000")

  for (let i = 0; i < ids.length; i++) {
    let positionIdHex = normalizePositionId(ids[i])
    let map = PositionMap.load(positionIdHex)
    
    if (map != null) {
      let marketAddress = map.fpmm
      let outcomeIndex = map.outcomeIndex
      let value = values[i]

      // Record Transfer
      let transferId = event.transaction.hash.concatI32(event.logIndex.toI32()).concatI32(i)
      let transfer = new ConditionalTokensTransfer(transferId)
      transfer.index = getIndex("ConditionalTokensTransfer")
      transfer.fpmm = marketAddress
      transfer.from = event.params.from
      transfer.to = event.params.to
      transfer.positionId = Bytes.fromHexString(positionIdHex)
      transfer.outcomeIndex = BigInt.fromI32(outcomeIndex)
      transfer.value = value
      transfer.blockNumber = event.block.number
      transfer.blockTimestamp = event.block.timestamp
      transfer.transactionHash = event.transaction.hash
      transfer.save()

      // From
      if (event.params.from != zeroAddress) {
          getOrCreateUser(event.params.from, event.block, event.transaction)
          let holding = getOrCreateUserHolding(event.params.from, marketAddress)
          let balances = holding.balances
          if (outcomeIndex < balances.length) {
            balances[outcomeIndex] = balances[outcomeIndex].minus(value)
            holding.balances = balances
            holding.save()
          }
      }

      // To
      if (event.params.to != zeroAddress) {
          getOrCreateUser(event.params.to, event.block, event.transaction)
          let holding = getOrCreateUserHolding(event.params.to, marketAddress)
          let balances = holding.balances
          if (outcomeIndex < balances.length) {
            balances[outcomeIndex] = balances[outcomeIndex].plus(value)
            holding.balances = balances
            holding.save()
          }
      }
    }
  }
}

export function handleConditionResolution(event: ConditionResolutionEvent): void {
    let conditionId = event.params.conditionId
    let payoutNumerators = event.params.payoutNumerators

    // Load the Condition entity
    let condition = Condition.load(conditionId)
    if (condition != null) {
        // Find all FPMMs linked to this condition
        let fpmmIds = condition.fpmmIds
        
        for(let i=0; i<fpmmIds.length; i++) {
            let fpmmId = fpmmIds[i]
            let market = FixedProductMarketMakerCreation.load(fpmmId)
            
            if (market != null) {
                market.solved = true
                market.outcomePayouts = payoutNumerators
                market.save()
            }
        }
    }
}
