import Link from "next/link";

interface PagerProps {
  page: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}

const hrefFor = (
  basePath: string,
  page: number,
  params?: Record<string, string | undefined>,
) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) search.set(key, value);
  }

  search.set("page", String(page));

  return `${basePath}?${search.toString()}`;
};

export function Pager({ page, totalPages, basePath, params }: PagerProps) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-3 pt-2 text-sm">
      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      <div className="flex gap-2">
        {hasPrev ? (
          <Link
            href={hrefFor(basePath, page - 1, params)}
            className="rounded-md border px-3 py-1.5 hover:bg-muted"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-md border px-3 py-1.5 opacity-40">
            Previous
          </span>
        )}

        {hasNext ? (
          <Link
            href={hrefFor(basePath, page + 1, params)}
            className="rounded-md border px-3 py-1.5 hover:bg-muted"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-md border px-3 py-1.5 opacity-40">Next</span>
        )}
      </div>
    </div>
  );
}
