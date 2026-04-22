---
url: /getting-started/best-practices.md
---

# Best Practices

Follow these best practices to build high-quality Mini Apps that provide excellent user experiences. **Use the recommended code snippets from this MiniPay developer documentation** for wallet connection, transactions, and balances; they are kept up to date with the wallet behavior.

## Wallet connection

### Run inside MiniPay and check the provider

Your app expects to run inside MiniPay where `window.ethereum` is injected. Check for the provider and show a clear message (or throw) if it's missing:

```tsx
if (typeof window.ethereum === "undefined") {
  return <div>This app must be opened from MiniPay.</div>;
}
// Or use getEthereumProvider() that throws — see Project setup / wallet-connection docs.
```

Optionally detect MiniPay: `window.ethereum?.isMiniPay === true`.

### Always auto-connect

✅ **Do**: Auto-connect on page load

```tsx
useEffect(() => {
  if (connectors.length > 0) {
    connect({ connector: connectors[0] });
  }
}, [connectors, connect]);
```

❌ **Don't**: Show a connect button

```tsx
// Never do this in Mini Apps
<button onClick={() => connect()}>Connect Wallet</button>
```

### No message signing for access

Do not prompt users to **sign a message** to access your site or to authenticate. MiniPay connects automatically; users should not need to sign an arbitrary message to use your Mini App.

### Handle connection states

Always handle connection states gracefully (Wagmi v3: use `useConnection()`):

```tsx
import { useConnection } from "wagmi";

const { isConnected, isConnecting, address } = useConnection();

if (isConnecting) {
  return <div>Connecting to MiniPay...</div>;
}

if (!isConnected || !address) {
  return <div>Please open this app from MiniPay to connect to your wallet.</div>;
}
```

## Error Handling

### User-Friendly Error Messages

Prefer error codes (from the JSON-RPC / provider error) or standard error names over message text; provider messages can change. Use a generic message when codes don't identify the error.

Provide clear, actionable error messages:

```tsx
function handleTransactionError(error: Error & { code?: number }) {
  // Prefer code or name; avoid matching on message text (provider messages can change).
  if (error.code === -32604 || error.name === "UserRejectedRequestError") {
    return "Transaction was cancelled.";
  }
  return "Transaction failed. Please try again.";
}
```

### Log Errors for Debugging

Log errors for debugging while showing user-friendly messages:

```tsx
try {
  await sendTransaction({ ... });
} catch (error) {
  console.error("Transaction error:", error); // For debugging
  showUserMessage("Transaction failed. Please try again."); // For users
}
```

### Low balance handling

If the user's balance is too low to complete an action (e.g. send, pay a network fee), redirect them to MiniPay's **Add Cash** flow so they can top up. Use the official deeplink for Add Cash — **do not hardcode the URL**, as deeplinks may change. See [Deeplinks](/technical-references/deeplinks) for the current Add Cash URL and parameters (e.g. optional token list).

## Transaction UX

### Show Loading States

Always show loading states during transactions:

```tsx
const { isPending, sendTransaction } = useSendTransaction();
const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

<button disabled={isPending || isConfirming}>
  {isPending ? "Preparing..." : isConfirming ? "Confirming..." : "Send"}
</button>;
```

### Provide Transaction Feedback

Give users clear feedback at each stage:

```tsx
{
  isPending && <div>Preparing transaction...</div>;
}
{
  isConfirming && <div>Waiting for confirmation...</div>;
}
{
  isSuccess && <div>Transaction confirmed!</div>;
}
{
  isError && <div>Transaction failed. Please try again.</div>;
}
```

### Display Transaction Hash

Show transaction hash so users can track it:

```tsx
{
  hash && (
    <div>
      <p>Transaction submitted</p>
      <a href={`https://celoscan.io/tx/${hash}`}>
        View on CeloScan
      </a>
    </div>
  );
}
```

## Security

### Validate User Input

Use a schema library like [Zod](https://zod.dev) to validate and parse user input:

```tsx
import { z } from "zod";
import { isAddress, type Address } from "viem";

const sendFormSchema = z.object({
  address: z
    .string()
    .transform((v) => v as Address)
    .refine((v) => isAddress(v), { message: "Invalid destination address" }),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
});

