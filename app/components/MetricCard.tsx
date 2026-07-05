import React from "react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  sparklineData: number[];
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  sparklineData,
}) => {
  // Generate SVG path for the sparkline data
  const generateSparklinePath = (data: number[], width: number, height: number) => {
    if (data.length < 2) return "";
    const minX = 0;
    const maxX = data.length - 1;
    const minY = Math.min(...data);
    const maxY = Math.max(...data);
    const rangeY = maxY - minY || 1;

    // Apply padding
    const padY = height * 0.15;
    const padHeight = height - padY * 2;

    const points = data.map((val, index) => {
      const x = (index / maxX) * width;
      // Invert Y because SVG coordinates start from top-left (0,0)
      const y = height - padY - ((val - minY) / rangeY) * padHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(" L ")}`;
  };

  const svgWidth = 120;
  const svgHeight = 36;
  const pathData = generateSparklinePath(sparklineData, svgWidth, svgHeight);

  // Set colors based on trend
  const trendColor =
    trend === "up"
      ? "text-success-custom bg-success-custom/10"
      : trend === "down"
      ? "text-red-500 bg-red-500/10"
      : "text-muted-custom bg-border-custom/50";

  const strokeColor =
    trend === "up"
      ? "#00D2A0"
      : trend === "down"
      ? "#EF4444"
      : "#71717A";

  return (
    <div className="group relative rounded-xl border border-border-custom bg-surface p-6 transition-all duration-300 hover:border-accent hover:translate-y-[-2px]">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-custom">
          {title}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-semibold ${trendColor}`}
        >
          {trend === "up" && "+"}
          {change}
        </span>
      </div>

      {/* Main Metric & Sparkline */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {value}
          </h3>
        </div>

        {/* Sparkline Graph */}
        <div className="relative h-9 w-[120px] overflow-visible">
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="overflow-visible"
          >
            {/* Soft background glow */}
            <path
              d={`${pathData} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`}
              fill={trend === "up" ? "url(#glow-up)" : "url(#glow-neutral)"}
              className="opacity-15 transition-all duration-300 group-hover:opacity-25"
            />
            {/* Sparkline line */}
            <path
              d={pathData}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />

            {/* Linear gradients definitions */}
            <defs>
              <linearGradient id="glow-up" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00D2A0" />
                <stop offset="100%" stopColor="#00D2A0" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="glow-neutral" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#71717A" />
                <stop offset="100%" stopColor="#71717A" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};
