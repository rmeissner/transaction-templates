import { InteractionTemplate } from "../model/templates";

export const compoundTemplate: InteractionTemplate = {
    name: "Compound",
    inputs: {
        "tokenContract": {
            details: {
                type: "fixed",
                value: "0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa"
            }
        },
        "compoundContract": {
            details: {
                type: "fixed",
                value: "0x6D7F0754FFeb405d23C51CE938289d4835bE3b14"
            }
        },
        "tokenAmount": {
            label: "Tokens to put into compound",
            details: {
                type: "bn",
                decimals: 18
            }
        }
    },
    txs: [
        {
            to: "tokenContract", data: {
                signature: "approve(address sender, uint256 amount)",
                inputs: ["compoundContract", "tokenAmount"]
            }
        },
        {
            to: "compoundContract", data: {
                signature: "mint(uint256 amount)",
                inputs: ["tokenAmount"]
            }
        }
    ]
}