export interface InteractionTemplate {
    name: string,
    inputs: Record<InputId, TemplateInput>,
    txs: TransactionTemplate[],
}

export type InputId = string

export interface FixedInput {
    type: "fixed",
    value: string
}

export interface UserInput {
    hint?: string
}

export interface BigNumberInput extends UserInput {
    type: "bn",
    decimals: number,
}

export interface JsonInput extends UserInput {
    type: "json"
}

export type TemplateInputType = FixedInput | BigNumberInput | JsonInput

export interface TemplateInput {
    label?: string,
    details: TemplateInputType
}

export interface TransactionTemplate {
    description?: string,
    to: InputId,
    value?: InputId,
    data?: InputId | TransactionAbi
}

export type AbiInput = InputId | AbiInput[]

export interface TransactionAbi {
    signature: string,
    inputs: AbiInput[]
}