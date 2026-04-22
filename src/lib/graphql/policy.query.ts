/**
 * Subgraph queries for PayerPolicy state.
 *
 * Mirrors the events emitted by `PayerPolicy.sol`:
 *   - PolicySet / PolicyRevoked    → `policySetting`
 *   - CreatorAllowedUpdated /
 *     CreatorBlockedUpdated        → `creatorPermission`
 *   - SpendRecorded                → `policySpend`
 *
 * Entity names follow the camelCase convention used by the existing
 * `invoice` / `invoiceRequest` queries in this folder. Adjust the names
 * here if the Ponder schema ships with different ones — UI consumers only
 * depend on the fragment field shape.
 */

const POLICY_SETTING_FIELDS = /* GraphQL */ `
  fragment PolicySettingFields on policySetting {
    id
    payer
    maxPerTx
    maxPerDay
    expiresAt
    minReputation
    useWhitelist
    active
    dayStart
    spentToday
    updatedAt
  }
`

const CREATOR_PERMISSION_FIELDS = /* GraphQL */ `
  fragment CreatorPermissionFields on creatorPermission {
    id
    payer
    creator
    allowed
    blocked
    updatedAt
  }
`

const POLICY_SPEND_FIELDS = /* GraphQL */ `
  fragment PolicySpendFields on policySpend {
    id
    payer
    creator
    amount
    spentTodayAfter
    timestamp
    txHash
  }
`

/** Fetch the single active policy for a payer (if any). */
export function queryPolicySettingByPayer() {
  return `${POLICY_SETTING_FIELDS}
    query($payer: String!) {
      policySettings(where: { payer: $payer }, limit: 1) {
        items { ...PolicySettingFields }
      }
    }`
}

/** Fetch all per-creator allow/block overrides set by a payer. */
export function queryCreatorPermissionsByPayer() {
  return `${CREATOR_PERMISSION_FIELDS}
    query($payer: String!) {
      creatorPermissions(where: { payer: $payer }, limit: 200) {
        items { ...CreatorPermissionFields }
      }
    }`
}

/** Fetch recent spend records for a payer (newest first). */
export function queryPolicySpendsByPayer(limit = 100) {
  return `${POLICY_SPEND_FIELDS}
    query($payer: String!) {
      policySpends(
        where: { payer: $payer }
        orderBy: "timestamp"
        orderDirection: "desc"
        limit: ${limit}
      ) {
        items { ...PolicySpendFields }
      }
    }`
}

/** Combined dashboard payload for a single payer. */
export function queryPayerPolicyDashboard() {
  return `${POLICY_SETTING_FIELDS}
    ${CREATOR_PERMISSION_FIELDS}
    ${POLICY_SPEND_FIELDS}
    query($payer: String!) {
      policy: policySettings(where: { payer: $payer }, limit: 1) {
        items { ...PolicySettingFields }
      }
      permissions: creatorPermissions(where: { payer: $payer }, limit: 200) {
        items { ...CreatorPermissionFields }
      }
      spends: policySpends(
        where: { payer: $payer }
        orderBy: "timestamp"
        orderDirection: "desc"
        limit: 100
      ) {
        items { ...PolicySpendFields }
      }
    }`
}
