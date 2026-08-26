"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function PipelineChart({
  data,
}: {
  data: Array<{ name: string; count: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="name" hide />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="var(--primary)" radius={6} />
      </BarChart>
    </ResponsiveContainer>
  );
}
