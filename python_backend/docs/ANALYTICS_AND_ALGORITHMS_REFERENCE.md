# Analytics, Algorithms, and Mathematical Models Reference

This document provides an exhaustive, in-depth technical explanation of all mathematical formulas, statistical algorithms, queueing theory models, machine learning forecasting engines, and data preprocessing steps implemented in the `analytics` package of Heart Check PHC.

---

## 1. Constants and Single Source of Truth

Located in [analytics/constants.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/constants.py).

All system thresholds, capacity limits, and operational parameters are centralized here to prevent configuration drift between analytics and reporting.

| Constant Name | Value | Unit | Hardcoded vs Dynamic | Mathematical / Clinical Role |
|---|---|---|---|---|
| `MAX_ADULT_CUBICLES` | `5` | cubicles | Hardcoded constant | Physical capacity limit of Adult Consultation Clinic (1 room with 5 cubicles). |
| `MAX_PEDIA_CUBICLES` | `5` | cubicles | Hardcoded constant | Physical capacity limit of Pediatric Consultation Clinic (1 room with 5 cubicles). |
| `OPD_TARGET_MINUTES` | `150` | minutes | Hardcoded constant | Overall patient stay target: 2 hours 30 minutes from Queuing Time to Carry Out Completed. |
| `OVERWHELMED_MINUTES` | `30` | minutes | Hardcoded constant | Baseline threshold for queue stages. Average wait <= 30 min is classified as "Normal"; > 30 min is "Elevated". |
| `CRITICAL_MINUTES` | `60` | minutes | Hardcoded constant | Upper threshold (2x baseline). Average wait > 60 min is classified as "Overwhelmed". |
| `EVALUATE_TARGET_MINUTES` | `30` | minutes | Hardcoded constant | Target for "Evaluate patients" (Queuing Time to Initial Assessment). Matches `OVERWHELMED_MINUTES`. |
| `EXAMINE_TREAT_TARGET_MINUTES` | `105` | minutes | Hardcoded constant | Target for "Examine & treat Pts." (1 hour 45 minutes / 1.45 hours). Corresponds to Initial Assessment to Doctor Seen. |
| `CARRYOUT_TARGET_MINUTES` | `15` | minutes | Hardcoded constant | Target for "Carry out Dr's Orders" (Doctor Completed to Carry Out Completed). |
| `WAITING_TIME_TARGET_MINUTES` | `150` | minutes | Hardcoded constant | Paper form threshold label for "Waiting Time <= 2.5 hrs.". Matches `OPD_TARGET_MINUTES`. |
| `PHC_EXCEL_WAITING_TIME_TARGET_MINUTES` | `180` | minutes | Hardcoded constant | Authentic criteria in the hospital's official Excel template formula (`<= 03:00:00` / 3 hours) despite the cell label saying `<= 2.5 hrs.`. |
| `PHC_CONSULTATION_SHIFT_HOURS` | `7` | hours | Hardcoded constant | Standard consultation shift divisor used in PHC formula: `Patients Seen / Doctors on Duty / 7`. |
| `EMA_ALPHA` | `0.3` | scalar (0 to 1) | Hardcoded constant | Smoothing parameter for Exponential Moving Average forecasting. Gives 30% weight to current observation and 70% to previous smooth. |
| `WINDOW_SIZE` | `2` | days | Hardcoded constant | Minimum sliding window size for moving averages (SMA, WMA, Linear Regression). |
| `ARIMA_REFIT_INTERVAL` | `7` | days | Hardcoded constant | Parameter refitting interval during walk-forward backtesting to prevent performance degradation on large datasets. |
| `CONSULTATION_SERVICE` | `'consultation'` | string | Hardcoded constant | Normalized string identifier for general outpatient doctor consultation. |
| `SPECIALIZED_SERVICES` | list of 7 strings | string identifiers | Hardcoded list | Specialized single-server outpatient stations: `['warfarin', 'benzathine', 'ecg', 'opd_card', 'opd_screening', 'refill_prescription', 'opd_reschedule']`. |

---

## 2. Preprocessing and Duration Derivation Pipeline

Located in [analytics/preprocessing.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/preprocessing.py).

The function `preprocess_queue_data(df: pd.DataFrame) -> pd.DataFrame` transforms raw Supabase patient records into standardized analytics columns.

