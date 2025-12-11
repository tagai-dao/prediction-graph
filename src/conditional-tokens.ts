import {
  TransferSingle as TransferSingleEvent,
  TransferBatch as TransferBatchEvent,
  ApprovalForAll as ApprovalForAllEvent,
  URI as URIEvent,
} from "../generated/ConditionalTokens/ConditionalTokens"
import {
  PositionMap
} from "../generated/schema"
import { getOrCreateUser, getOrCreateUserHolding } from "./utils"
import { Address } from "@graphprotocol/graph-ts"

export function handleTransferSingle(event: TransferSingleEvent): void {
  // Update User Balances
  let positionId = event.params.id.toHexString()
  let map = PositionMap.load(positionId)
  
  if (map != null) {
    let marketAddress = map.fpmm
    let outcomeIndex = map.outcomeIndex
    let zeroAddress = Address.fromString("0x0000000000000000000000000000000000000000")

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
    let positionId = ids[i].toHexString()
    let map = PositionMap.load(positionId)
    
    if (map != null) {
      let marketAddress = map.fpmm
      let outcomeIndex = map.outcomeIndex
      let value = values[i]

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