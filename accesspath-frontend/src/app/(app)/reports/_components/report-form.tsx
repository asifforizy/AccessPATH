"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createReport } from "@/services/reports";

const reportTypes = [
  "ACCESSIBILITY_ISSUE",
  "INCORRECT_INFORMATION",
  "LOCATION_CLOSED",
  "MISSING_FEATURE",
  "OTHER",
];

export function ReportForm() {
  const router = useRouter();

  const [locationId, setLocationId] = useState("");
  const [type, setType] = useState(reportTypes[0]);
  const [description, setDescription] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);

      const res = await createReport({
        locationId,
        type,
        description,
        attachments: attachmentUrl ? [{ url: attachmentUrl }] : undefined,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      setLocationId("");
      setDescription("");
      setAttachmentUrl("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create report",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report an issue</CardTitle>
        <CardDescription>
          Reports help keep accessibility information accurate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="locationId">Location ID</Label>
            <Input
              id="locationId"
              value={locationId}
              onChange={(event) => setLocationId(event.target.value)}
              placeholder="Location UUID"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="type">Issue type</Label>
            <Select
              id="type"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              {reportTypes.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the accessibility issue (at least 10 characters)"
              required
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="attachmentUrl">Attachment URL (optional)</Label>
            <Input
              id="attachmentUrl"
              type="url"
              value={attachmentUrl}
              onChange={(event) => setAttachmentUrl(event.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Submit report
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
