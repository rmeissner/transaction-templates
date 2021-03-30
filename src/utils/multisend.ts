

import { Interface } from '@ethersproject/abi'
import { utils } from "ethers"
import { GeneratedTx } from './encoding'

const multiSendAddress = "0x8D29bE29923b68abfDD21e541b9374737B49cdAD"
const MultiSend = new Interface(["function multiSend(bytes memory transactions) public"])

const encodeMetaTransaction = (tx: GeneratedTx): string => {
    const data = utils.arrayify(tx.data)
    const encoded = utils.solidityPack(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [0, tx.to, tx.value, data.length, data]
    )
    return encoded.slice(2)
}


export const encodeMultiSend = (txs: GeneratedTx[]): string => {
    return "0x" + txs.map((tx) => encodeMetaTransaction(tx)).join("")
}

export const generateMultiSendTx = (txs: GeneratedTx[]) => {
    return {
        to: multiSendAddress,
        data: MultiSend.encodeFunctionData("multiSend", [encodeMultiSend(txs)])
    }
}