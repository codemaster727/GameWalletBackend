// import Request from "../requests/Request"
// import Response from "../responses/Response"

export default interface Handler<T, R> {
    validateRequest(request: any): Promise<T>

    authenticateRequest(request: T): Promise<T>

    authorizeRequest(request: T): Promise<T>

    processRequest(request: T): Promise<R>

    handleRequest(request: any): Promise<R>
}
