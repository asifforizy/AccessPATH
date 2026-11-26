"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { updateAdminUser } from "@/services/admin";

const roles = ["ADMIN", "MODERATOR", "CONTRIBUTOR", "USER"] as const;
const statuses = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

export function UserRoleForm({
  userId,
  initialRole,
  initialStatus,
}: {
  userId: string;
  initialRole: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const dirty = role !== initialRole || status !== initialStatus;

  const save = async () => {
    try {
      setLoading(true);
      const result = await updateAdminUser(userId, { role, status });

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={role}
        onChange={(event) => setRole(event.target.value)}
        aria-label="User role"
        className="h-8 w-32"
      >
        {roles.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>
      <Select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        aria-label="Account status"
        className="h-8 w-32"
      >
        {statuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>
      <Button
        type="button"
        size="sm"
        onClick={save}
        disabled={!dirty || loading}
      >
        {loading && <Loader2 className="size-3.5 animate-spin" />}
        Save
      </Button>
    </div>
  );
}
