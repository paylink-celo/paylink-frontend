import { createFileRoute } from "@tanstack/react-router";
import { BalanceCard } from "@/features/activity/balance-card";
import { RecentActivity } from "@/features/activity/recent-activity";
import { ToPaySection } from "@/features/to-pay/to-pay-section";

export const Route = createFileRoute("/activity")({ component: ActivityPage });

function ActivityPage() {
  return (
    <div className="page-wrap pb-24 pt-3">
      <BalanceCard />
      <ToPaySection />
      <RecentActivity />
    </div>
  );
}
