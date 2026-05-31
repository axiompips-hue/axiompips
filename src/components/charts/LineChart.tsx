// File: src/components/charts/LineChart.tsx
"use client";

import { useMemo } from "react";

interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  lineColor?: string;
  fillColor?: string;
  showGrid?: boolean;
  showDots?: boolean;
  showLabels?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
  className?: string;
}

export function LineChart({
  data,
  width = 600,
  height = 300,
  lineColor = "#06b6d4",
  fillColor = "rgba(6, 182, 212, 0.1)",
  showGrid = true,
  showDots = true,
  showLabels = false,
  yAxisLabel,
  xAxisLabel,
  className = "",
}: LineChartProps) {
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { path, fillPath, xScale, yScale, yTicks, xTicks } = useMemo(() => {
    if (data.length === 0) {
      return { path: "", fillPath: "", xScale: () => 0, yScale: () => 0, yTicks: [], xTicks: [] };
    }

    const xValues = data.map((d) => d.x);
    const yValues = data.map((d) => d.y);

    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    // Add padding to y range
    const yRange = yMax - yMin;
    const yPadding = yRange * 0.1 || 100;
    const adjustedYMin = yMin - yPadding;
    const adjustedYMax = yMax + yPadding;

    const xScaleFn = (x: number) =>
      ((x - xMin) / (xMax - xMin || 1)) * chartWidth + padding.left;
    const yScaleFn = (y: number) =>
      chartHeight - ((y - adjustedYMin) / (adjustedYMax - adjustedYMin || 1)) * chartHeight + padding.top;

    // Generate path
    const pathPoints = data.map((d, i) => {
      const x = xScaleFn(d.x);
      const y = yScaleFn(d.y);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    });

    // Generate fill path (closed polygon)
    const fillPoints = [
      ...data.map((d) => `${xScaleFn(d.x)},${yScaleFn(d.y)}`),
      `${xScaleFn(data[data.length - 1].x)},${yScaleFn(adjustedYMin)}`,
      `${xScaleFn(data[0].x)},${yScaleFn(adjustedYMin)}`,
    ];

    // Generate y-axis ticks
    const yTickCount = 5;
    const yTickStep = (adjustedYMax - adjustedYMin) / yTickCount;
    const yTicksArr = Array.from({ length: yTickCount + 1 }, (_, i) =>
      adjustedYMin + i * yTickStep
    );

    // Generate x-axis ticks
    const xTickCount = Math.min(data.length - 1, 10);
    const xTickStep = (xMax - xMin) / xTickCount;
    const xTicksArr = Array.from({ length: xTickCount + 1 }, (_, i) =>
      Math.round(xMin + i * xTickStep)
    );

    return {
      path: pathPoints.join(" "),
      fillPath: `M ${fillPoints.join(" L ")} Z`,
      xScale: xScaleFn,
      yScale: yScaleFn,
      yTicks: yTicksArr,
      xTicks: xTicksArr,
    };
  }, [data, chartWidth, chartHeight, padding.left, padding.top]);

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-900 rounded-lg border border-zinc-800 ${className}`}
        style={{ width, height }}
      >
        <p className="text-zinc-500 text-sm">No data to display</p>
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      className={`bg-neutral-900 rounded-lg ${className}`}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Grid lines */}
      {showGrid && (
        <g className="grid">
          {/* Horizontal grid lines */}
          {yTicks.map((tick, i) => (
            <line
              key={`h-${i}`}
              x1={padding.left}
              x2={width - padding.right}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="#27272a"
              strokeWidth={1}
            />
          ))}
          {/* Vertical grid lines */}
          {xTicks.map((tick, i) => (
            <line
              key={`v-${i}`}
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={padding.top}
              y2={height - padding.bottom}
              stroke="#27272a"
              strokeWidth={1}
            />
          ))}
        </g>
      )}

      {/* Y-axis labels */}
      {yTicks.map((tick, i) => (
        <text
          key={`y-label-${i}`}
          x={padding.left - 10}
          y={yScale(tick)}
          textAnchor="end"
          dominantBaseline="middle"
          className="text-xs fill-zinc-500"
        >
          {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick.toFixed(0)}
        </text>
      ))}

      {/* X-axis labels */}
      {xTicks.map((tick, i) => (
        <text
          key={`x-label-${i}`}
          x={xScale(tick)}
          y={height - padding.bottom + 20}
          textAnchor="middle"
          className="text-xs fill-zinc-500"
        >
          {tick}
        </text>
      ))}

      {/* Y-axis label */}
      {yAxisLabel && (
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 15, ${height / 2})`}
          className="text-xs fill-zinc-400"
        >
          {yAxisLabel}
        </text>
      )}

      {/* X-axis label */}
      {xAxisLabel && (
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          className="text-xs fill-zinc-400"
        >
          {xAxisLabel}
        </text>
      )}

      {/* Fill area */}
      <path d={fillPath} fill={fillColor} />

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={lineColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots */}
      {showDots &&
        data.map((d, i) => (
          <circle
            key={i}
            cx={xScale(d.x)}
            cy={yScale(d.y)}
            r={3}
            fill={lineColor}
            className="hover:r-5 transition-all"
          />
        ))}

      {/* Data labels */}
      {showLabels &&
        data.map((d, i) => (
          <text
            key={`label-${i}`}
            x={xScale(d.x)}
            y={yScale(d.y) - 10}
            textAnchor="middle"
            className="text-xs fill-zinc-400"
          >
            {d.label || d.y.toFixed(0)}
          </text>
        ))}
    </svg>
  );
}