### 2.1 Column Renaming and Standardization
- `id` -> `patient_id`
- `created_at` -> `kiosk_time`
- `service` -> `purpose` (normalized via `.str.lower().str.strip()`)
- `patientNum` -> `queue_number`

### 2.2 Timezone Normalization
- All timestamp columns (`kiosk_time`, `reg_start`, `reg_end`, `consult_start`, `consult_end`, `carryout_start`, `carryout_end`) are converted to UTC-aware datetime series using `to_utc()`:
  - If timezone-naive: localized to UTC.
  - If timezone-aware: converted to UTC.

### 2.3 Live Patient Gating vs. Historical Row Protection
A critical invariant prevents stale or historical rows from having missing timestamps filled with current time (`now()`):
1. **Historical Records (`is_historical == True`):** Never filled with `now()`. Missing timestamps remain `NaT` (Not a Time).
2. **Prior-Day Live Records:** Because PHC OPD queues operate daily, an incomplete record from yesterday or last week is an orphaned record. Filling it with `now()` causes artificial multi-day wait times (e.g. 2,985 minutes).
3. **Qualification Condition:**
   `fill_as_live = (~is_historical) & (kiosk_date_manila == today_manila)`
   Only records that are non-historical AND have `kiosk_time` originating on today's calendar date in Asia/Manila are filled with `now()`.

### 2.4 NaT-Preserving Chronological Ordering (`_chron_max`)
To guarantee that sequential timestamps never regress chronologically, each stage timestamp is validated against the preceding milestone:
```python
def _chron_max(a: pd.Series, b: pd.Series) -> pd.Series:
    return pd.concat([a, b], axis=1).max(axis=1, skipna=False)
```
- **Rule:** Uses `skipna=False`. In pandas, standard `.max(axis=1)` skips `NaT`, which would resurrect an unreached stage with the preceding timestamp. With `skipna=False`, if stage `b` is `NaT`, the result remains `NaT`.
- **Sequential Application:**
  - `reg_start = _chron_max(kiosk_time, reg_start)`
  - `reg_end = _chron_max(reg_start, reg_end)`
  - `consult_start = _chron_max(reg_end, consult_start)`
  - `consult_end = _chron_max(consult_start, consult_end)`

### 2.5 Derived Queue Duration Formulas
All durations are derived in units of decimal minutes (`total_seconds() / 60`):

| Duration Column | Mathematical Formula | Stage Description | Condition / Gating |
|---|---|---|---|
| `wait_registration` | `(reg_start - kiosk_time) / 60` | Kiosk arrival to registration start | Computed for all patients who reached registration. |
| `service_registration` | `(reg_end - reg_start) / 60` | Duration of clerical triage/registration | Set to `pd.NA` if `reg_end` was not actually recorded (`~reg_end_reached`). |
| `wait_consultation` | `(consult_start - reg_end) / 60` | Registration completion to doctor seen | Set to `pd.NA` if `reg_end` was not recorded (`~reg_end_reached`). |
| `service_consultation` | `(consult_end - consult_start) / 60` | Duration of physical examination | Set to `pd.NA` if `consult_end` was not recorded (`~consult_end_reached`). |
| `service_carryout` | `(carryout_end - carryout_start) / 60` | Execution of physician orders | Optional. Only computed when both timestamps are present. |
| `total_time` | `(end_ts - reg_start) / 60` | Total hospital waiting and stay time | Telescoping total time. `end_ts` is `carryout_end` if recorded, falling back to `consult_end`. Starting point is `reg_start` (Queuing Time), preserving `wait_registration` as an independent metric. |

### 2.6 Localized Time Grouping
Extracted by converting `kiosk_time` to `Asia/Manila` (UTC+8):
- `visit_date = manila_time.dt.date`
- `hour = manila_time.dt.hour` (0 to 23 integer)
- `day_of_week = manila_time.dt.day_name()` (e.g., "Monday")

---

## 3. Mathematical Utilities and Queueing Theory (M/M/1 & M/M/c)

Located in [analytics/helpers.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/helpers.py) and [analytics/queue_metrics.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/queue_metrics.py).

### 3.1 Arrival Rate (lambda)
- **Function:** `arrival_rate(times: pd.Series) -> float`
- **Definition:** The average number of patient arrivals per minute.
- **Formula:**
  $$\lambda = \frac{1}{\text{mean inter-arrival time in minutes}}$$
