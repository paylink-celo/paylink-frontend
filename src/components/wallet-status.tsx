/**
 * ⚠️  DEV ONLY — Hapus component ini sebelum production.
 *
 * MiniPay rules:
 * - Jangan tampilkan status "Connecting..." atau "Connected" ke user.
 * - Jangan tampilkan error message koneksi ke user.
 * - Koneksi harus seamless & otomatis tanpa feedback UI.
 *
 * Component ini hanya untuk debugging selama development.
 */

import { useConnection } from "wagmi";

export function WalletStatus() {
  // Hooks must be called before any early return (React rules of hooks)
  const { address, isConnected, isConnecting, chainId } = useConnection();

  if (import.meta.env.PROD) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        padding: "8px 14px",
        borderRadius: 8,
        fontSize: 12,
        fontFamily: "monospace",
        zIndex: 9999,
        background: isConnected ? "#0a2e0a" : isConnecting ? "#2e2e0a" : "#2e0a0a",
        color: isConnected ? "#4ade80" : isConnecting ? "#facc15" : "#f87171",
        border: `1px solid ${isConnected ? "#166534" : isConnecting ? "#854d0e" : "#991b1b"}`,
        opacity: 0.9,
      }}
    >
      {isConnecting && "⏳ Connecting..."}
      {isConnected && (
        <>
          ✅ {address?.slice(0, 6)}...{address?.slice(-4)}
          <span style={{ marginLeft: 8, opacity: 0.6 }}>chain:{chainId}</span>
        </>
      )}
      {!isConnecting && !isConnected && "❌ Not connected"}
    </div>
  );
}
