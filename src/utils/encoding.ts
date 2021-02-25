import { parseUnits } from '@ethersproject/units'
import { Interface } from '@ethersproject/abi'
import { AbiInput, InputId, InteractionTemplate, TemplateInput, TransactionAbi } from '../model/templates';

const resolveInput = (id: InputId | undefined, templateInputs: Record<InputId, TemplateInput>, userInputs: Record<InputId, string>): any | undefined => {
    console.log("id", id)
    if (!id) return undefined
    if (id === "time_now") return new Date().getMilliseconds() / 1000
    const templateInput = templateInputs[id]
    console.log("templateInput", templateInput)
    if (!templateInput) throw Error("Invalid id " + id)
    console.log("user input", userInputs[id])
    switch (templateInput.details.type) {
        case "bn":
            return parseUnits(userInputs[id], templateInput.details.decimals)
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
    console.log("input", input)
    return (typeof input === "string") ? resolveInput(input, templateInputs, userInputs) : input.map((input) => resolveAbiInput(input, templateInputs, userInputs))
}

const resolveData = (data: InputId | TransactionAbi | undefined, templateInputs: Record<InputId, TemplateInput>, userInputs: Record<InputId, string>): any | undefined => {
    if (!data) return undefined
    if (typeof data === "string") return resolveInput(data, templateInputs, userInputs)
    const contractInterface = new Interface(["function " + data.signature])
    console.log("inputs", data.inputs)
    console.log("resolved", resolveAbiInput(data.inputs, templateInputs, userInputs))
    return contractInterface.encodeFunctionData(data.signature, resolveAbiInput(data.inputs, templateInputs, userInputs))
}

export const buildTemplate = (template: InteractionTemplate, userInputs: Record<InputId, string>) => {
    return template.txs.map((tx) => {
        return {
            to: resolveInput(tx.to, template.inputs, userInputs),
            value: resolveInput(tx.value, template.inputs, userInputs),
            data: resolveData(tx.data, template.inputs, userInputs),
        }
    })
}