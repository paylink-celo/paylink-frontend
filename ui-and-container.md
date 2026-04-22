---
url: /getting-started/ui-and-container.md
---

# UI & container integration

Mini Apps run inside MiniPay's in-app browser. This page covers viewport behavior, navigation, theming, and mobile constraints so your app feels native in the container.

## Viewport and layout

* **Mobile only:** Mini Apps run on phones. Design for small viewports. Interfaces must be responsive and fully functional at **360×720px** minimum (360×640px is also still common on older Android devices). A practical target is 375px width — don’t build for desktop or tablet layouts.
* **Single column:** A single-column layout works best. Avoid horizontal scrolling; use full-width or near full-width content.
* **Height:** The viewport height can change (keyboard open, browser chrome). Prefer `min-height` and scrollable content rather than assuming a fixed height.

## Navigation

* **In-app browser:** Users open your app from the MiniPay Discover page. There is no traditional browser address bar or tabs; back/forward is controlled by MiniPay or the WebView.
* **In-app routing:** Use your framework’s router (e.g. React Router, TanStack Router) for multi-page flows. Avoid relying on the browser’s history for critical flows; keep state in React (or URL params) when possible.
* **External links:** There are no tabs in the Mini App; links open in the same view and may leave the Mini App context. Use a normal link (no `target="_blank"`). For “back to MiniPay” or external actions, a normal link is fine.

## Theming

* **No required theme:** MiniPay does not inject a mandatory theme or design tokens. You choose colors, typography, and spacing.
* **Dark mode (optional):** You can support `prefers-color-scheme: dark` for users who prefer dark UI. So that system UI (scrollbars, form controls) follows the theme, set the [color-scheme meta tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/color-scheme) in your `<head>` (e.g. `<meta name="color-scheme" content="light dark">`) or use `color-scheme: light dark` in CSS on `:root`. Then style with media queries:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --text: #e5e5e5;
  }
}
```

Avoid doing this in JavaScript:

```ts
const prefersDark = window.matchMedia("prefers-color-scheme: dark").matches;
```

* **Contrast:** Keep text and interactive elements readable (e.g. [WCAG](https://www.w3.org/WAI/WCAG21/quickref/) AA). See [Design standards](/design-standards/) for more.

## Mobile constraints

| Concern           | Recommendation                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| **Touch targets** | Buttons and links at least 44×44px; adequate spacing between tappable elements.                                 |
| **Text size**     | Body text at least 16px; avoid very small labels.                                                               |
| **Performance**   | Lazy-load below-the-fold content; avoid heavy work on first paint so the app feels fast.                        |
| **Network**       | Some users are on slow or unstable connections. Show loading states and handle errors; avoid assuming fast RPC. |
| **Viewport**      | Don’t assume a fixed width or height; test on large and small phones.                                           |

## Summary

* Design for mobile, single column.
* Use in-app routing for multi-step flows; external links may leave the Mini App.
* Theming is up to you; optional dark mode improves accessibility.
* Keep touch targets large, text readable, and first load light.

For more UI guidelines, see [Design standards](/design-standards/). For testing inside MiniPay, see [Test in MiniPay](/getting-started/test-in-minipay).
