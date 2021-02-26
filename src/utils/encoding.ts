import { parseUnits } from '@ethersproject/units'
import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { Provider } from '@ethersproject/providers'
import { AbiInput, InputId, InteractionTemplate, TemplateInput, TemplateLabel, TransactionAbi } from '../model/templates';

var provider: Provider | undefined = undefined

export const setProvider = (_provider: Provider) => {
    provider = _provider
}

const resolveInput = async (id: InputId | undefined, templateInputs: Record<InputId, TemplateInput>, userInputs: Record<InputId, string>): Promise<any | undefined> => {
    if (!id) return undefined
    if (id === "time_now") return new Date().getMilliseconds() / 1000
    const templateInput = templateInputs[id]
    if (!templateInput) throw Error("Invalid id " + id)
    switch (templateInput.details.type) {
        case "bn": {
            const decimals = typeof templateInput.details.decimals === "string" ? 
                await resolveInput(templateInput.details.decimals, templateInputs, userInputs) :
                templateInput.details.decimals
            return parseUnits(userInputs[id], decimals)
        }
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
        case "contractCall": {
            if (!provider) throw Error("Cannot query chain information")
            const contractInterface = new Interface(["function " + templateInput.details.signature])
            const data = contractInterface.encodeFunctionData(templateInput.details.signature, await resolveAbiInput(templateInput.details.inputs, templateInputs, userInputs))
            const to = await resolveInput(templateInput.details.target, templateInputs, userInputs)
            return contractInterface.decodeFunctionResult(templateInput.details.signature, await provider.call({ to, data }))[0]
        }
    }
}

const resolveAbiInput = async (input: AbiInput, templateInputs: Record<InputId, TemplateInput>, userInputs: Record<InputId, string>): Promise<any | undefined> => {
    return (typeof input === "string") ?
        await resolveInput(input, templateInputs, userInputs) :
        await Promise.all(input.map(async (input) => await resolveAbiInput(input, templateInputs, userInputs)))
}

const resolveData = async (data: InputId | TransactionAbi | undefined, templateInputs: Record<InputId, TemplateInput>, userInputs: Record<InputId, string>): Promise<any | undefined> => {
    if (!data) return undefined
    if (typeof data === "string") return await resolveInput(data, templateInputs, userInputs)
    const contractInterface = new Interface(["function " + data.signature])
    return contractInterface.encodeFunctionData(data.signature, await resolveAbiInput(data.inputs, templateInputs, userInputs))
}

export const resolveLabel = async (label: string | TemplateLabel | undefined, templateInputs: Record<InputId, TemplateInput>, userInputs: Record<InputId, string>): Promise<string | undefined> => {
    if (!label) return undefined
    if (typeof label === "string") return label
    const params = await Promise.all(label.params.map(async (param) => { return await resolveInput(param, templateInputs, userInputs) }))
    return label.parts.map((part) => {
        return (typeof part === "string") ? part : params[part].toString()
    }).join("")
}

export interface GeneratedTx {
    description?: string,
    to?: any,
    value?: any,
    data?: any,
}

export const buildTemplate = async (template: InteractionTemplate, userInputs: Record<InputId, string>): Promise<GeneratedTx[]> => {
    return await Promise.all(template.txs.map(async (tx) => {
        return {
            description: tx.description,
            to: await resolveInput(tx.to, template.inputs, userInputs),
            value: await resolveInput(tx.value, template.inputs, userInputs),
            data: await resolveData(tx.data, template.inputs, userInputs),
        }
    }))
}