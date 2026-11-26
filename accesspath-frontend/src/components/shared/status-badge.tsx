import { Badge } from "@/components/ui/badge";

const tones: Record<
  string,
  "success" | "warning" | "destructive" | "info" | "secondary" | "outline"
> = {
  ACTIVE: "success",
  APPROVED: "success",
  RESOLVED: "success",
  VERIFIED: "success",
  PENDING: "warning",
  UNDER_REVIEW: "info",
  IN_REVIEW: "info",
  REJECTED: "destructive",
  SUSPENDED: "destructive",
  DELETED: "destructive",
  INACTIVE: "secondary",
  DRAFT: "outline",
};

const label = (status: string) =>
  status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={tones[status] ?? "outline"}>{label(status)}</Badge>;
}
