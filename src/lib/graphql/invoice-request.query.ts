const REQUEST_FIELDS = /* GraphQL */ `
  fragment RequestFields on invoiceRequest {
    id
    requester
    counterparty
    amount
    notes
    fulfilled
    createdAt
    rejected
    rejectedAt
    rejectReason
    rejectedBy
    fulfilledInvoice { vault }
  }
`

export function queryInvoiceRequestsByUser() {
  return `${REQUEST_FIELDS}
    query($user: String!) {
      incoming: invoiceRequests(
        where: { counterparty: $user },
        orderBy: "createdAt",
        orderDirection: "desc",
        limit: 100
      ) {
        items { ...RequestFields }
      }
      outgoing: invoiceRequests(
        where: { requester: $user },
        orderBy: "createdAt",
        orderDirection: "desc",
        limit: 100
      ) {
        items { ...RequestFields }
      }
    }`
}
