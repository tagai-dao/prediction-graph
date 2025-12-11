pragma solidity ^0.5.1;

import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import { ConditionalTokens } from "./ConditionalTokens.sol";
import { CTHelpers } from "@gnosis.pm/conditional-tokens-contracts/contracts/CTHelpers.sol";
import { Create2CloneFactory } from "./Create2CloneFactory.sol";
import { FixedProductMarketMaker, FixedProductMarketMakerData } from "./FixedProductMarketMaker.sol";
import { ERC1155TokenReceiver } from "@gnosis.pm/conditional-tokens-contracts/contracts/ERC1155/ERC1155TokenReceiver.sol";
import { IUniswapV2Router } from "./IUniswap.sol";
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol'; 

import 'hardhat/console.sol';

contract FPMMDeterministicFactory is Create2CloneFactory, FixedProductMarketMakerData, ERC1155TokenReceiver, Ownable {
    event FixedProductMarketMakerCreation(
        address indexed creator,
        FixedProductMarketMaker fixedProductMarketMaker,
        ConditionalTokens conditionalTokens,
        IERC20 collateralToken,
        bytes32[] conditionIds,
        uint fee,
        uint maxFee,
        uint endTime
    );

    FixedProductMarketMaker public implementationMaster;
    address internal currentFunder;
    
    ConditionalTokens public conditionalTokensF = ConditionalTokens(0xAD1a38cEc043e70E83a3eC30443dB285ED10D774);
    address public oracleF = 0x6CCA0a99B608D53c77D12e3e0227fE76F3bc12b4;
    address public uniRouterF = 0x10ED43C718714eb63d5aA57B78B54704E256024E;
    address public wbnbF = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    address payable public protocolFeeRecipientF = 0x06Deb72b2e156Ddd383651aC3d2dAb5892d9c048;
    uint public protocolFeeBpsF = 30;

    constructor() public {
        implementationMaster = new FixedProductMarketMaker();
    }

    function adminChangeProtocolFeeRecipient(address newProtocolFeeRecipient) external onlyOwner {
        protocolFeeRecipientF = address(uint160(newProtocolFeeRecipient));
    }

    function adminChangeProtocolFeeBps(uint newProtocolFeeBps) external onlyOwner {
        protocolFeeBps = newProtocolFeeBps;
    }

    function adminChangeOracle(address newOracle) external onlyOwner {
        oracleF = newOracle;
    }

    function adminChangeConditionalTokens(address newConditionalTokens) external onlyOwner {
        conditionalTokensF = ConditionalTokens(newConditionalTokens);
    }

    function adminChangeWbnb(address newWbnb) external onlyOwner {
        wbnbF = newWbnb;
    }

    function adminChangeUniRouter(address newUniRouter) external onlyOwner {
        uniRouterF = newUniRouter;
    }

    function cloneConstructor(bytes calldata consData) external {
        (
            ConditionalTokens _conditionalTokens,
            IERC20 _collateralToken,
            bytes32[] memory _conditionIds,
            uint _fee,
            uint _maxFee,
            uint _endTime,
            address _uniRouter,
            address _wbnb,
            address _protocolFeeRecipient,
            uint _protocolFeeBps,
            address[] memory _feeCheckPath
        ) = abi.decode(consData, (ConditionalTokens, IERC20, bytes32[], uint, uint, uint, address, address, address, uint, address[]));

        _supportedInterfaces[_INTERFACE_ID_ERC165] = true;
        _supportedInterfaces[
            ERC1155TokenReceiver(0).onERC1155Received.selector ^
            ERC1155TokenReceiver(0).onERC1155BatchReceived.selector
        ] = true;
        
        conditionalTokens = _conditionalTokens;
        collateralToken = _collateralToken;
        conditionIds = _conditionIds;
        uniswapRouter = _uniRouter;
        wbnb = _wbnb;
        protocolFeeRecipient = address(uint160(_protocolFeeRecipient));
        protocolFeeBps = _protocolFeeBps;
        feePath = _feeCheckPath;
        fee = _fee;
        maxFee = _maxFee;
        startTime = block.timestamp;
        endTime = _endTime;


        uint atomicOutcomeSlotCount = 1;
        outcomeSlotCounts = new uint[](conditionIds.length);
        for (uint i = 0; i < conditionIds.length; i++) {
            uint outcomeSlotCount = conditionalTokens.getOutcomeSlotCount(conditionIds[i]);
            atomicOutcomeSlotCount *= outcomeSlotCount;
            outcomeSlotCounts[i] = outcomeSlotCount;
        }
        require(atomicOutcomeSlotCount > 1, "conditions must be valid");

        collectionIds = new bytes32[][](conditionIds.length);
        _recordCollectionIDsForAllConditions(conditionIds.length, bytes32(0));
        require(positionIds.length == atomicOutcomeSlotCount, "position IDs construction failed!?");
    }

    function _recordCollectionIDsForAllConditions(uint conditionsLeft, bytes32 parentCollectionId) private {
        if(conditionsLeft == 0) {
            positionIds.push(CTHelpers.getPositionId(collateralToken, parentCollectionId));
            return;
        }

        conditionsLeft--;

        uint outcomeSlotCount = outcomeSlotCounts[conditionsLeft];

        collectionIds[conditionsLeft].push(parentCollectionId);
        for(uint i = 0; i < outcomeSlotCount; i++) {
            _recordCollectionIDsForAllConditions(
                conditionsLeft,
                CTHelpers.getCollectionId(
                    parentCollectionId,
                    conditionIds[conditionsLeft],
                    1 << i
                )
            );
        }
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    )
        external
        returns (bytes4)
    {
        ConditionalTokens(msg.sender).safeTransferFrom(address(this), currentFunder, id, value, data);
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    )
        external
        returns (bytes4)
    {
        ConditionalTokens(msg.sender).safeBatchTransferFrom(address(this), currentFunder, ids, values, data);
        return this.onERC1155BatchReceived.selector;
    }


    function create2FixedProductMarketMaker(
        uint saltNonce,
        IERC20 collateralToken,
        bytes32[] calldata conditionIds,
        uint fee,
        uint maxFee,
        uint endTime,
        uint initialFunds,
        uint[] calldata distributionHint,
        address[] calldata feeCheckPath
    )
        external
        returns (FixedProductMarketMaker)
    {
        return _create2FixedProductMarketMaker(
            saltNonce,
            collateralToken,
            conditionIds,
            fee,
            maxFee,
            endTime,
            initialFunds,
            distributionHint,
            feeCheckPath
        );
    }

    function create2FixedProductMarketMakerWithCondition(
        IERC20 collateralToken,
        bytes32 questionId,
        uint[] calldata distributionHint,
        address[] calldata feeCheckPath,
        uint[] calldata uintParams  // [saltNonce, outcomeSlotCount, fee, maxFee, endTime, initialFunds]
    )
        external
        returns (FixedProductMarketMaker)
    {
        bytes32[] memory conditionIds = new bytes32[](1);
        
        // Scope to avoid stack too deep
        {
            bytes32 conditionId = CTHelpers.getConditionId(oracleF, questionId, uintParams[1]);
            if (conditionalTokensF.getOutcomeSlotCount(conditionId) == 0) {
                conditionalTokensF.prepareCondition(oracleF, questionId, uintParams[1], collateralToken);
            }
            conditionIds[0] = conditionId;
        }

        return _create2FixedProductMarketMaker(
            uintParams[0],
            collateralToken,
            conditionIds,
            uintParams[2],
            uintParams[3],
            uintParams[4],
            uintParams[5],
            distributionHint,
            feeCheckPath
        );
    }

    function _create2FixedProductMarketMaker(
        uint saltNonce,
        IERC20 collateralToken,
        bytes32[] memory conditionIds,
        uint fee,
        uint maxFee,
        uint endTime,
        uint initialFunds,
        uint[] memory distributionHint,
        address[] memory feeCheckPath
    )
        internal
        returns (FixedProductMarketMaker)
    {
        // Check Uniswap liquidity/route
        address[] memory path;
        if (uniRouterF != address(0) && address(collateralToken) != wbnbF) {
            if (feeCheckPath.length > 0) {
                // User specified path
                require(feeCheckPath[0] == address(collateralToken), "path must start with collateral");
                require(feeCheckPath[feeCheckPath.length - 1] == wbnbF, "path must end with wbnb");
                path = feeCheckPath;
            } else {
                // Default path
                path = new address[](2);
                path[0] = address(collateralToken);
                path[1] = wbnbF;
            }
            // Check connectivity
            uint[] memory amounts = IUniswapV2Router(uniRouterF).getAmountsOut(1000000000000000000, path);
            require(amounts[amounts.length - 1] > 0, "path is not correct");
        }

        FixedProductMarketMaker fixedProductMarketMaker = FixedProductMarketMaker(
            create2Clone(address(implementationMaster), saltNonce, abi.encode(
                conditionalTokensF,
                collateralToken,
                conditionIds,
                fee,
                maxFee,
                endTime,
                uniRouterF,
                wbnbF,
                protocolFeeRecipientF,
                protocolFeeBpsF,
                path
            ))
        );
        address creator = msg.sender;
        emit FixedProductMarketMakerCreation(
            creator,
            fixedProductMarketMaker,
            conditionalTokensF,
            collateralToken,
            conditionIds,
            fee,
            maxFee,
            endTime
        );

        if (initialFunds > 0) {
            currentFunder = creator;
            collateralToken.transferFrom(creator, address(this), initialFunds);
            collateralToken.approve(address(fixedProductMarketMaker), initialFunds);
            fixedProductMarketMaker.addFunding(initialFunds, distributionHint);
            fixedProductMarketMaker.transfer(creator, fixedProductMarketMaker.balanceOf(address(this)));
            currentFunder = address(0);
        }

        return fixedProductMarketMaker;
    }
}