- **Implementation:**
  1. Sort `kiosk_time` in ascending order.
  2. Compute first differences: `inter = times.sort_values().diff().dt.total_seconds() / 60`.
  3. Filter non-positive values: `inter = inter[inter > 0]`.
  4. Returns `round(1 / inter.mean(), 4)`. Returns `0.0` if empty.

### 3.2 Service Rate (mu)
- **Function:** `service_rate(durations: pd.Series) -> float`
- **Definition:** The average number of patients served per minute per station.
- **Formula:**
  $$\mu = \frac{1}{\text{mean service duration in minutes}}$$
- **Implementation:**
  1. Filter non-null, positive durations: `d = durations.dropna()[durations > 0]`.
  2. Returns `round(1 / d.mean(), 4)`. Returns `0.0` if empty.

### 3.3 Closed-Form M/M/1 Single-Server Model
- **Function:** `mm1(lam: float, mu: float) -> dict`
- **Application:** Used for Registration counter (single clerk), individual doctor cubicles, and specialized service stations (Warfarin, Benzathine, ECG, OPD Card).
- **Formulas:**
  - **Server Utilization:**
    $$\rho = \frac{\lambda}{\mu}$$
  - **Stability Condition:**
    $$\rho < 1$$
    If $\rho \ge 1$, the system is unstable (arrival rate equals or exceeds service rate, resulting in an infinite queue). Returns `status: "Unstable"`.
  - **Average Number in Queue ($L_q$):**
    $$L_q = \frac{\rho^2}{1 - \rho}$$
  - **Average Waiting Time in Queue ($W_q$):**
    $$W_q = \frac{L_q}{\lambda} = \frac{\rho}{\mu(1 - \rho)}$$
  - **Average Total Time in System ($W$):**
    $$W = \frac{1}{\mu - \lambda} = W_q + \frac{1}{\mu}$$

### 3.4 Multi-Server Erlang C Benchmark (M/M/c)
- **Function:** `mmc_benchmark(lam: float, mu: float, c: int) -> dict`
- **Application:** Used exclusively as a theoretical lower-bound benchmark for the consultation stage, showing the waiting time that would be achieved if patients were pulled from a single pooled queue rather than pre-assigned to individual doctor cubicles.
- **Formulas:**
  - **System Utilization per Server:**
    $$\rho = \frac{\lambda}{c \mu}$$
  - **Offered Load ($a$):**
    $$a = \frac{\lambda}{\mu}$$
  - **Probability that an Arriving Patient Must Wait ($P_q$, Erlang C formula):**
    $$P_q = \frac{\frac{a^c}{c!} \frac{c}{c - a}}{\sum_{n=0}^{c-1} \frac{a^n}{n!} + \frac{a^c}{c!} \frac{c}{c - a}}$$
  - **Average Number in Queue ($L_q$):**
    $$L_q = P_q \frac{\rho}{1 - \rho}$$
  - **Average Wait in Queue ($W_q$):**
    $$W_q = \frac{L_q}{\lambda}$$

### 3.5 Per-Cubicle Consultation Queue Analysis
- **Function:** `per_cubicle_metrics(df: pd.DataFrame, clinic: str = 'adult') -> dict`
- **Clinic Filter:** Filters by `purpose == 'consultation'` and `clinic_type == clinic` ('adult' or 'pedia').
- **Cubicle Filtering:** Minimum threshold of 3 patients required to evaluate a cubicle (`len(cub_data) >= 3`).
- **Overload Flag:** `overloaded = True` if cubicle utilization $\rho > 0.80$.
- **Load Imbalance Metric:**
  $$\Delta\rho = \max(\rho) - \min(\rho)$$
  Status is `"Imbalanced"` if $\Delta\rho > 0.20$, otherwise `"Balanced"`.

### 3.6 System Time and Little's Law Validation
- **Function:** `system_time_report(df: pd.DataFrame) -> dict`
- **Observed Mean Total Time ($W$):** Average of `total_time` across all completed visits.
- **Target Compliance:** Tested against `OPD_TARGET_MINUTES` (150 minutes).
  - `within_target = (W <= 150)`
  - `excess_min = max(0.0, W - 150)`
- **Little's Law Formula:**
  $$L = \lambda \times W$$
  Represents the average concurrent number of patients inside the hospital system at any given moment. Returns `L_observed = round(lam * W, 4)`.

