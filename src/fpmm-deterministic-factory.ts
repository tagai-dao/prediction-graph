import {
  FixedProductMarketMakerCreation as FixedProductMarketMakerCreationEvent
} from "../generated/FPMMDeterministicFactory/FPMMDeterministicFactory"
import {
  FixedProductMarketMakerCreation,
  PositionMap,
  Condition
} from "../generated/schema"
import { FixedProductMarketMaker } from "../generated/templates"
import { ConditionalTokens } from "../generated/ConditionalTokens/ConditionalTokens"
import { Bytes, BigInt, log, Address, ByteArray } from "@graphprotocol/graph-ts"

export function handleFixedProductMarketMakerCreation(
  event: FixedProductMarketMakerCreationEvent
): void {
  let entity = new FixedProductMarketMakerCreation(
    event.params.fixedProductMarketMaker
  )
  entity.index = BigInt.fromI32(0) // Assuming index logic is handled elsewhere or not critical for now, initializing
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
  entity.solved = false
  entity.collateralVolume = BigInt.fromI32(0)

  // Create or load Condition Entity
  if (entity.conditionIds.length > 0) {
      let conditionId = entity.conditionIds[0]
      let condition = Condition.load(conditionId)
      if (condition == null) {
          condition = new Condition(conditionId)
          condition.fpmmIds = []
      }
      let fpmmIds = condition.fpmmIds
      fpmmIds.push(entity.fixedProductMarketMaker)
      condition.fpmmIds = fpmmIds
      condition.save()
  }

  // Create Template
  FixedProductMarketMaker.create(event.params.fixedProductMarketMaker)

  // Bind ConditionalTokens Contract
  let conditionalTokensContract = ConditionalTokens.bind(event.params.conditionalTokens)
  
  // Calculate Position IDs
  let outcomeSlotCounts = new Array<i32>()
  let conditionIds = event.params.conditionIds
  
  for (let i = 0; i < conditionIds.length; i++) {
    let result = conditionalTokensContract.try_getOutcomeSlotCount(conditionIds[i])
    if (!result.reverted) {
      outcomeSlotCounts.push(result.value.toI32())
    } else {
      outcomeSlotCounts.push(2)
      log.warning("Failed to get outcome slot count for condition: {}", [conditionIds[i].toHexString()])
    }
  }

  // Generate all atomic positions
  let totalOutcomes = 1
  for (let i = 0; i < outcomeSlotCounts.length; i++) {
    totalOutcomes *= outcomeSlotCounts[i]
  }

  let savedPositionIds = new Array<Bytes>()

  for (let k = 0; k < totalOutcomes; k++) {
    let currentVal = k
    let indices = new Array<i32>(conditionIds.length)
    
    // 1. Calculate indices for each condition
    for (let c = 0; c < conditionIds.length; c++) {
      let slots = outcomeSlotCounts[c]
      indices[c] = currentVal % slots
      currentVal = currentVal / slots // integer division
    }
    
    // 2. Build Collection ID (From Last to First) using Contract Calls
    let collectionId = Bytes.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000000") as Bytes
    
    let collectionIdFailed = false
    for (let c = conditionIds.length - 1; c >= 0; c--) {
      let indexSet = BigInt.fromI32(1).leftShift(indices[c] as u8)
      
      let result = conditionalTokensContract.try_getCollectionId(collectionId, conditionIds[c], indexSet)
      if (!result.reverted) {
        collectionId = result.value
      } else {
        log.error("Failed to get collection ID from contract", [])
        collectionIdFailed = true
        break
      }
    }
    
    if (collectionIdFailed) continue

    // 3. Calculate Position ID using Contract Call
    // Convert entity.collateralToken (Bytes) to Address
    let collateralTokenAddress = Address.fromBytes(entity.collateralToken)
    let positionIdResult = conditionalTokensContract.try_getPositionId(collateralTokenAddress, collectionId)
    
    if (!positionIdResult.reverted) {
        let positionIdBigInt = positionIdResult.value
        
        // Convert BigInt to hex string for Entity ID
        // toHexString() may return odd-length hex strings (without leading zeros)
        // ByteArray.fromHexString() requires even-length hex strings
        let positionIdHex = positionIdBigInt.toHexString()
        
        // Ensure hex string has even length (each byte needs 2 hex chars)
        // Remove '0x' prefix, check length, pad if odd, then add prefix back
        let hexWithoutPrefix = positionIdHex.slice(2) // Remove '0x'
        if (hexWithoutPrefix.length % 2 == 1) {
            // If odd length, pad with leading zero
            hexWithoutPrefix = "0" + hexWithoutPrefix
        }
        positionIdHex = "0x" + hexWithoutPrefix
        
        // Convert to Bytes for array storage
        // Bytes.fromHexString() now works because hex string has even length
        let positionId = Bytes.fromHexString(positionIdHex) as Bytes
        
        savedPositionIds.push(positionId)
        
        // 4. Create Map Entity
        let mapEntity = new PositionMap(positionIdHex)
        mapEntity.fpmm = entity.id // Store as link
        mapEntity.outcomeIndex = k
        mapEntity.save()
    } else {
        log.error("Failed to get position ID from contract", [])
    }
  }

  entity.positionIds = savedPositionIds
  entity.save()
}
