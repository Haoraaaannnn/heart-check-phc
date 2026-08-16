interface HistoricalContextBannerProps {
  historicalData: any;
  historicalLoading: boolean;
}

export default function HistoricalContextBanner({
  historicalData,
  historicalLoading,
}: HistoricalContextBannerProps) {
  if (historicalLoading) {
    return (
      <div className="bg-white/35 rounded-[28px] border border-white/40 p-6 backdrop-blur-xl dark:bg-gray-900/60 dark:border-gray-700/50">
        <p className="text-sm text-gray-400">Loading historical context...</p>
      </div>
    );
  }

  if (!historicalData) return null;

  const status = historicalData.bottleneck_analysis?.system_status || 'N/A';
  const bottleneckStage = historicalData.bottleneck_analysis?.bottleneck_stage || 'None';
  const avgTotalMins = historicalData.system_time?.avg_total_time ?? 0;
  const hrs = Math.floor(avgTotalMins / 60);
  const mins = Math.round(avgTotalMins % 60);
  const forecast = historicalData.computational_forecasting?.next_day_forecast ?? null;
  const bestAlgo = historicalData.computational_forecasting?.best_algorithm;

  const isOverwhelmed = status === 'Overwhelmed';

  return (
    <div className="bg-white/35 rounded-[28px] shadow-[0_10px_40px_rgba(255,120,120,0.06)] border border-white/40 p-8 backdrop-blur-xl dark:bg-gray-900/60 dark:border-gray-700/50 dark:shadow-black/20">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">
            No live activity today
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Here's what the historical data shows for this system
          </p>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase ${
            isOverwhelmed
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Typical Bottleneck
          </p>
          <p className="text-lg font-extrabold text-gray-800 dark:text-gray-200">
            {bottleneckStage}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Avg. Total Patient Time
          </p>
          <p className="text-lg font-extrabold text-gray-800 dark:text-gray-200">
            {hrs}h {mins}m
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Next-Day Forecast
          </p>
          <p className="text-lg font-extrabold text-gray-800 dark:text-gray-200">
            {forecast !== null ? `${forecast} patients` : '—'}
            {bestAlgo && (
              <span className="text-xs font-normal text-gray-400 ml-2">via {bestAlgo}</span>
            )}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6 italic">
        Based on all historical patient records. Live figures below will update once today's queue starts.
      </p>
    </div>
  );
}