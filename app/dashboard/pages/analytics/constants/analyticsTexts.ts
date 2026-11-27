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
    subtitle:
      'Plain-language clinic insights: wait-time bottlenecks, PHC compliance targets, hourly rushes, and tomorrow\'s patient forecast',
    refreshing: 'Refreshing',
    loading: 'Loading Heart Check Analytics Engine',
    errorPrefix: 'Error:',
    empty: 'No data received.',
    importButton: 'Import Files',
  },
  presets: {
    '90d': 'Last 90 Days',
    '180d': 'Last 6 Months',
    '365d': 'Last Year',
    all: 'All Time',
    yearFilterTitle: (year: number) => `Filter analytics for calendar year ${year}`,
  },
  export: {
    buttonIdle: 'Export to Excel',
    buttonLoading: 'Exporting',
    defaultError: 'Export failed — try a different date range.',
  },
  exportModal: {
    title: 'Export Queue Data to Excel',
    subtitle:
      'Select a specific date, calendar month, or all dates to download the official PHC Time and Motion Analysis workbook (.xlsx).',
    closeAria: 'Close export modal',
    modeLabel: 'Export Selection Mode',
    modes: {
      specific: 'Specific Date',
      all: 'All Dates',
      month: 'By Month',
    },
    specificDateLabel: 'Specific Date',
    specificDateInputAria: 'Select specific date for export',
    recordedDatesLabel: 'Or Select from Recorded Dates',
    recordedDatesSelectAria: 'Select from dates with recorded patient data',
    selectRecordedDatePlaceholder: 'Select a recorded date...',
    noRecordedDates: 'No recorded dates available',
    hasRecordsBadge: 'Queue records available for this date',
    noRecordsBadge: 'No queue records found on this date',
    allDatesNotice:
      'All historical queue data across all recorded dates will be compiled into a single multi-sheet Excel workbook.',
    allDatesTargetPeriod: 'All Recorded Dates (All Time)',
    allDatesStructureValue: '1 sheet per calendar day across entire history',
    specificDateStructureValue: '1 sheet for selected date (Manila Time)',
    monthStructureValue: '1 sheet per calendar day in selected month',
    singleDaySuffix: '(Single Day)',
    yearLabel: 'Year',
    monthLabel: 'Month',
    serviceLabel: 'Clinic / Service',
    allServices: 'All Services (OPD)',
    previewTitle: 'Export Specification',
    targetPeriodLabel: 'Target Period:',
    formatLabel: 'File Format:',
    formatValue: 'Microsoft Excel (.xlsx)',
    structureLabel: 'Structure:',
    structureValue: '1 sheet per calendar day (Manila Time)',
    cancelButton: 'Cancel',
    confirmButton: 'Export to Excel',
    confirmLoading: 'Generating Workbook...',
    downloadSuccess: 'Export generated successfully. Starting download...',
    defaultError: 'Export failed — please check if patient records exist for this period.',
    noDataError: 'No patient records found for the selected date or period.',
    loadingDates: 'Checking available dates...',
    noAvailableDates: 'No patient records found for export.',
    noMonthsForYear: 'No records available for the selected year.',
    prevYearAria: 'Previous available year',
    nextYearAria: 'Next available year',
    months: [
      { name: 'January', short: 'Jan', value: 1 },
      { name: 'February', short: 'Feb', value: 2 },
      { name: 'March', short: 'Mar', value: 3 },
      { name: 'April', short: 'Apr', value: 4 },
      { name: 'May', short: 'May', value: 5 },
      { name: 'June', short: 'Jun', value: 6 },
      { name: 'July', short: 'Jul', value: 7 },
      { name: 'August', short: 'Aug', value: 8 },
      { name: 'September', short: 'Sep', value: 9 },
      { name: 'October', short: 'Oct', value: 10 },
      { name: 'November', short: 'Nov', value: 11 },
      { name: 'December', short: 'Dec', value: 12 },
    ] as const,
    services: [
      { label: 'All Services (OPD)', value: 'all' },
      { label: 'Consultation', value: 'Consultation' },
      { label: 'ECG', value: 'ECG' },
      { label: 'Warfarin Clinic', value: 'Warfarin Clinic' },
      { label: 'OPD Card', value: 'OPD Card' },
      { label: 'OPD Screening', value: 'OPD Screening' },
      { label: 'OPD Reschedule', value: 'OPD Reschedule' },
      { label: 'Refill Prescription', value: 'Refill Prescription' },
      { label: 'Benzathine', value: 'Benzathine' },
    ] as const,
  },
  metrics: {
    systemStatus: {
      label: 'System Status',
      bottleneckPrefix: 'Bottleneck:',
      noneLabel: 'None',
      howCalculated:
        'Reflects the slowest of the 5 clinic steps: under 30 min = Optimal, 30–60 min = Elevated, over 60 min = Exceeded.',
      directions: {
        Normal: 'Optimal throughput. Maintain standard cubicle allocation.',
        Elevated: 'Moderate queue buildup. Monitor intake and alert standby consultation staff.',
        Overwhelmed: 'Capacity threshold exceeded (>60m avg wait). Mobilize relief staff immediately.',
        'No Data': 'Awaiting active patient check-in records.',
      },
    },
    avgPatientTime: {
      label: 'Avg. Total Patient Time',
      subtitle: 'Registration Start to Exit (Carryout / Doctor End)',
      withinTargetBadge: 'Within 2h 30m PHC Target',
      overTargetSuffix: 'over 2h 30m PHC Target',
      howCalculated:
        'Averages every completed visit from registration start until carryout (or doctor end). PHC goal is 2 hrs 30 mins (150 min) or less.',
    },
    nextDayForecast: {
      label: 'Next-Day Forecast',
      unit: 'patients',
      subtitlePrefix: 'For',
      viaPrefix: 'via',
      defaultDate: 'next recorded day',
      howCalculated:
        'Tests 5 prediction formulas on past clinic days and automatically uses whichever formula had the smallest average error.',
    },
    recommendedStaff: {
      label: 'Recommended Staff',
      unit: 'Doctors',
      subtitle: 'Target staffing for predicted load',
      howCalculated:
        'Uses tomorrow\'s forecast, typical consult length, and an 8-hr shift to keep doctors under 80% busy so lines do not back up.',
    },
    explainer: {
      summary:
        'These 4 headline cards summarize overall clinic speed, how long a typical patient stays from registration to exit, tomorrow\'s expected patient count, and how many doctors are needed to handle that load comfortably.',
      details: [
        {
          label: 'System Status',
          text: 'The engine checks the average minutes spent at each of the 5 clinic steps and flags the worst-performing step. Even if 4 steps are fast, 1 slow step sets the alert level.',
        },
        {
          label: 'Avg. Total Time & Forecast',
          text: 'Total Time averages completed visits from registration start to carryout/doctor end. Next-Day Forecast backtests 5 models (SMA, WMA, EMA, Linear Regression, ARIMA) and picks the winner with lowest average error.',
        },
        {
          label: 'Recommended Staff (80% Rule)',
          text: 'Computed using queueing math (M/M/1 capacity) over an 8-hour clinic day, assuming ~65% of visitors need doctor consultation across Adult and Pedia clinics, capped at 5 cubicles per clinic.',
        },
      ],
    },
  },
  bottleneckTable: {
    title: 'Queue Stage Breakdown',
    subtitle:
      'Where patients spend the most time from kiosk check-in through carryout, with plain-language severity and reasoning.',
    empty: 'No stage data available for the selected range.',
    primaryBadge: 'Slowest Step',
    explainer: {
      summary:
        'Shows how long patients wait or spend at each step of their visit. A "bottleneck" is the slowest step where patients pile up — improving that single step speeds up the entire clinic.',
      details: [
        {
          label: 'What it computes',
          text: 'For each step, the system takes every patient who completed that step in your selected date range and calculates their average duration in hours, minutes, and seconds.',
        },
        {
          label: 'How severity is graded',
          text: 'Internal clinic benchmarks grade each step independently: 30 minutes or less = Optimal Flow; 30 to 60 minutes = Elevated Delay; over 60 minutes = Capacity Threshold Exceeded.',
        },
        {
          label: 'Why Kiosk Wait may show No Data',
          text: 'Older imported Excel records did not have digital kiosk ticketing, so only steps recorded from Registration onward appear for those dates.',
        },
      ],
    },
    stageDefinitions: {
      kiosk_to_registration_wait: 'Waiting from taking a kiosk ticket until the registration desk calls you.',
      registration_duration: 'Time spent at the registration and nursing triage desk.',
      registration_to_consult_wait: 'Waiting after registration until a doctor calls you into a cubicle.',
      consultation_duration: 'Time spent inside the examination room with the doctor.',
      carryout_duration: 'Time spent completing doctor orders, prescriptions, or discharge.',
    } as Record<string, string>,
    headers: {
      stage: 'Stage',
      avgTime: 'Avg. Time',
      patients: 'Patients',
      level: 'Level',
      reason: 'Reason',
    },
    levels: {
      Normal: 'Optimal Flow',
      Elevated: 'Elevated Delay',
      Overwhelmed: 'Capacity Threshold Exceeded',
      'No Data': 'No Data',
    },
  },
  bottleneckStages: {
    levels: {
      Normal: 'Optimal Flow',
      Elevated: 'Elevated Delay',
      Overwhelmed: 'Capacity Threshold Exceeded',
      'No Data': 'No Data',
    },
  },
  volumeCharts: {
    dailyVolumeTitle: 'Daily Patient Volume & 7-Day Trend',
    dailyVolumeSubtitle: 'Daily patient counts (bars) with a smoothed 7-day average line — click any bar to inspect that day',
    hourlyPatternTitle: 'Hourly Process & Arrival Distribution',
    hourlyPatternSubtitle: 'Typical daily patient flow and wait times across clinic operating hours (7 AM – 4 PM)',
    hourlyDrilldownSubtitle: 'Actual hourly patient flow and wait times for selected date',
    stageWaitTitle: 'Stage-by-Stage Wait Time Trends',
    stageWaitSubtitle: 'Average minutes spent at each clinic step day by day — click any date to inspect that day',
    clickHint: 'Tip: Click on any date or bar in the Daily Volume or Stage Wait Time charts to inspect that day\'s hourly distribution and bottleneck breakdown.',
    chartClickTooltip: 'Click to inspect',
    resetButton: 'Reset to Overall Pattern',
    activeBadge: 'Drill-Down Active',
    historicalBadge: 'Historical Data: Registration to With Doctor',
    historicalNotice: 'Physical kiosk ticketing was not deployed in historical records. Displaying Registration, With Doctor, and Carryout stages.',
    liveBadge: 'Queue Flow: Kiosk to With Doctor',
    kioskNotAvailable: 'N/A (No Kiosk in Historical Data)',
    dailyStats: {
      avgPerDay: 'Avg. Patients / Day',
      busiestDay: 'Busiest Day',
      quietestDay: 'Quietest Day',
      daysShown: 'Clinic Days Shown',
      overallAvgLine: 'Overall Avg',
    },
    dailyExplainer: {
      summary:
        'Each blue bar shows total patients who visited on that date. The dashed orange line is the 7-day moving average, which smooths out daily ups and downs so you can clearly see whether overall clinic volume is growing or shrinking.',
      details: [
        {
          label: 'How the orange line is computed',
          text: 'For any date, it adds up the patient count of that day plus the previous 6 clinic days and divides by 7 (or fewer days at the very start of the chart).',
        },
        {
          label: 'How to read bars vs. lines',
          text: 'Bars rising above the orange line mean a busier-than-usual day; bars below mean a quieter day. The gray dashed line marks the overall daily average across all dates shown.',
        },
        {
          label: 'Interactive drill-down',
          text: 'Click any bar to open a single-day breakdown showing exact hourly rushes and which step slowed patients down on that date.',
        },
      ],
    },
    hourlyExplainer: {
      volumeRange:
        'Shows how many patients pass through each clinic step per hour on a typical day. Numbers with decimals (e.g., 10.4) represent the daily average across all selected dates — switch tabs to compare wait times or total arrivals.',
      volumeDay:
        'Shows the exact number of patients who entered each clinic step during each hour on the selected date, compared against your overall daily arrival average (red dashed line).',
      waittime:
        'Shows the average time patients waited or spent at each step depending on what hour they arrived. Taller peaks point to specific hours where queues back up.',
      intakeRange:
        'Shows total patient arrivals per hour from opening to closing averaged across all selected dates, making morning rush hours and quiet afternoon windows easy to spot.',
      intakeDay:
        'Compares hourly arrivals on your selected day (blue bars) against the clinic\'s overall daily average (red dashed line) so you can see exactly which hours surged.',
      details: [
        {
          label: 'Why decimals appear in range view',
          text: 'When viewing multiple days, total patients in an hour (e.g. 8–9 AM) are divided by the number of clinic days in the range, giving an average like 12.5 patients/day.',
        },
        {
          label: '3 view modes explained',
          text: 'Patients by Stage tracks headcount at each desk; Wait Times by Stage tracks average minutes per step by arrival hour; Overall Intake focuses purely on front-door arrival rush.',
        },
        {
          label: 'Clinic hour grouping',
          text: 'Each timestamp is grouped in Asia/Manila local time (for example, 08:00–09:00 covers 8:00 AM up to 8:59 AM).',
        },
      ],
    },
    stageWaitExplainer: {
      summary:
        'Plots how long each step of the clinic visit took on every recorded day. By default, Total Journey is hidden so the 5 individual steps are easy to compare against the 30-min (Elevated) and 60-min (Exceeded) warning lines.',
      details: [
        {
          label: 'Why Total Journey has a toggle',
          text: 'Total Journey (60–150+ mins) is much larger than single steps (5–35 mins). Hiding it zooms the chart in so small delays in Registration or Carryout do not get squished at the bottom.',
        },
        {
          label: 'How each point is computed',
          text: 'For every clinic date, the system takes all patients who completed a step and averages their elapsed minutes for that day.',
        },
        {
          label: 'Filter pills & thresholds',
          text: 'Click any stage pill above the chart to hide or show that line. Use "Include Total Journey" to compare full patient stay against the 150-min (2.5-hr) PHC target.',
        },
      ],
    },
    stageToggle: {
      stepsOnly: 'Individual Steps Only',
      withTotal: 'Include Total Journey',
      allStagesBtn: 'Show All',
    },
    modes: {
      volume: 'Patients by Stage',
      waittime: 'Wait Times by Stage',
      intake: 'Overall Intake',
    },
    stageLabels: {
      kiosk: 'Kiosk Check-in',
      registration: 'Registration',
      waitDoctor: 'Wait for Doctor',
      withDoctor: 'With Doctor',
      carryout: 'Carryout',
      waitReg: 'Kiosk Wait',
      serviceReg: 'Registration Duration',
      serviceDoc: 'With Doctor (Consultation)',
      serviceCarry: 'Carryout Duration',
      totalTime: 'Total Journey',
    },
    series: {
      dailyPatients: 'Daily Patients',
      movingAvg: '7-Day Moving Avg',
      avgPatients: 'Avg Patients / Hour',
      selectedDayPatients: 'Selected Day Intake',
      rangeAverage: 'Overall Daily Avg',
      kioskPatients: 'Kiosk Check-in',
      regPatients: 'Registration',
      withDoctorPatients: 'With Doctor',
      carryoutPatients: 'Carryout',
      waitReg: 'Kiosk Wait',
      servReg: 'Registration Duration',
      waitConsult: 'Wait for Doctor',
      servConsult: 'With Doctor Duration',
      servCarry: 'Carryout Duration',
    },
  },
  drilldown: {
    title: 'Daily Drill-Down Analysis',
    subtitle: 'Exact patient arrivals, step-by-step durations, and bottleneck breakdown for',
    activeBadge: 'Drill-Down Active',
    resetButton: 'Reset to Overall Range',
    clearAria: 'Clear selected date drilldown',
    explainer:
      'You are viewing exact single-day numbers instead of multi-day averages. Peak Arrival Hour finds the 1-hour window with the highest front-door check-ins, and the table below grades each step for this specific date.',
    patientsSeen: 'Patients Seen',
    patientsUnit: 'patients',
    avgTotalTime: 'Avg. Total Patient Time',
    avgTotalTimeSub: 'Registration start to exit (carryout / doctor end)',
    peakHour: 'Peak Arrival Hour',
    peakHourSub: 'Busiest 1-hour check-in window',
    primaryBottleneck: 'Primary Bottleneck',
    primaryBottleneckSub: 'Highest dwell time step',
    systemStatus: 'System Status',
    bottleneckSectionTitle: 'Daily Queue Stage Breakdown',
    bottleneckSectionSubtitle: 'Where patients spent the most time on this date, with severity and plain-language reasoning',
    hourlySectionTitle: 'Hourly Arrival Distribution Comparison',
    hourlySectionSubtitle: 'Comparing patient arrivals on this date against the overall range average',
    loading: 'Loading granular drill-down metrics for',
    errorPrefix: 'Failed to load drill-down data:',
    retryButton: 'Retry',
    emptyForDate: 'No granular queue records found on this date.',
    noData: 'No Data',
    headers: {
      stage: 'Stage',
      avgTime: 'Avg. Time',
      patients: 'Patients',
      level: 'Level',
      reason: 'Reason',
    },
  },
  compliance: {
    title: 'PHC Waiting Time Compliance',
    subtitle: 'How many patients finished within official Philippine Heart Center department time targets',
    patientsSeenLabel: 'Completed Visits Measured',
    operatingHoursLabel: 'OPD Operating Hours',
    operatingHoursUnit: 'hrs/day',
    avgTotalWaitLabel: "Avg. Patient's Total Waiting Time",
    thresholdTableTitle: 'Compliance Breakdown Against Department Standard',
    explainer: {
      summary:
        'Mirrors the official PHC OPD daily paper tracking sheet. Each completed patient is checked against 4 stage time limits: patients finishing within the limit count toward "Within Standard" (green), and the Compliance Rate is simply (Within Standard / Total Measured) x 100%.',
      details: [
        {
          label: 'Total Visit vs. Individual Steps',
          text: 'Row 1 checks the patient\'s entire clinic stay (<= 2 hrs 30 mins). Rows 2–4 check each individual step separately against its own target.',
        },
        {
          label: 'How rates are color-coded',
          text: '90% or higher = Green (Target Met); 75% to 89.9% = Amber (Needs Attention); below 75% = Red (Below Target).',
        },
        {
          label: 'Pending vs. official limits',
          text: 'Waiting Time (2h 30m), Examine & Treat (1h 45m), and Carryout (15m) come from official PHC forms; Initial Evaluation (30m) is an internal clinic benchmark.',
        },
      ],
    },
    rateLegend: {
      good: '90%+ Target Met',
      warn: '75%–89% Needs Attention',
      poor: '<75% Below Target',
    },
    headers: {
      stage: 'Queue Stage',
      standard: 'PHC Standard',
      withinStandard: 'Within Standard (<=)',
      exceededStandard: 'Exceeded Standard (>)',
      complianceRate: 'Compliance Rate',
    },
    stages: {
      waitingTime: 'Queue to Triage & Registration',
      evaluate: 'Initial Nursing Evaluation',
      examineTreat: 'Physician Examination & Treatment',
      carryout: 'Prescription Carryout & Disposition',
    },
    stageNotes: {
      waitingTime: 'Entire stay from registration start to carryout (or consultation end).',
      evaluate: 'Time spent at the registration/triage desk (internal 30-min benchmark).',
      examineTreat: 'Wait from finishing registration until called by the doctor.',
      carryout: 'Time spent completing doctor orders, prescriptions, or discharge.',
    },
  },
  forecasts: {
    lr: {
      title: 'Linear Regression Forecast',
      subtitle: 'Finds the overall straight-line direction of daily patient counts and projects tomorrow',
      r2Label: 'R² =',
      nextDayLabel: 'Next Day =',
      patientsUnit: 'patients',
      explainer: {
        summary:
          'Draws a straight trend line (orange dashed) through all past clinic days to show whether visits are steadily climbing, steady, or dropping. The red dot predicts tomorrow\'s count using the trend of the most recent 5 clinic days.',
        details: [
          {
            label: 'Why the red dot may differ from the orange line',
            text: 'The orange dashed line fits all days in your selected range to show the big-picture direction. Tomorrow\'s red prediction dot only uses the last 5 clinic days so it reacts quickly to recent shifts.',
          },
          {
            label: 'What Slope means',
            text: 'Slope is the average change in patients per clinic day. For example, +0.20 means the clinic gains roughly 1 extra patient every 5 clinic days; negative means gradual decline.',
          },
          {
            label: 'What R² (Line Fit) means',
            text: 'R² (0% to 100%) measures how tightly daily counts hug a straight line. A low R² (like 5%–15%) is very normal in hospitals because Monday–Friday patient counts naturally bounce up and down.',
          },
        ],
      },
      legend: {
        actual: 'Actual Patients',
        trend: 'Overall Trend Line',
        forecast: 'Tomorrow Forecast (5-Day Trend)',
      },
      cards: {
        trendTitle: 'Overall Direction (Slope)',
        r2Title: 'Straight-Line Fit (R²)',
        forecastTitle: 'Next-Day Prediction',
        forecastDesc: 'Calculated from the straight-line trend of the most recent 5 clinic days.',
      },
    },
    arima: {
      title: 'ARIMA Forecast',
      subtitle: 'Time-series prediction that learns from recent daily shifts and past forecast errors',
      aicPrefix: 'AIC:',
      modelTag: 'ARIMA (1,1,1)',
      forecastForPrefix: 'Forecast for',
      patientsUnit: 'patients',
      residualVariance: 'Residual Variance (σ²):',
      forecastDateLabel: 'Forecast Date',
      explainer: {
        summary:
          'ARIMA (1,1,1) predicts tomorrow\'s patient volume by combining 3 clues: yesterday\'s count (1), how much traffic changed from day to day (1), and how far off its recent guesses were (1).',
        details: [
          {
            label: 'How to read the graph',
            text: 'Blue dots show real daily patient counts. The purple line shows what ARIMA estimated for each past day, and the highlighted purple dot is tomorrow\'s prediction.',
          },
          {
            label: 'What AIC means',
            text: 'Akaike Information Criterion (AIC) scores how well the model fits the data without becoming overly complex. Lower AIC is better when comparing ARIMA setups (it cannot be compared directly to MAE/RMSE).',
          },
          {
            label: 'Weekday clinic schedule note',
            text: 'Because PHC OPD operates Monday–Friday, weekends and holidays are skipped in sequence. ARIMA treats consecutive clinic days as evenly spaced and acts as a smoothed short-term estimator.',
          },
        ],
      },
      legend: {
        actual: 'Actual Patients',
        fitted: 'Model Estimate (Fitted)',
        forecast: 'Tomorrow Forecast',
      },
      cards: {
        aicTitle: 'Model Fit Score (AIC)',
        aicDesc:
          'Balances prediction accuracy against model simplicity. Lower values indicate a cleaner statistical fit for this time series.',
        sigmaTitle: 'Daily Swing / Error Spread (σ²)',
        sigmaDesc:
          'Residual Variance measures how widely real daily patient counts bounce around the purple model line. Smaller means steadier days.',
      },
    },
    comparison: {
      title: 'Algorithm Comparison (How the Winner Is Picked)',
      explainer:
        'To pick the most reliable forecast, the system runs a "blind test" on past clinic days: for every historical day, each formula predicts that day using only earlier days, then we measure how far off each guess was. The formula with the lowest Avg. Error (MAE) wins.',
      conclusionPrefix: 'Engine Verdict:',
      headers: {
        algorithm: 'Forecasting Method',
        mae: 'Avg. Error (MAE)',
        rmse: 'Big-Miss Score (RMSE)',
        mase: 'vs. Last Week (MASE)',
      },
      algoDescriptions: {
        SMA: 'Simple Moving Average — plain average of the last 5 clinic days.',
        WMA: 'Weighted Moving Average — averages the last 5 days, giving more weight to recent days.',
        EMA: 'Exponential Moving Average — blends yesterday (30%) with prior momentum (70%).',
        'Linear Regression': 'Straight-line trend computed from the most recent 5 clinic days.',
        ARIMA: 'Time-series model using yesterday\'s count, day-to-day shifts, and past errors.',
        'Seasonal Naive': 'Baseline check — simply guesses the same patient count as 1 business week (5 clinic days) ago.',
      } as Record<string, string>,
      cheatSheet: [
        {
          term: 'MAE (Avg. Error)',
          meaning: 'Average number of patients the guess was off by per day. Lower is better (e.g., 8.0 means typically off by ~8 patients).',
        },
        {
          term: 'RMSE (Big-Miss Score)',
          meaning: 'Like MAE, but penalizes large mistakes heavily. If RMSE is much higher than MAE, there were sudden surprise spikes.',
        },
        {
          term: 'MASE (vs. Last Week)',
          meaning: 'Compares the model against guessing "same as 1 week ago." Below 1.00 beats the baseline; 1.00+ means traffic is flat or policy-capped.',
        },
        {
          term: 'AIC (ARIMA Score)',
          meaning: 'Statistical fit score specific to ARIMA balancing accuracy and simplicity (lower is better; separate scale from MAE/RMSE).',
        },
      ],
      arimaLabel: 'ARIMA',
      bestBadge: 'Winner (Used)',
      baselineBadge: 'Baseline',
      beatsBaseline: 'Beats baseline',
      matchesBaseline: 'Same/below baseline',
      bestIndicator: 'Winner',
    },
  },
} as const;
