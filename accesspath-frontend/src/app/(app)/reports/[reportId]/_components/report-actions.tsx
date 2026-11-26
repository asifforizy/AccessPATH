"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  addReportAttachments,
  deleteReport,
  updateReport,
} from "@/services/reports";

const statuses = ["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED"];

export function ReportActions({
  reportId,
  status,
}: {
  reportId: string;
  status: string;
}) {
  const router = useRouter();

  const [nextStatus, setNextStatus] = useState(status);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpdate = async () => {
    try {
      setLoading("update");
      const res = await updateReport(reportId, { status: nextStatus });
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleAttachment = async () => {
    try {
      setLoading("attachment");
      const res = await addReportAttachments(reportId, [
        { url: attachmentUrl },
      ]);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      setAttachmentUrl("");
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this report permanently?")) return;

    try {
      setLoading("delete");
      const res = await deleteReport(reportId);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      router.replace("/reports");
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 rounded-lg border p-4">
        <Label htmlFor="status">Update status</Label>
        <div className="flex gap-2">
          <Select
            id="status"
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value)}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("_", " ")}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            disabled={loading !== null}
            onClick={handleUpdate}
          >
            {loading === "update" && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <Label htmlFor="attachment">Add attachment URL</Label>
        <div className="flex gap-2">
          <Input
            id="attachment"
            type="url"
            value={attachmentUrl}
            onChange={(event) => setAttachmentUrl(event.target.value)}
            placeholder="https://example.com/photo.jpg"
          />
          <Button
            type="button"
            disabled={loading !== null || !attachmentUrl}
            onClick={handleAttachment}
          >
            {loading === "attachment" && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Add
          </Button>
        </div>
      </div>

      <div className="md:col-span-2">
        <Button
          type="button"
          variant="destructive"
          disabled={loading !== null}
          onClick={handleDelete}
        >
          {loading === "delete" && <Loader2 className="size-4 animate-spin" />}
          Delete report
        </Button>
      </div>
    </div>
  );
}
