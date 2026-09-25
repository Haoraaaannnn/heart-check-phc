/**
 * @fileoverview Text definitions and copy strings for the Analytics dashboard page.
 *
 * All user-facing labels, headings, descriptions, table headers, button text,
 * and empty state messages are centralized here to adhere strictly to the
 * repository's separation of concerns guidelines.
 *
 * @module app/dashboard/pages/analytics/constants/analyticsTexts
 */

export const ANALYTICS_TEXTS = {
  header: {
    title: 'OPD Queue Analytics Dashboard',
    subtitle: 'Advanced forecasting and bottleneck analysis',
    refreshing: 'Refreshing…',
    loading: 'Loading Heart Check Analytics Engine...',
    errorPrefix: 'Error:',
    empty: 'No data received.',
  },
  presets: {
    '90d': 'Last 90 Days',
    '180d': 'Last 6 Months',
    '365d': 'Last Year',
    all: 'All Time',
  },
  export: {
    buttonIdle: 'Export to Excel',
    buttonLoading: 'Exporting...',
    defaultError: 'Export failed — try a different date range.',
  },
  metrics: {
    systemStatus: {
      label: 'System Status',
      bottleneckPrefix: 'Bottleneck:',
      noneLabel: 'None',
    },
    avgPatientTime: {
      label: 'Avg. Total Patient Time',
      subtitle: 'Queuing to Doctor Completed',
    },
    nextDayForecast: {
      label: 'Next-Day Forecast',
      unit: 'patients',
      subtitlePrefix: 'For',
      viaPrefix: 'via',
      defaultDate: 'next recorded day',
    },
    recommendedStaff: {
      label: 'Recommended Staff',
      unit: 'Doctors',
      subtitle: 'Target staffing for predicted load',
    },
  },
  bottleneckTable: {
    title: 'Queue Stage Breakdown',
    subtitle:
      'Where patients spend the most time, kiosk through carryout — with severity and reasoning per stage.',
    empty: 'No stage data available for the selected range.',
    headers: {
      stage: 'Stage',
      avgTime: 'Avg. Time',
      patients: 'Patients',
      level: 'Level',
      reason: 'Reason',
    },
    levels: {
      Normal: 'Normal',
      Elevated: 'Elevated',
      Overwhelmed: 'Overwhelmed',
      'No Data': 'No Data',
    },
  },
  volumeCharts: {
    dailyVolumeTitle: 'Daily Patient Volume & Moving Average',
    dailyVolumeSubtitle: 'Raw daily counts with a 7-day smoothed trend line',
    hourlyPatternTitle: 'Hourly Arrival Distribution',
    hourlyPatternSubtitle: 'Average intake across clinic operating hours',
    stageWaitTitle: 'Stage-by-Stage Wait Time Trends',
    stageWaitSubtitle: 'Average minutes elapsed per operational step',
    series: {
      dailyPatients: 'Daily Patients',
      movingAvg: '7-Day Moving Avg',
      avgPatients: 'Avg Patients',
    },
  },
  compliance: {
    title: 'PHC Waiting Time Compliance',
    subtitle: 'Department standards and threshold performance',
    patientsSeenLabel: 'Patients Seen',
    operatingHoursLabel: 'OPD Operating Hours',
    operatingHoursUnit: 'hrs/day',
    avgTotalWaitLabel: "Avg. Patient's Total Waiting Time",
    thresholdTableTitle: 'Compliance Breakdown Against Department Standard',
    headers: {
      stage: 'Queue Stage',
      standard: 'PHC Standard',
      withinStandard: 'Within Standard (≤)',
      exceededStandard: 'Exceeded Standard (>)',
      complianceRate: 'Compliance Rate',
    },
    stages: {
      waitingTime: 'Queue to Triage & Registration',
      evaluate: 'Initial Nursing Evaluation',
      examineTreat: 'Physician Examination & Treatment',
      carryout: 'Prescription Carryout & Disposition',
    },
  },
  forecasts: {
    lr: {
      title: 'Linear Regression Forecast',
      subtitle: 'Trend prediction based on historical patient registrations',
      r2Label: 'R² =',
      nextDayLabel: 'Next Day =',
      patientsUnit: 'patients',
    },
    arima: {
      title: 'ARIMA Forecast',
      subtitle: 'Autoregressive integrated moving average predictive model',
      aicPrefix: 'AIC:',
      modelTag: 'ARIMA (1,1,1)',
      forecastForPrefix: 'Forecast for',
      patientsUnit: 'patients',
      residualVariance: 'Residual Variance (σ²):',
      forecastDateLabel: 'Forecast Date',
    },
    comparison: {
      title: 'Algorithm Comparison',
      headers: {
        algorithm: 'Algorithm',
        mae: 'MAE',
        rmse: 'RMSE',
      },
      arimaLabel: 'ARIMA',
      bestIndicator: '✓',
    },
  },
} as const;
