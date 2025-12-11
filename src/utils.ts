import { User, UserHolding, FixedProductMarketMakerCreation, Counter } from "../generated/schema"
import { BigInt, Bytes, Address, ethereum } from "@graphprotocol/graph-ts"

export const BigIntOne = BigInt.fromU64(1);
export const Zero = BigInt.zero();
export const OneEther = BigInt.fromString('1000000000000000000');

export function getOrCreateUser(address: Address, block: ethereum.Block, tx: ethereum.Transaction): User {
    let id = address
    let user = User.load(id)
    if (user == null) {
        user = new User(id)
        user.index = getIndex("User");
        user.address = address
        user.blockNumber = block.number
        user.blockTimestamp = block.timestamp
        user.transactionHash = tx.hash
        user.save()
    }
    return user as User
}

export function getIndex(type: string): BigInt {
    let counter = Counter.load(Bytes.fromUTF8(type));
    if (!counter) {
        counter = new Counter(Bytes.fromUTF8(type));
        counter.index = Zero;
    }
    counter.index = counter.index.plus(BigIntOne);
    counter.save();
    return counter.index;
}

export function getOrCreateUserHolding(userAddress: Address, marketAddress: Bytes): UserHolding {
    let id = marketAddress.concat(userAddress)
    let holding = UserHolding.load(id)
    
    if (holding == null) {
        holding = new UserHolding(id)
        holding.user = userAddress
        holding.fpmm = marketAddress as Bytes
        holding.lpHolding = BigInt.fromI32(0)
        
        // Initialize balances based on Market's outcomes
        let market = FixedProductMarketMakerCreation.load(marketAddress)
        let numOutcomes = 2 
        if (market != null) {
            numOutcomes = market.positionIds.length
        }
        
        let balances = new Array<BigInt>(numOutcomes)
        for(let i=0; i<numOutcomes; i++) {
            balances[i] = BigInt.fromI32(0)
        }
        holding.balances = balances
        holding.save()
    }
    return holding as UserHolding
}

