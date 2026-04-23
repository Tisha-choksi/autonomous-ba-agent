interface ChartRendererProps {
    chart: { image_base64: string; title?: string; chart_type?: string };
    className?: string;
}

export function ChartRenderer({ chart, className = "" }: ChartRendererProps) {
    return (
        <div className={`bg-slate-900 border border-slate-800 rounded-xl overflow-hidden ${className}`}>
            {chart.title && (
                <div className="px-4 py-3 border-b border-slate-800">
                    <span className="text-sm font-medium text-slate-200">{chart.title}</span>
                    {chart.chart_type && (
                        <span className="ml-2 text-xs text-slate-500 uppercase">{chart.chart_type}</span>
                    )}
                </div>
            )}
            <div className="p-2">
                <img
                    src={`data:image/png;base64,${chart.image_base64}`}
                    alt={chart.title || "Chart"}
                    className="w-full rounded-lg"
                />
            </div>
        </div>
    );
}