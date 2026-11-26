"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createAdminCategory,
  deleteAdminCategory,
  updateAdminCategory,
} from "@/services/admin";
import type { IAdminCategory } from "@/utils/types";

interface CategoryFormProps {
  mode?: "create" | "edit";
  category?: IAdminCategory;
}

export function CategoryForm({ mode = "create", category }: CategoryFormProps) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [loading, setLoading] = useState(false);

  const run = async (
    action: () => Promise<{ success: boolean; message: string }>,
  ) => {
    try {
      setLoading(true);
      const result = await action();
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (mode === "edit" && category) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label="Category name"
          className="h-8 w-40"
        />
        <Input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          aria-label="Category description"
          className="h-8 w-48"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading || !name.trim()}
          onClick={() =>
            run(() =>
              updateAdminCategory(category.id, {
                name: name.trim(),
                description,
              }),
            )
          }
        >
          {loading && <Loader2 className="size-3.5 animate-spin" />}
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() =>
            run(() =>
              updateAdminCategory(category.id, {
                isActive: !category.isActive,
              }),
            )
          }
        >
          {category.isActive ? "Deactivate" : "Activate"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={loading}
          onClick={() => {
            if (!window.confirm(`Remove category "${category.name}"?`)) return;
            run(() => deleteAdminCategory(category.id));
          }}
        >
          Remove
        </Button>
      </div>
    );
  }

  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        run(() =>
          createAdminCategory({
            name: name.trim(),
            description: description.trim() || undefined,
          }),
        ).then(() => {
          setName("");
          setDescription("");
        });
      }}
    >
      <label htmlFor="category-name" className="flex-1 text-xs">
        <span className="mb-1 block text-muted-foreground">Name</span>
        <Input
          id="category-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Hospital"
          required
          minLength={2}
          className="h-9"
        />
      </label>
      <label htmlFor="category-description" className="flex-1 text-xs">
        <span className="mb-1 block text-muted-foreground">Description</span>
        <Input
          id="category-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional"
          className="h-9"
        />
      </label>
      <Button type="submit" disabled={loading || !name.trim()}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Create category
      </Button>
    </form>
  );
}
