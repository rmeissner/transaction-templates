import { GeneratedTx } from "./encoding";

export const checkedTx = (tx: GeneratedTx) => {
    if (!tx.to) throw Error("To is required for Safe transactions")
    return {
        to: tx.to.toString(),
        value: tx.value?.toString() || "0",
        data: tx.data?.toString() || "0x"
    }
}