import { redirect } from "next/navigation";

// Bare /admin -> Default-Tab Metrics. Layout greift dann mit Auth-Wall.
export default function AdminIndexPage() {
  redirect("/admin/metrics");
}
