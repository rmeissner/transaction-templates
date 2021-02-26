import { parseUnits } from '@ethersproject/units'
import { Interface } from '@ethersproject/abi'
import { AbiInput, InputId, InteractionTemplate, TemplateInput, TransactionAbi } from '../model/templates';

const resolveInput = (id: InputId | undefined, templateInputs: Record<InputId, TemplateInput>, userInputs: Record<InputId, string>): any | undefined => {
    if (!id) return undefined
    if (id === "time_now") return new Date().getMilliseconds() / 1000
    const templateInput = templateInputs[id]
    if (!templateInput) throw Error("Invalid id " + id)
    switch (templateInput.details.type) {
        case "bn":
            return parseUnits(userInputs[id], templateInput.details.decimals)
        case "string":
            return userInputs[id]
        case "json":
            try {
                return JSON.parse(userInputs[id])
            } catch (e) {
                return userInputs[id]
            }
        case "fixed":
            return templateInput.details.value
    }
}

const resolveAbiInput = (input: AbiInput, templateInputs: Record<InputId, TemplateInput>, userInputs: Record<InputId, string>): any | undefined => {
    return (typeof input === "string") ? resolveInput(input, templateInputs, userInputs) : input.map((input) => resolveAbiInput(input, templateInputs, userInputs))
}

const resolveData = (data: InputId | TransactionAbi | undefined, templateInputs: Record<InputId, TemplateInput>, userInputs: Record<InputId, string>): any | undefined => {
    if (!data) return undefined
    if (typeof data === "string") return resolveInput(data, templateInputs, userInputs)
    const contractInterface = new Interface(["function " + data.signature])
    return contractInterface.encodeFunctionData(data.signature, resolveAbiInput(data.inputs, templateInputs, userInputs))
}

export interface GeneratedTx {
    description?: string,
    to?: any,
    value?: any,
    data?: any,
}

export const buildTemplate = (template: InteractionTemplate, userInputs: Record<InputId, string>): GeneratedTx[] => {
    return template.txs.map((tx) => {
        return {
            description: tx.description,
            to: resolveInput(tx.to, template.inputs, userInputs),
            value: resolveInput(tx.value, template.inputs, userInputs),
            data: resolveData(tx.data, template.inputs, userInputs),
        }
    })
}