
import { getMyReports } from "@/services/reports";
import { RecentReportsCard } from "./recent-report-card";


export async function RecentReportsSection() {
  const reports = await getMyReports(5);
  return <RecentReportsCard reports={reports.data ?? []} />;
}