---

## 4. Descriptive Analytics and Bottleneck Detection

Located in [analytics/descriptive.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/descriptive.py).

### 4.1 Daily Aggregation
- **Function:** `daily_summary(df: pd.DataFrame) -> pd.DataFrame`
- **Grouping:** Grouped by `visit_date`.
- **Metrics:**
  - `total_patients`: `count(patient_id)`
  - `avg_wait_registration`: `mean(wait_registration)`
  - `avg_wait_consultation`: `mean(wait_consultation)`
  - `avg_total_time`: `mean(total_time)` (negative values filtered out)

### 4.2 Hourly Queue Stage Breakdown
- **Function:** `hourly_pattern(df: pd.DataFrame) -> pd.DataFrame`
- **Grouping:** Grouped by `hour` (0 to 23).
- **Stage Metrics Computed Per Hour:**
  - `avg_patients`: Total arrivals in hour.
  - `avg_wait_registration`: Mean wait from kiosk to registration.
  - `avg_service_registration`: Mean registration service duration.
  - `avg_wait_consultation`: Mean wait from registration end to doctor consultation start.
  - `avg_service_consultation`: Mean doctor consultation duration.
  - `avg_service_carryout`: Mean carryout execution duration.
- **Time Label Formatting:** `f"{h:02d}:00–{h+1:02d}:00"` (e.g., `"08:00–09:00"`).

### 4.3 Five-Stage Bottleneck Detection
- **Function:** `bottleneck_report(df: pd.DataFrame) -> dict`
- **The 5 Monitored Stages:**
  1. `kiosk_to_registration_wait` (`wait_registration`)
  2. `registration_duration` (`service_registration`)
  3. `registration_to_consult_wait` (`wait_consultation`)
  4. `consultation_duration` (`service_consultation`)
  5. `carryout_duration` (`service_carryout`)
- **Severity Classification Function:** `_classify_level(avg_minutes: float)`
  - `Normal`: `avg_minutes <= 30.0`
  - `Elevated`: `30.0 < avg_minutes <= 60.0`
  - `Overwhelmed`: `avg_minutes > 60.0`
  - `No Data`: If 0 qualifying patient records exist for that stage.
- **Primary Bottleneck Selection:**
  - Ranks stages by severity: `Overwhelmed (3) > Elevated (2) > Normal (1) > No Data (0)`.
  - Breaks ties using the highest `avg_minutes`.
  - Stages with `"No Data"` are never selected as the primary bottleneck.
- **Plain Language Explanations (`_stage_reason`):**
  Generates contextual feedback for clinical staff, reporting the exact minutes over threshold and the multiple of the baseline (e.g., `"12.5 min over the 30-min elevated threshold (1.4x the 30-min baseline)"`).

### 4.4 PHC Compliance Summary (Paper Tracking Sheet Parity)
- **Function:** `phc_compliance_summary(df: pd.DataFrame, opd_hours: float = 8.0) -> dict`
- **Definition:** Replicates the exact 4 compliance buckets tallying patients on the hospital's physical paper tracking form:
  1. **Waiting Time:**
     - `waiting_time_le`: Patients with `total_time <= 150 min` (2.5 hrs).
     - `waiting_time_gt`: Patients with `total_time > 150 min`.
  2. **Evaluate Patients:**
     - `evaluate_le`: Patients with `service_registration <= 30 min`.
     - `evaluate_gt`: Patients with `service_registration > 30 min`.
  3. **Examine & Treat Patients:**
     - Evaluates Column AA (`wait_consultation`):
     - `examine_treat_le`: Patients with `wait_consultation <= 105 min` (1.45 hrs).
     - `examine_treat_gt`: Patients with `wait_consultation > 105 min`.
  4. **Carry Out Orders:**
     - `carryout_le`: Patients with `service_carryout <= 15 min`.
     - `carryout_gt`: Patients with `service_carryout > 15 min`.

---

## 5. Machine Learning and Time-Series Forecasting

Located in [analytics/forecasting.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/forecasting.py).

The system evaluates 5 distinct mathematical and statistical models on historical daily patient arrival volumes using walk-forward backtesting. The model achieving the lowest Mean Absolute Error (MAE) is selected to generate the next-day forecast.

