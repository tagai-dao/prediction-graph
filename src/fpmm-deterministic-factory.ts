import {
  FixedProductMarketMakerCreation as FixedProductMarketMakerCreationEvent
} from "../generated/FPMMDeterministicFactory/FPMMDeterministicFactory"
import {
  FixedProductMarketMakerCreation,
  PositionMap
} from "../generated/schema"
import { FixedProductMarketMaker } from "../generated/templates"
import { ConditionalTokens } from "../generated/ConditionalTokens/ConditionalTokens"
import { Bytes, BigInt, crypto, ByteArray, Address, log } from "@graphprotocol/graph-ts"

// Helper: Calculate Collection ID
function getCollectionId(parentCollectionId: Bytes, conditionId: Bytes, indexSet: BigInt): Bytes {
  // abi.encodePacked(parentCollectionId, conditionId, indexSet)
  // parentCollectionId: bytes32
  // conditionId: bytes32
  // indexSet: uint256 (32 bytes)
  
  let indexSetBytes = ByteArray.fromBigInt(indexSet)
  // Pad indexSet to 32 bytes
  if (indexSetBytes.length < 32) {
    let padded = new Uint8Array(32)
    // Reverse because fromBigInt is typically Big Endian, but let's double check.
    // graph-ts BigInt is usually treated as uint256 big endian in conversions?
    // Actually ByteArray.fromBigInt returns Big Endian.
    // Padding should be at the front (zeros).
    // e.g. [0, 0, ... value]
    
    // Efficient padding:
    let offset = 32 - indexSetBytes.length
    for (let i = 0; i < indexSetBytes.length; i++) {
      padded[offset + i] = indexSetBytes[i]
    }
    indexSetBytes = Bytes.fromUint8Array(padded)
  }

  let packed = new Uint8Array(96) // 32 + 32 + 32
  
  for(let i=0; i<32; i++) packed[i] = parentCollectionId[i]
  for(let i=0; i<32; i++) packed[32+i] = conditionId[i]
  for(let i=0; i<32; i++) packed[64+i] = indexSetBytes[i]

  return crypto.keccak256(Bytes.fromUint8Array(packed))
}

// Helper: Calculate Position ID
function getPositionId(collateralToken: Address, collectionId: Bytes): Bytes {
  // abi.encodePacked(collateralToken, collectionId)
  // collateralToken: address (20 bytes) - but solidity packs tightly?
  // NO, wait. getPositionId in CTHelpers:
  // keccak256(abi.encodePacked(collateralToken, collectionId))
  
  let packed = new Uint8Array(20 + 32)
  for(let i=0; i<20; i++) packed[i] = collateralToken[i]
  for(let i=0; i<32; i++) packed[20+i] = collectionId[i]
  
  return crypto.keccak256(Bytes.fromUint8Array(packed))
}

export function handleFixedProductMarketMakerCreation(
  event: FixedProductMarketMakerCreationEvent
): void {
  let entity = new FixedProductMarketMakerCreation(
    event.params.fixedProductMarketMaker
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
  entity.solved = false // Initialize

  // Create Template
  FixedProductMarketMaker.create(event.params.fixedProductMarketMaker)

  // Calculate Position IDs
  let conditionalTokensContract = ConditionalTokens.bind(event.params.conditionalTokens)
  let outcomeSlotCounts = new Array<i32>()
  let conditionIds = event.params.conditionIds
  
  for (let i = 0; i < conditionIds.length; i++) {
    let result = conditionalTokensContract.try_getOutcomeSlotCount(conditionIds[i])
    if (!result.reverted) {
      outcomeSlotCounts.push(result.value.toI32())
    } else {
      // Default to 2 if call fails (should not happen usually)
      outcomeSlotCounts.push(2)
      log.warning("Failed to get outcome slot count for condition: {}", [conditionIds[i].toHexString()])
    }
  }

  // Generate all atomic positions
  let totalOutcomes = 1
  for (let i = 0; i < outcomeSlotCounts.length; i++) {
    totalOutcomes *= outcomeSlotCounts[i]
  }

  let positionIds = new Array<Bytes>()
  
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
    
    // 2. Build Collection ID (From Last to First)
    let collectionId = Bytes.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000000") as Bytes
    for (let c = conditionIds.length - 1; c >= 0; c--) {
      let indexSet = BigInt.fromI32(1).leftShift(indices[c] as u8)
      collectionId = getCollectionId(collectionId, conditionIds[c], indexSet)
    }
    
    // 3. Calculate Position ID
    let positionId = getPositionId(entity.collateralToken, collectionId)
    savedPositionIds.push(positionId)
    
    // 4. Create Map Entity
    let mapEntity = new PositionMap(positionId.toHexString())
    mapEntity.fpmm = entity.id // Store as link
    mapEntity.outcomeIndex = k
    mapEntity.save()
  }

  entity.positionIds = savedPositionIds
  entity.save()
}
