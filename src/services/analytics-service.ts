import type { DashboardMetric } from "@/types";

export function getBusinessMetrics(): DashboardMetric[] {
  return [
    { label: "Discovery views", value: "18.4K", delta: "+22% vs last month", tone: "green" },
    { label: "Route requests", value: "812", delta: "+14% from mobility", tone: "blue" },
    { label: "Saved by users", value: "1.4K", delta: "+9% from AI picks", tone: "amber" },
    { label: "Check-ins", value: "436", delta: "+31% QR flow", tone: "rose" }
  ];
}

export function getAdminMetrics(): DashboardMetric[] {
  return [
    { label: "Pending businesses", value: "12", delta: "4 need document review", tone: "amber" },
    { label: "Flagged reviews", value: "8", delta: "2 high priority", tone: "rose" },
    { label: "Approved places", value: "284", delta: "+18 this week", tone: "green" },
    { label: "API health", value: "99.8%", delta: "cache hit rate 74%", tone: "blue" }
  ];
}
