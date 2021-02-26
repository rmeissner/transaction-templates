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

export interface ContractCallInput extends TransactionAbi {
    type: "contractCall",
    target: "string"
}

export interface UserInput {
    hint?: string
}

export interface BigNumberInput extends UserInput {
    type: "bn",
    decimals: number | InputId,
}

export interface JsonInput extends UserInput {
    type: "json"
}

export interface StringInput extends UserInput {
    type: "string"
}

export type TemplateInputType = FixedInput | BigNumberInput | JsonInput | StringInput | ContractCallInput

export interface TemplateInput {
    label?: string | TemplateLabel,
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

export interface TemplateLabel {
    parts: (string | number)[],
    params: InputId[]
}