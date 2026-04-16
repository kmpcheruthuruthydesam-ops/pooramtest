import { memo } from 'react';

const Sparkline = memo(({ data, color = '#f97316', width = 120, height = 40 }) => {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Normalize points to fit the SVG viewport
    const points = data.map((val, i) => ({
        x: (i / (data.length - 1)) * width,
        y: height - ((val - min) / range) * height
    }));

    // Create a smooth SVG path string
    const pathData = points.reduce((acc, point, i, arr) => {
        if (i === 0) return `M ${point.x},${point.y}`;
        
        // Use quadratic curves for some smoothing
        const prev = arr[i - 1];
        const cx = (prev.x + point.x) / 2;
        const cy = (prev.y + point.y) / 2;
        return `${acc} Q ${prev.x},${prev.y} ${cx},${cy} T ${point.x},${point.y}`;
    }, "");

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                </linearGradient>
            </defs>
            
            {/* Fill Area */}
            <path
                d={`${pathData} L ${width},${height} L 0,${height} Z`}
                fill={`url(#gradient-${color})`}
                className="transition-all duration-1000"
            />
            
            {/* Main Path */}
            <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-1000"
            />
            
            {/* End Point Glow */}
            <circle
                cx={points[points.length - 1].x}
                cy={points[points.length - 1].y}
                r="3"
                fill={color}
                className="animate-pulse"
            />
        </svg>
    );
});

export default Sparkline;
