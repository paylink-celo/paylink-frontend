const INVOICE_FIELDS = /* GraphQL */ `
  fragment InvoiceFields on invoice {
    id
    vault
    creator
    token
    totalAmount
    totalCollected
    dueDate
    createdAt
    status
    metadataURI
    isOpenPayment
  }
`

export function queryInvoicesByUser() {
  return `${INVOICE_FIELDS}
    query($user: String!) {
      sent: invoices(
        where: { creator: $user },
        orderBy: "createdAt",
        orderDirection: "desc",
        limit: 100
      ) {
        items { ...InvoiceFields }
      }
      received: payers(where: { payer: $user }, limit: 100) {
        items { invoice { ...InvoiceFields } }
      }
    }`
}