// Parse and validate; throws ZodError if invalid
const { address, amount } = sendFormSchema.parse({ address: userAddress, amount: userAmount });
```

### Never Store Private Keys

❌ **Never**: Store private keys or sensitive data
✅ **Do**: Rely on MiniPay for wallet management

### Verify Contract Addresses

Always verify contract addresses before interacting:

```tsx
const KNOWN_CONTRACTS = {
  USDC: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
  // ...
};

function useTokenAddress(symbol: string) {
  const address = KNOWN_CONTRACTS[symbol];
  if (!address) {
    throw new Error(`Unknown token: ${symbol}`);
  }
  return address;
}
```

## Performance

### Optimize Contract Reads

Use `enabled` to prevent unnecessary contract reads:

```tsx
const { data } = useReadContract({
  address: contractAddress,
  abi: contractAbi,
  functionName: "getValue",
  query: {
    enabled: !!address && !!contractAddress, // Only fetch when ready
  },
});
```

### Batch Contract Calls

Batch multiple reads into a single call:

```tsx
// ✅ Good: Single call
const { data } = useReadContracts({
  contracts: [
    { address, abi, functionName: "balance" },
    { address, abi, functionName: "decimals" },
    { address, abi, functionName: "symbol" },
  ],
});

// ❌ Bad: Multiple separate calls
const balance = useReadContract({ ... });
const decimals = useReadContract({ ... });
const symbol = useReadContract({ ... });
```

### Cache Contract Data

Use React Query's caching to avoid redundant calls:

```tsx
const { data } = useReadContract({
  address: contractAddress,
  abi: contractAbi,
  functionName: "getValue",
  query: {
    staleTime: 30000, // Cache for 30 seconds
  },
});
```

## User Experience

### Mobile-First Design

Design for mobile devices first:

* ✅ Touch-friendly buttons (min 44x44px)
* ✅ Readable text sizes
* ✅ Adequate spacing
* ✅ Responsive layouts

### Loading States

Show loading states for all async operations:

```tsx
const { data, isLoading } = useReadContract({ ... });

if (isLoading) {
  return <Spinner />;
}
```

### Empty States

Handle empty states gracefully:

```tsx
if (!data || data.length === 0) {
  return <div>No items found</div>;
}
```

### Error Boundaries

Use error boundaries to catch and handle errors:

```tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error("Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh.</div>;
    }
    return this.props.children;
  }
}
```

## Code Organization

### Separate Concerns

Organize code into logical modules:

```
src/
  hooks/
    useWallet.ts
    useBalance.ts
  components/
    WalletStatus.tsx
    TransactionButton.tsx
  lib/
    contracts.ts
    tokens.ts
```

### Reusable Hooks

Create reusable hooks for common patterns:

```tsx
// hooks/useTokenBalance.ts
export function useTokenBalance(tokenAddress: Address) {
  const { address } = useConnection();
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  });
}
```

### Type Safety

Use TypeScript for type safety:

```tsx
type TokenSymbol = "USDC" | "USDm" | "USDT";

function useTokenAddress(symbol: TokenSymbol): Address {
  // TypeScript ensures only valid symbols are used
}
```

## Testing

### Test Wallet Connection

Test that wallet connection works:

```tsx
// Test auto-connect
expect(connectors.length).toBeGreaterThan(0);
expect(isConnected).toBe(true);
```

### Test Error Handling

Test error scenarios:

* Insufficient funds
* Network errors
* User rejection

### Test on Both Networks

Test on both mainnet and testnet:

* ✅ Celo Mainnet (Chain ID: 42220)
* ✅ Celo Sepolia Testnet (Chain ID: 11142220)

## Common Pitfalls

### ❌ Not Auto-Connecting

Always auto-connect. Never show a connect button.

### ❌ Ignoring Errors

Always handle errors gracefully with user-friendly messages.

### ❌ Not Showing Loading States

Always show loading states during async operations.

### ❌ Hardcoding Addresses

Use environment variables or configuration for contract addresses.

### ❌ Not Validating Input

Always validate user inputs before using them.

## Next Steps

* Review [example implementations](./examples.md)
* Check [deployment guide](./deployment.md)
* See [wallet connection patterns](./wallet-connection.md)
