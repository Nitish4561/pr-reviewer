"use client";

interface SimpleChartProps {
  data: { label: string; value: number; color: string; className?: string }[];
}

export function SimpleBarChart({ data }: SimpleChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className={`w-32 text-sm ${item.className || "text-gray-600 dark:text-gray-300"}`}>
            {item.label}
          </div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-8 relative overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 flex items-center justify-end px-3"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
                minWidth: item.value > 0 ? "40px" : "0",
              }}
            >
              <span className="text-white font-medium text-sm">{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SimplePieChart({ data }: SimpleChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className="w-48 h-48 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
        No data
      </div>
    );
  }

  let currentAngle = -90;
  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      percentage,
      startAngle,
      angle,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="40" className="text-gray-200 dark:text-gray-600" />
        {segments.map((segment, index) => {
          const startAngle = (segment.startAngle * Math.PI) / 180;
          const endAngle = ((segment.startAngle + segment.angle) * Math.PI) / 180;
          
          const x1 = 100 + 80 * Math.cos(startAngle);
          const y1 = 100 + 80 * Math.sin(startAngle);
          const x2 = 100 + 80 * Math.cos(endAngle);
          const y2 = 100 + 80 * Math.sin(endAngle);
          
          const largeArcFlag = segment.angle > 180 ? 1 : 0;
          
          const pathData = [
            `M 100 100`,
            `L ${x1} ${y1}`,
            `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`,
          ].join(' ');

          return (
            <path
              key={index}
              d={pathData}
              fill={segment.color}
              opacity="0.9"
            />
          );
        })}
        <circle cx="100" cy="100" r="50" fill="currentColor" className="text-white dark:text-gray-800" />
        <text x="100" y="95" textAnchor="middle" className="text-2xl font-bold fill-gray-800 dark:fill-gray-200">
          {total}
        </text>
        <text x="100" y="115" textAnchor="middle" className="text-sm fill-gray-500 dark:fill-gray-400">
          Total
        </text>
      </svg>

      <div className="space-y-2">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {segment.label}: {segment.value} ({segment.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

