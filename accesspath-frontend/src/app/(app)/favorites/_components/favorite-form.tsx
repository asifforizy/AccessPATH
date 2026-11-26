"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFavorite } from "@/services/favorites";

export function FavoriteForm() {
  const router = useRouter();
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setLoading(true);
      const res = await addFavorite(locationId);

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      setLocationId("");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add favorite",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="favorite-location">Add a location by ID</Label>
        <Input
          id="favorite-location"
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          placeholder="Location UUID"
          required
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Add favorite
      </Button>
    </form>
  );
}
