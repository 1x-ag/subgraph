import { ByteArray, Bytes, Address, BigInt, crypto } from '@graphprotocol/graph-ts';
import { ClosePosition as ClosePositionEvent, OpenPosition as OpenPositionEvent } from '../generated/Contract/Contract';
import { Position } from '../generated/schema';

function padHex(hex: string, length: i32): string {
    if (hex.startsWith('0x')) {
        hex = hex.substr(2);
    }
    return hex.padStart(length, '0');
}

let allowedContracts: Array<Address> = [];

function isAllowedContract(contract: Address): boolean {
    if (allowedContracts.length == 0) {
        allowedContracts = [
            Bytes.fromHexString("0x7778d1011e19c0091c930d4befa2b0e47441562a") as Address,
            Bytes.fromHexString("0x0b05ba1c72325b11b5553216c9e57257f82b71d8") as Address
        ];
    }

    return allowedContracts.indexOf(contract) !== -1;
}

function hashOfPosition(
    contract: Bytes,
    owner: Bytes
): ByteArray {
    return crypto.keccak256(
        ByteArray.fromHexString(
            padHex(contract.toHex(), 40) +
            padHex(owner.toHex().substr(2), 40)
        )
    );
}

function hashOfPositionNew(
    contract: Bytes,
    owner: Bytes,
    blockNumber: BigInt,
    logIndex: BigInt
): ByteArray {
    return crypto.keccak256(
        ByteArray.fromHexString(
            padHex(contract.toHex(), 40) +
            padHex(owner.toHex().substr(2), 40) +
            padHex(blockNumber.toHexString(), 64) +
            padHex(owner.toHexString(), 64)
        )
    );
}

export function handleOpenPosition(event: OpenPositionEvent): void {

    if (!isAllowedContract(event.address)) {
        return;
    }

    let entity_id = hashOfPosition(
        event.address,
        event.params.owner
    ).toHex();

    let entity = Position.load(entity_id);

    if (entity) {
        let oldEntity = new Position(
            hashOfPositionNew(
                event.address,
                event.params.owner,
                event.block.number,
                event.logIndex
            ).toHex()
        );
        oldEntity.contract = entity.contract;
        oldEntity.owner = entity.owner;
        oldEntity.amount = entity.amount;
        oldEntity.stopLoss = entity.stopLoss;
        oldEntity.takeProfit = entity.takeProfit;
        oldEntity.closed = true;
        oldEntity.save();
    } else {
        entity = new Position(entity_id);
    }

    entity.contract = event.address;
    entity.owner = event.params.owner;
    entity.amount = event.params.amount;
    entity.stopLoss = event.params.stopLoss;
    entity.takeProfit = event.params.takeProfit;
    entity.closed = false;
    entity.save();
}

export function handleClosePosition(event: ClosePositionEvent): void {

    if (!isAllowedContract(event.address)) {
        return;
    }

    let entity_id = hashOfPosition(
        event.address,
        event.params.owner
    ).toHex();

    let entity = Position.load(entity_id);

    if (entity) {
        let oldEntity = new Position(
            hashOfPositionNew(
                event.address,
                event.params.owner,
                event.block.number,
                event.logIndex
            ).toHex()
        );
        oldEntity.contract = entity.contract;
        oldEntity.owner = entity.owner;
        oldEntity.amount = entity.amount;
        oldEntity.stopLoss = entity.stopLoss;
        oldEntity.takeProfit = entity.takeProfit;
        oldEntity.closed = true;
        oldEntity.save();

        entity.contract = Bytes.fromHexString("0x0000000000000000000000000000000000000000") as Bytes;
        entity.owner = Bytes.fromHexString("0x0000000000000000000000000000000000000000") as Bytes;
        entity.save();
    }
}
