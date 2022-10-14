export interface WithdrawAssetRequest {
    readonly authorization?: string
    readonly user: string
    readonly net: string
    readonly asset: string
    readonly amount: number
    readonly receiver: string
}
