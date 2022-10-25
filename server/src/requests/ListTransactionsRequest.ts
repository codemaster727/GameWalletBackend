export interface ListTransactionsRequest {
    readonly id?: string
    readonly user_id: string
    readonly token_id?: string
    readonly net_id?: string
    readonly type?: string
    readonly amount?: number
    readonly limit?: number
    readonly page_number?: number
}

export interface AddTransactionsRequest {
    readonly user_id: string
    readonly token_id: string
    readonly net_id: string
    readonly hash: string
    readonly address: string
    readonly type: string
    readonly amount: number
}
