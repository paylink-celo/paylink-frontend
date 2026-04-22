---
url: /design-standards.md
---
# Design Standards

Design guidelines for creating Mini Apps that integrate seamlessly with MiniPay.

## Mobile-First Design

Mini Apps are primarily used on mobile devices. Design with mobile in mind:

### Touch Targets

* ✅ Minimum touch target size: **44x44 pixels**
* ✅ Adequate spacing between interactive elements
* ✅ Large, easy-to-tap buttons

### Typography

* ✅ Use readable font sizes: **16px** minimum for body text (avoid smaller than 14px)
* ✅ Sufficient contrast ratios ([WCAG](https://www.w3.org/WAI/WCAG21/quickref/) AA minimum)

### Layout

* ✅ Single column layouts work best
* ✅ Avoid horizontal scrolling
* ✅ Use full-width elements where appropriate
* ✅ Consider safe areas (notches, status bars) — see [UI & container](/getting-started/ui-and-container) for viewport and safe-area details

## Wallet Integration UI

### Phone-first identity

MiniPay users identify via their phone numbers. In your UI:

* ✅ Prefer showing phone number or a user-friendly identifier where possible (e.g. via [phone number lookup](/technical-references/phone-number-lookup)).
* ❌ Avoid displaying raw `0x…` wallet addresses to users unless necessary (e.g. for advanced or copy-to-clipboard use cases).

### Connection errors

MiniPay abstracts connection away from the user. Don't surface "Connecting..." or "Connected" states; only show the user a message when connection fails.

```tsx
// Only show an error when connection fails
{
  connectionFailed && <div>Could not connect to MiniPay.</div>;
}
```

Recovery options are limited: if your mini app implements [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963), you can call `requestProvider()` so MiniPay re-announces the provider; otherwise the user may need to refresh the page (and success is not guaranteed).

### Transaction States

Provide clear transaction feedback:

```tsx
// Pending
<button disabled>Preparing transaction...</button>

// Confirming
<div>Transaction submitted. Waiting for confirmation...</div>

// Success
<div>✅ Transaction confirmed!</div>

// Error
<div>❌ Transaction failed. Please try again.</div>
```

### Balance Display

Format balances clearly:

```tsx
// Good: Clear formatting
<div>
  <span className="amount">1,234.56</span>
  <span className="currency">USDC</span>
</div>;

// Good: With loading state
{
  isLoading ? (
    <div>Loading balance...</div>
  ) : (
    <div>
      {formattedBalance} {symbol}
    </div>
  );
}
```

## Color and Theming

### Support Dark Mode

Consider supporting dark mode for better user experience. So that system UI (scrollbars, form controls) matches the theme, set the [color-scheme meta tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/color-scheme) in your `<head>` (e.g. `<meta name="color-scheme" content="light dark">`) or use `color-scheme: light dark` in CSS on `:root`. Prefer CSS for styling so the browser applies the theme without JavaScript:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --text: #e5e5e5;
  }
}

@media (prefers-color-scheme: light) {
  :root {
    --bg: #ffffff;
    --text: #1a1a1a;
  }
}
```

Use JavaScript (e.g. `window.matchMedia('(prefers-color-scheme: dark)')`) only when you need to branch logic, not for styling.

### Contrast

Ensure sufficient contrast for readability:

* Text on background: **4.5:1** minimum ([WCAG](https://www.w3.org/WAI/WCAG21/quickref/) AA)
* Large text: **3:1** minimum
* Interactive elements: Clear visual feedback

## Accessibility

### Screen Readers

Make your app accessible to screen readers:

* ✅ Semantic HTML elements
* ✅ ARIA labels where needed
* ✅ Alt text for images
* ✅ Descriptive button labels

### Error Messages

Provide clear, accessible error messages:

```tsx
// Good: Clear, descriptive
<div role="alert">
  <p>Transaction failed: Insufficient balance</p>
  <p>You need at least 10 USDC to complete this transaction.</p>
</div>

// Bad: Vague
<div>Error occurred</div>
```

## Performance

### Loading States

Always show loading states:

```tsx
// Good: Clear loading indicator
{
  isLoading ? (
    <div>
      <Spinner />
      <p>Loading...</p>
    </div>
  ) : (
    <Content />
  );
}
```

### Optimize Images

* ✅ Prefer SVG for icons and vector graphics (scalable, small)
* ✅ Use appropriate raster formats for photos (WebP, AVIF)
* ✅ Compress images
* ✅ Lazy load images below the fold

### Minimize Bundle Size

* ✅ Code splitting
* ✅ Tree shaking
* ✅ Remove unused dependencies
* ✅ Optimize imports

## User Experience

### User-facing language (terminology)

Use simple, non-jargon language so users who are new to digital money feel at home:

| Use this | Not this |
| -------- | -------- |
| **Network fee** | Gas |
| **Deposit** | Onramp, Buy |
| **Withdraw** | Offramp, Sell |
| **Stablecoin** or **Digital dollar** | Crypto token |

### Error Handling

Prefer error codes (e.g. from the JSON-RPC / provider error object) or standard error names over matching on message text, since provider messages can change. When codes don't identify the error, use a generic user-facing message.

**Stable references:** The [JSON-RPC 2.0 spec](https://www.jsonrpc.org/specification#error_object) defines standard error codes: `-32700` (Parse error), `-32600` (Invalid request), `-32601` (Method not found), `-32602` (Invalid params), `-32603` (Internal error), `-32604` (Permission denied). MiniPay uses these codes in JSON-RPC responses. Prefer checking `error.code` or `error.name` over `error.message`.

Provide helpful error messages:

```tsx
function ErrorMessage({ error }: { error: Error & { code?: number } }) {
  // Prefer code or name; avoid matching on message text (provider messages can change).
  const message =
    error.code === -32604 || error.name === "UserRejectedRequestError"
      ? "Transaction was cancelled"
      : "Something went wrong";

  return (
    <div className="error">
      <p>{message}</p>
      <button onClick={retry}>Try Again</button>
    </div>
  );
}
```

### Empty States

Handle empty states gracefully:

```tsx
{
  items.length === 0 ? (
    <div className="empty-state">
      <p>No items found</p>
      <button onClick={createItem}>Create Item</button>
    </div>
  ) : (
    <ItemList items={items} />
  );
}
```

### Confirmation Dialogs

Use confirmation dialogs for important actions:

```tsx
function ConfirmDialog({ onConfirm, onCancel }: Props) {
  return (
    <div className="modal">
      <p>Are you sure you want to proceed?</p>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}
```

## Best Practices

1. **Mobile only**: Mini apps run on phones. Design for small viewports.
2. **Fast loading**: Optimize for quick load times
3. **Clear feedback**: Show loading, success, and error states
4. **Accessible**: Follow [WCAG](https://www.w3.org/WAI/WCAG21/quickref/) guidelines
5. **Consistent**: Use consistent patterns throughout your app

## Next Steps

* Review [best practices](../getting-started/best-practices.md)
* Check [example implementations](../getting-started/examples.md)
* See [wallet connection patterns](../getting-started/wallet-connection.md)