### 5.1 Volume Time-Series Construction
- Historical patient volumes are grouped by `visit_date`:
  `volumes = df.groupby('visit_date')['patient_id'].count().sort_index().values`
- **Minimum Data Requirement:** Requires at least `WINDOW_SIZE + 2` days (4 days minimum). If fewer days exist, falls back to the historical mean.

### 5.2 Evaluated Forecasting Algorithms

#### Model 1: Simple Moving Average (SMA)
- **Type:** Statistical moving average.
- **Formula:**
  $$\hat{Y}_{t+1} = \frac{1}{k} \sum_{i=0}^{k-1} Y_{t-i}$$
- **Window Size ($k$):** `WINDOW_SIZE = 2` days.
- **Rationale:** Smooths short-term fluctuations by equal weighting.

#### Model 2: Weighted Moving Average (WMA)
- **Type:** Statistical linear-decay moving average.
- **Formula:**
  $$\hat{Y}_{t+1} = \frac{\sum_{i=1}^{k} i \cdot Y_{t - k + i}}{\sum_{i=1}^{k} i}$$
- **Weights:** Ascending linear weights `[1, 2]`. The most recent day receives weight 2; the previous day receives weight 1.
- **Rationale:** Gives greater importance to the most recent patient trend.

#### Model 3: Exponential Moving Average (EMA)
- **Type:** Recursive statistical exponential smoothing.
- **Formula:**
  $$\hat{Y}_{t+1} = \alpha Y_t + (1 - \alpha) S_t$$
- **Smoothing Parameter ($\alpha$):** `EMA_ALPHA = 0.3` (30% weight to current day, 70% to smoothed history).
- **Initialization:** Initialized with the mean of the first window: `current_ema = np.mean(volumes[:window_size])`.

#### Model 4: Linear Regression (LR)
- **Type:** Supervised Machine Learning (`sklearn.linear_model.LinearRegression`).
- **Feature Vector:** One-dimensional time step indices $X = [0, 1, \dots, k-1]$.
- **Target Vector:** Patient counts over the sliding window $Y = [V_0, V_1, \dots, V_{k-1}]$.
- **One-Step-Ahead Forecast:**
  $$\hat{Y}_{t+1} = \max(0.0, \beta_0 + \beta_1 \cdot k)$$
- **Trend Classification:**
  - $\beta_1 > 0$: `"increasing"`
  - $\beta_1 < 0$: `"decreasing"`
  - $\beta_1 = 0$: `"stable"`
- **Coefficient of Determination ($R^2$):**
  $$R^2 = 1 - \frac{\sum (Y - \hat{Y})^2}{\sum (Y - \bar{Y})^2}$$

#### Model 5: AutoRegressive Integrated Moving Average (ARIMA)
- **Type:** Time-series autoregressive model (`statsmodels.tsa.arima.model.ARIMA`).
- **Order Specification:** $(p=1, d=1, q=1)$ hardcoded constant `ARIMA_ORDER = (1, 1, 1)`.
  - $p=1$: Autoregressive term (1 lag).
  - $d=1$: First-order differencing to ensure stationarity.
  - $q=1$: Moving average error term (1 lag).
- **Optimized Walk-Forward Backtesting (`_backtest_arima`):**
  - Fitting an ARIMA model on every day of a 2-year dataset would require ~700 separate numerical optimizations, causing severe API latency.
  - Optimization: The model refits parameters only every `ARIMA_REFIT_INTERVAL = 7` days.
  - Intermediate days use `.append([history[-1]], refit=False)`, updating the model state without re-running parameter optimization.
  - Fallback: If numerical convergence fails, falls back to the historical mean.
- **Model Evaluation Criterion (AIC):**
  $$AIC = 2k - 2\ln(\hat{L})$$
  Extracted via `result.aic` for assessing model quality.

### 5.3 Model Selection and Evaluation Metrics
Every model is tested across the entire backtest range $[k, \dots, N-1]$:
- **Mean Absolute Error (MAE):**
  $$\text{MAE} = \frac{1}{n} \sum_{i=1}^{n} |Y_i - \hat{Y}_i|$$
- **Root Mean Squared Error (RMSE):**
  $$\text{RMSE} = \sqrt{\frac{1}{n} \sum_{i=1}^{n} (Y_i - \hat{Y}_i)^2}$$
