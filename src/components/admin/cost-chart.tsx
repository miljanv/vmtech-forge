"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEur } from "@/lib/ai/pricing";

export function CostChart({
  data,
}: {
  data: Array<{ name: string; cost: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis
          width={56}
          tickFormatter={(value: number) => formatEur(value)}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(value) => formatEur(Number(value ?? 0))}
          labelFormatter={(label) => `Dan ${label}`}
        />
        <Area
          type="monotone"
          dataKey="cost"
          stroke="var(--primary)"
          fill="var(--primary)"
          fillOpacity={0.18}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
