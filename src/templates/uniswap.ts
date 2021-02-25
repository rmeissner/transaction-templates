import { InteractionTemplate } from "../model/templates";
const template: InteractionTemplate = {
    name: "Uniswap",
    inputs: {
        "zero": {
            details: {
                type: "fixed",
                value: "0"
            }
        },
        "deadline": {
            details: {
                type: "fixed",
                value: "0xFFFFFFFFFFFFFFFF"
            }
        },
        "uniswapContract": {
            details: {
                type: "fixed",
                value: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
            }
        },
        "sellToken": {
            label: "Token to sell",
            details: {
                type: "json"
            }
        },
        "buyToken": {
            label: "Token to buy",
            details: {
                type: "json"
            }
        },
        "tokenAmount": {
            label: "Tokens amount to sell",
            details: {
                type: "bn",
                decimals: 18
            }
        },
        "receipient": {
            label: "Receipient of tokens",
            details: {
                type: "json"
            }
        }
    },
    txs: [
        {
            to: "sellToken", data: {
                signature: "approve(address sender, uint256 amount)",
                inputs: ["uniswapContract", "tokenAmount"]
            }
        },
        {
            to: "uniswapContract", data: {
                signature: "swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline)",
                inputs: ["tokenAmount", "zero", ["sellToken", "buyToken"], "receipient", "deadline"]
            }
        }
    ]
}

export default template