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
import { createContribution } from "@/services/contributions";

const types = ["LOCATION_CREATE", "LOCATION_UPDATE", "ACCESSIBILITY_UPDATE"];

const sample = `{
  "name": "Central Library",
  "city": "New York",
  "country": "USA",
  "latitude": 40.7532,
  "longitude": -73.9822
}`;

export function ContributionForm() {
  const router = useRouter();

  const [type, setType] = useState(types[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationId, setLocationId] = useState("");
  const [proposedData, setProposedData] = useState(sample);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(proposedData);
    } catch {
      toast.error("Proposed data must be valid JSON");
      return;
    }

    try {
      setLoading(true);

      const res = await createContribution({
        type,
        title: title || undefined,
        description: description || undefined,
        proposedData: parsed,
        locationId:
          type === "LOCATION_CREATE" ? undefined : locationId || undefined,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      setTitle("");
      setDescription("");
      setLocationId("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit contribution",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit a contribution</CardTitle>
        <CardDescription>
          Propose a new location or an update to existing accessibility data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <Select
              id="type"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              {types.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short summary"
            />
          </div>

          {type !== "LOCATION_CREATE" && (
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="locationId">Location ID</Label>
              <Input
                id="locationId"
                value={locationId}
                onChange={(event) => setLocationId(event.target.value)}
                placeholder="Location UUID"
                required
              />
            </div>
          )}

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Explain what should change and why"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="proposedData">Proposed data (JSON)</Label>
            <Textarea
              id="proposedData"
              value={proposedData}
              onChange={(event) => setProposedData(event.target.value)}
              className="min-h-40 font-mono text-xs"
              required
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Submit contribution
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
