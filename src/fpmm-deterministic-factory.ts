import {
  FixedProductMarketMakerCreation as FixedProductMarketMakerCreationEvent
} from "../generated/FPMMDeterministicFactory/FPMMDeterministicFactory"
import {
  FixedProductMarketMakerCreation,
  PositionMap
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
        // Convert BigInt to Bytes (32 bytes, big endian usually desired for IDs)
        // BigInt in Graph TS behaves like a number, we want its byte representation.
        // Bytes.fromBigInt() does this? Let's verify. Yes.
        // But wait, Position ID is usually treated as a hash (bytes32).
        // The contract returns uint256.
        let positionIdBytes = Bytes.fromByteArray(ByteArray.fromBigInt(positionIdBigInt))
        
        // Ensure it's padded to 32 bytes if needed, though usually hash-like IDs are fine.
        // Actually, let's just use the hex string for the ID which is safest for Entity IDs.
        let positionIdHex = positionIdBigInt.toHexString()
        
        // For the array storage (Bytes[])
        // We can store the reversed bytes or just the bytes.
        // Let's stick to consistent Bytes representation.
        // Using Bytes.fromHexString(positionIdHex) ensures it matches the hex string ID.
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
