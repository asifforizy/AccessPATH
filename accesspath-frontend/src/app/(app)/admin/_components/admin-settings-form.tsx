"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAdminSettings } from "@/services/admin";
import type { IAdminSettings } from "@/utils/types";

const featureKeys = ["reviews", "contributions", "notifications", "analytics"];

export function AdminSettingsForm({ settings }: { settings: IAdminSettings }) {
  const router = useRouter();

  const [siteName, setSiteName] = useState(settings.siteName ?? "");
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail ?? "");
  const [maintenanceMode, setMaintenanceMode] = useState(
    settings.maintenanceMode ?? false,
  );
  const [allowRegistrations, setAllowRegistrations] = useState(
    settings.allowRegistrations ?? true,
  );
  const [defaultPageSize, setDefaultPageSize] = useState(
    String(settings.defaultPageSize ?? 20),
  );
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(
    String(settings.maxUploadSizeMb ?? 10),
  );
  const [features, setFeatures] = useState<Record<string, boolean>>(
    settings.features ?? {},
  );
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      const res = await updateAdminSettings({
        siteName,
        supportEmail,
        maintenanceMode,
        allowRegistrations,
        defaultPageSize: Number(defaultPageSize),
        maxUploadSizeMb: Number(maxUploadSizeMb),
        features,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="siteName">Site name</Label>
          <Input
            id="siteName"
            value={siteName}
            onChange={(event) => setSiteName(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="supportEmail">Support email</Label>
          <Input
            id="supportEmail"
            type="email"
            value={supportEmail}
            onChange={(event) => setSupportEmail(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="defaultPageSize">Default page size</Label>
          <Input
            id="defaultPageSize"
            type="number"
            min={1}
            max={100}
            value={defaultPageSize}
            onChange={(event) => setDefaultPageSize(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="maxUploadSizeMb">Max upload size (MB)</Label>
          <Input
            id="maxUploadSizeMb"
            type="number"
            min={1}
            max={100}
            value={maxUploadSizeMb}
            onChange={(event) => setMaxUploadSizeMb(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-md border p-2 text-sm">
          <input
            type="checkbox"
            checked={maintenanceMode}
            onChange={(event) => setMaintenanceMode(event.target.checked)}
            className="size-4 rounded border"
          />
          Maintenance mode
        </label>

        <label className="flex items-center gap-2 rounded-md border p-2 text-sm">
          <input
            type="checkbox"
            checked={allowRegistrations}
            onChange={(event) => setAllowRegistrations(event.target.checked)}
            className="size-4 rounded border"
          />
          Allow registrations
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Feature flags</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {featureKeys.map((key) => (
            <label
              key={key}
              className="flex items-center gap-2 rounded-md border p-2 text-sm capitalize"
            >
              <input
                type="checkbox"
                checked={features[key] ?? false}
                onChange={(event) =>
                  setFeatures((current) => ({
                    ...current,
                    [key]: event.target.checked,
                  }))
                }
                className="size-4 rounded border"
              />
              {key}
            </label>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Save settings
      </Button>
    </form>
  );
}
