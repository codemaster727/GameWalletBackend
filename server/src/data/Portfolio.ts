import { PortfolioData } from "./PortfolioData"

export interface Portfolio extends PortfolioData {
    readonly id: string
    readonly user: string
    readonly name: string
}

export interface PortfolioWithWallet extends PortfolioData {
    readonly id: string
    readonly user: string
    readonly name: string
    readonly wallet: {
        portfolio: string
        user: string
        net: string
        address: string
    }
}