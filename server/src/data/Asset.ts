import { AssetData } from "./AssetData"

export interface Asset extends AssetData {
    readonly user_id: string
    readonly token_id: string
    readonly amount: number
}
