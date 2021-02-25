import { GeneratedTx } from "./encoding";

export const checkedTx = (tx: GeneratedTx) => {
    if (!tx.to) throw Error("To is required for Safe transactions")
    return {
        to: tx.to.toString(),
        value: tx.value?.toString(),
        data: tx.data?.toString()
    }
}