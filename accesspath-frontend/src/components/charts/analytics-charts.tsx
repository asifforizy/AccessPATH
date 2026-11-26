"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendRow = {
  month: string;
  users: number;
  locations: number;
  reports: number;
  contributions: number;
  reviews: number;
};

type CategoryRow = {
  categoryId: string;
  name: string;
  count: number;
};

type BucketRow = { range: string; count: number };

const TOOLTIP_STYLE = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
} as const;

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: { stroke: "var(--border)" },
} as const;

/**
 * Interactive analytics charts (Recharts). Colours come from theme tokens so
 * light/dark mode both work; `.chart-N` classes map to the theme chart scale.
 */
export function MonthlyTrendsChart({ data }: { data: TrendRow[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: -12 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="month" {...axisProps} />
          <YAxis {...axisProps} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="reports"
            name="Reports"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="locations"
            name="Locations"
            stroke="var(--chart-3)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="reviews"
            name="Reviews"
            stroke="var(--chart-4)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="users"
            name="Users"
            stroke="var(--chart-5)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDistributionChart({ data }: { data: CategoryRow[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis type="number" {...axisProps} allowDecimals={false} />
          <YAxis type="category" dataKey="name" width={120} {...axisProps} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar
            dataKey="count"
            name="Locations"
            fill="var(--primary)"
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AccessibilityDistributionChart({
  data,
}: {
  data: BucketRow[];
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 12, bottom: 0, left: -18 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="range" {...axisProps} />
          <YAxis {...axisProps} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar
            dataKey="count"
            name="Locations"
            fill="var(--chart-2)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
