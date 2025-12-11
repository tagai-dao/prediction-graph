import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, Bytes, BigInt } from "@graphprotocol/graph-ts"
import { FixedProductMarketMakerCreation } from "../generated/schema"
import { FixedProductMarketMakerCreation as FixedProductMarketMakerCreationEvent } from "../generated/FPMMDeterministicFactory/FPMMDeterministicFactory"
import { handleFixedProductMarketMakerCreation } from "../src/fpmm-deterministic-factory"
import { createFixedProductMarketMakerCreationEvent } from "./fpmm-deterministic-factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let creator = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let fixedProductMarketMaker = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let conditionalTokens = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let collateralToken = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let conditionIds = [Bytes.fromI32(1234567890)]
    let fee = BigInt.fromI32(234)
    let maxFee = BigInt.fromI32(234)
    let endTime = BigInt.fromI32(234)
    let newFixedProductMarketMakerCreationEvent =
      createFixedProductMarketMakerCreationEvent(
        creator,
        fixedProductMarketMaker,
        conditionalTokens,
        collateralToken,
        conditionIds,
        fee,
        maxFee,
        endTime
      )
    handleFixedProductMarketMakerCreation(
      newFixedProductMarketMakerCreationEvent
    )
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("FixedProductMarketMakerCreation created and stored", () => {
    assert.entityCount("FixedProductMarketMakerCreation", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "FixedProductMarketMakerCreation",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "creator",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "FixedProductMarketMakerCreation",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "fixedProductMarketMaker",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "FixedProductMarketMakerCreation",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "conditionalTokens",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "FixedProductMarketMakerCreation",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "collateralToken",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "FixedProductMarketMakerCreation",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "conditionIds",
      "[1234567890]"
    )
    assert.fieldEquals(
      "FixedProductMarketMakerCreation",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "fee",
      "234"
    )
    assert.fieldEquals(
      "FixedProductMarketMakerCreation",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "maxFee",
      "234"
    )
    assert.fieldEquals(
      "FixedProductMarketMakerCreation",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "endTime",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