- **Selection Decision:**
  The winning model is selected by strictly minimizing MAE:
  $$\text{Best Model} = \arg\min_m (\text{MAE}_m)$$
  The winning model is then executed on the most recent window to output `next_day_forecast`.

---

## 6. Staffing and Capacity Decision Support

Located in [analytics/staffing.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/staffing.py).

The function `recommend_staff(...)` computes the minimum number of doctors and cubicles required to keep server utilization below the operational target cap of 80%.

### 6.1 Input Parameters
| Parameter | Default Value | Hardcoded vs Dynamic | Description |
|---|---|---|---|
| `forecasted_patients` | Dynamic | From forecasting winner | Predicted total outpatient volume for the next operating day. |
| `opd_hours` | `8.0` | Configurable | Daily operating shift hours. |
| `avg_service_time_min` | Dynamic | From historical data (default 15.0) | Average doctor consultation duration in minutes. |
| `p_adult` | `0.50` | Configurable (50%) | Proportion of consultation patients routed to Adult Clinic. |
| `p_pedia` | `0.50` | Configurable (50%) | Proportion of consultation patients routed to Pediatric Clinic. |
| `p_consultation` | `0.65` | Configurable (65%) | Proportion of total outpatients requiring doctor consultation (vs specialized stations). |
| `target_utilization` | `0.80` | Hardcoded constant (80%) | Maximum acceptable server utilization ($\rho_{\text{target}}$) to prevent queue instability. |

### 6.2 Mathematical Derivation
1. **Service Rate ($\mu$):**
   $$\mu = \frac{1}{\text{avg\_service\_time\_min}} \quad (\text{patients / min})$$
2. **Consultation Arrival Rate ($\lambda_{\text{con}}$):**
   $$\lambda_{\text{con}} = \frac{\text{forecasted\_patients} \times p_{\text{consultation}}}{\text{opd\_hours} \times 60} \quad (\text{patients / min})$$
3. **Clinic Specific Arrival Rate:**
   $$\lambda_{\text{adult}} = \lambda_{\text{con}} \times p_{\text{adult}}, \quad \lambda_{\text{pedia}} = \lambda_{\text{con}} \times p_{\text{pedia}}$$
4. **Required Doctors / Cubicles ($c$):**
   $$c = \left\lceil \frac{\lambda}{\mu \times \rho_{\text{target}}} \right\rceil$$
5. **Capacity Capping:**
   $$c_{\text{capped}} = \min(c, \text{MAX\_CUBICLES})$$
   Where `MAX_ADULT_CUBICLES = 5` and `MAX_PEDIA_CUBICLES = 5`.
6. **Expected Utilization:**
   $$\rho_{\text{expected}} = \frac{\lambda}{c_{\text{capped}} \times \mu}$$
7. **Capacity Feasibility Warning:**
   If $c > \text{MAX\_CUBICLES}$, a warning is generated advising management to extend OPD operating hours or re-route patients.

---

## 7. Master Report Aggregation and JSON Sanitization

Located in [analytics/report.py](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/analytics/report.py).

### 7.1 Aggregation Workflow (`generate_report`)
1. Checks for empty input DataFrame; if empty, returns `_empty_report()`.
2. Runs `preprocess_queue_data(df)`.
3. Derives `avg_service_min` from completed consultations (fallback `15.0`).
4. Executes `evaluate_forecasting_algorithms` to obtain `predicted_vol`.
5. Assembles all descriptive, queue, forecasting, and staffing dictionaries into a unified payload.
6. Passes the complete dictionary through `convert_to_native(report)`.

### 7.2 Strict JSON Sanitization (`convert_to_native`)
Standard JSON specification does not support `NaN` (Not a Number) or `Infinity`. Python's native `json.dumps` by default outputs literal tokens `NaN` and `Infinity`, which causes browser `fetch()` and `JSON.parse()` to throw syntax errors.

The `convert_to_native` function recursively walks every dictionary, list, and tuple:
- Converts `np.integer`, `np.int64`, `np.int32` to standard Python `int`.
- Converts `np.floating`, `np.float64`, `np.float32` to standard Python `float`.
- Sanitizes any `math.isnan(val)` or `math.isinf(val)` to `None` (which serializes as valid JSON `null`).
- Converts `pd.NA` and `pd.NaT` to `None`.
- Converts `np.bool_` to Python `bool`.
- Converts `np.ndarray` and `pd.Series` to standard Python lists.
