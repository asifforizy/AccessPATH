"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/utils/types";

type ButtonProps = React.ComponentProps<typeof Button>;

interface ActionButtonProps {
  action: (value: string) => Promise<ActionResult>;
  label: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  confirm?: string;
  promptLabel?: string;
  promptPlaceholder?: string;
  className?: string;
}

export function ActionButton({
  action,
  label,
  variant = "outline",
  size = "sm",
  confirm,
  promptLabel,
  promptPlaceholder,
  className,
}: ActionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (loading) return;

    if (confirm && !window.confirm(confirm)) return;

    let value: string | undefined;

    if (promptLabel) {
      const input = window.prompt(promptLabel, promptPlaceholder ?? "");
      if (input === null) return;
      value = input;
    }

    try {
      setLoading(true);
      const result = await action(value ?? "");

      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={loading}
      onClick={run}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" />}
      {label}
    </Button>
  );
}
