"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SuccessByRankProps {
  data: { rank: number; total: number; won: number }[];
}

export function SuccessByRank({ data }: SuccessByRankProps) {
  const chartData = data.map((item) => ({
    name: `Pari ${item.rank}`,
    taux: item.total > 0 ? Math.round((item.won / item.total) * 100) : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taux de réussite par rang</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune donnée disponible
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip
                formatter={(value) => [`${value}%`, "Taux de réussite"]}
              />
              <Bar
                dataKey="taux"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
