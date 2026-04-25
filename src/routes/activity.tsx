import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Search, X } from "lucide-react";
import { useChainId, useConnection } from "wagmi";

import { EmptyCard } from "@/components/empty-card";
import { PageHeader } from "@/components/page-header";
import { getAddresses } from "@/lib/addresses/addresses";
import { BalanceCard } from "@/features/activity/balance-card";
import { ActivityRow } from "@/features/activity/activity-row";
import { ActivityRowSkeleton } from "@/features/activity/activity-row-skeleton";
import { ReleaseFundBanner } from "@/features/activity/release-fund-banner";
import { toActivityItem } from "@/features/activity/helpers";
import { useInvoices } from "@/features/activity/use-invoices";
import type { ActivityItem } from "@/features/activity/types";
import { formatAmount } from "@/lib/format";

export const Route = createFileRoute("/activity")({ component: ActivityPage });

type TabKey = "to-pay" | "waiting" | "release" | "settled" | "other";

const TAB_LABELS: Record<TabKey, string> = {
  "to-pay": "To Pay",
  waiting: "Waiting",
  release: "Release",
  settled: "Settled",
  other: "Other",
};

function filterByTab(items: ActivityItem[], tab: TabKey): ActivityItem[] {
  switch (tab) {
    case "to-pay":
      // User needs to pay: PENDING (0) or PARTIAL (1) outgoing
      return items.filter(
        (it) => (it.status === 0 || it.status === 1) && it.direction === "out"
      );
    case "waiting":
      // Waiting for someone else to pay: PENDING (0) incoming
      return items.filter((it) => it.status === 0 && it.direction === "in");
    case "release":
      // PARTIAL (1) or FUNDED (2) where creator needs to release
      return items.filter(
        (it) => (it.status === 1 || it.status === 2) && it.direction === "in"
      );
    case "settled":
      return items.filter((it) => it.status === 3);
    case "other":
      // Cancelled (5), Disputed (4), Expired (6), or paid-as-payer (2 outgoing)
      return items.filter(
        (it) =>
          it.status === 4 ||
          it.status === 5 ||
          it.status === 6 ||
          (it.status === 2 && it.direction === "out")
      );
  }
}

const LOADING_SKELETONS = 4;
const TAB_ORDER: TabKey[] = ["to-pay", "waiting", "release", "settled", "other"];

function ActivityPage() {
  const { address } = useConnection();
  const chainId = useChainId();
  const { factory } = getAddresses(chainId);
  const { invoices, loading, error } = useInvoices();
  const [tab, setTab] = useState<TabKey>("to-pay");
  const [search, setSearch] = useState("");

  const allItems = useMemo<ActivityItem[]>(
    () => invoices.map(toActivityItem),
    [invoices]
  );

  const searched = useMemo<ActivityItem[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((it) => {
      if (it.vault.toLowerCase().includes(q)) return true;
      if (it.counterparty.toLowerCase().includes(q)) return true;
      if (it.title.toLowerCase().includes(q)) return true;
      if (it.statusLabel.toLowerCase().includes(q)) return true;
      if (formatAmount(it.amount).replace(/,/g, "").includes(q)) return true;
      return false;
    });
  }, [allItems, search]);

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = {
      "to-pay": 0,
      waiting: 0,
      release: 0,
      settled: 0,
      other: 0,
    };
    for (const it of searched) {
      if ((it.status === 0 || it.status === 1) && it.direction === "out")
        c["to-pay"]++;
      else if (it.status === 0 && it.direction === "in") c.waiting++;
      else if ((it.status === 1 || it.status === 2) && it.direction === "in")
        c.release++;
      else if (it.status === 3) c.settled++;
      else if (
        it.status === 4 ||
        it.status === 5 ||
        it.status === 6 ||
        (it.status === 2 && it.direction === "out")
      )
        c.other++;
    }
    return c;
  }, [searched]);

  const filtered = useMemo(
    () => filterByTab(searched, tab),
    [searched, tab]
  );

  function handleExport() {
    const rows = [
      ["Vault", "Title", "Counterparty", "Direction", "Amount", "Status"],
      ...filtered.map((it) => [
        it.vault,
        it.title,
        it.counterparty,
        it.direction,
        formatAmount(it.amount),
        it.statusLabel,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payme-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const emptyMessages: Record<TabKey, { title: string; body: string }> = {
    "to-pay": {
      title: "Nothing to pay",
      body: "Invoices you need to pay will appear here.",
    },
    waiting: {
      title: "Nothing waiting",
      body: "Invoices you've sent that are waiting for payment will appear here.",
    },
    release: {
      title: "Nothing to release",
      body: "Invoices that have been paid and are ready for you to release funds will appear here.",
    },
    settled: {
      title: "No settled invoices",
      body: "Completed invoices where funds have been released will appear here.",
    },
    other: {
      title: "Nothing here",
      body: "Cancelled, expired, or disputed invoices will appear here.",
    },
  };

  return (
    <div className="page-enter page-wrap pb-24 pt-3">
      <PageHeader title="Invoices" />
      <BalanceCard />

      {/* Show release banner only on Release tab */}
      {tab === "release" && <ReleaseFundBanner />}

      {/* Search + export */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search address, amount, status..."
            className="island-shell w-full rounded-2xl py-2 pl-9 pr-9 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={filtered.length === 0}
          aria-label="Export to CSV"
          className="island-shell flex h-10 w-10 items-center justify-center rounded-2xl text-[var(--lagoon-deep)] press-scale disabled:opacity-40"
        >
          <Download size={16} />
        </button>
      </div>

      {/* Sub navbar */}
      <div className="segmented mb-5" role="tablist" aria-label="Invoice filter">
        {TAB_ORDER.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`segmented-item ${tab === k ? "segmented-item--active" : ""}`}
          >
            {TAB_LABELS[k]}
            {counts[k] > 0 && (
              <span
                className={`ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                  k === "to-pay"
                    ? "bg-[#D9534F]"
                    : k === "release"
                      ? "bg-[#E08043]"
                      : k === "waiting"
                        ? "bg-[var(--status-pending)]"
                        : k === "settled"
                          ? "bg-[var(--lagoon)]"
                          : "bg-[var(--sea-ink-soft)]"
                }`}
              >
                {counts[k]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* States */}
      {!address && (
        <EmptyCard
          title="Getting ready"
          body="Connecting to your MiniPay wallet..."
          illustration="wallet"
        />
      )}
      {address && !factory && (
        <EmptyCard
          title="Not available yet"
          body="PayMe is being set up. Please try again later."
          illustration="wallet"
        />
      )}

      {address && loading && (
        <div className="grid gap-3" aria-busy aria-label="Loading activity">
          {Array.from({ length: LOADING_SKELETONS }).map((_, i) => (
            <ActivityRowSkeleton key={i} />
          ))}
        </div>
      )}

      {error && (
        <p className="text-base text-[var(--status-expired)]" role="alert">
          Something went wrong. Please try again.
        </p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid gap-3">
          {filtered.map((it, i) => (
            <div
              key={it.vault}
              className="stagger-item"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <ActivityRow item={it} />
            </div>
          ))}
        </div>
      )}

      {address && factory && !loading && filtered.length === 0 && !error && (
        <EmptyCard
          title={emptyMessages[tab].title}
          body={emptyMessages[tab].body}
          illustration="activity"
        />
      )}
    </div>
  );
}

