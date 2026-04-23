const REQUEST_FIELDS = /* GraphQL */ `
  fragment RequestFields on invoiceRequest {
    id
    requester
    counterparty
    amount
    notes
    fulfilled
    rejected
    rejectedAt
    rejectReason
    rejectedBy
    createdAt
    fulfilledInvoice {
      vault
      status
      token
      totalAmount
      totalCollected
    }
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
