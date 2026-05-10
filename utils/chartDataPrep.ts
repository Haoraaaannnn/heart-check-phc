export function prepareLRChartData(lrRaw: any) {
  return [
    ...(lrRaw.labels || []).map((date: string, i: number) => ({
      date,
      actual:  lrRaw.actual?.[i],
      lr_line: lrRaw.lr_line?.[i],
    })),
    {
      date:     lrRaw.forecast_date,
      actual:   null,
      lr_line:  lrRaw.forecast_value,
      forecast: lrRaw.forecast_value,
    },
  ];
}

export function prepareARIMAChartData(arimaRaw: any) {
  return [
    ...(arimaRaw.labels || []).map((date: string, i: number) => ({
      date,
      actual: arimaRaw.actual?.[i],
      fitted: arimaRaw.fitted?.[i],
    })),
    {
      date:     arimaRaw.forecast_date,
      actual:   null,
      fitted:   arimaRaw.forecast_value,
      forecast: arimaRaw.forecast_value,
    },
  ];
}

export function getTrendColor(trend: string) {
  if (trend === "increasing") return "#ef4444";
  if (trend === "decreasing") return "#22c55e";
  return "#6b7280";
}

export function getTrendBg(trend: string) {
  if (trend === "increasing") return "#fee2e2";
  if (trend === "decreasing") return "#dcfce7";
  return "#f3f4f6";
}

export function getLRRaw(data: any) {
  return data?.lr_chart_data || {
    labels: [], actual: [], lr_line: [],
    trend: "stable", slope: 0, r2: 0,
    forecast_date: "", forecast_value: 0,
  };
}

export function getARIMARaw(data: any) {
  return data?.arima_chart_data || {
    labels: [], actual: [], fitted: [],
    forecast_date: "", forecast_value: 0, aic: null, status: "",
  };
}