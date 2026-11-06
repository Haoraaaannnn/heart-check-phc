# Chapter 3: Mathematical Modeling and Algorithmic Framework

**Project Title:** Heart Check PHC: A Kiosk-Based Queue Management and Analytics System  
**Institution:** Philippine Heart Center (PHC), Outpatient Department (OPD)  
**Academic Affiliation:** BS Computer Science, STI College Caloocan  
**Authors:** Justin Dayle D. Caasi, Reign Daniel C. Gutierrez, Lenardo R. Jualo, Jensen B. Urrutia  
**Document Version:** 1.0.0  
**Effective Date:** 2026-11-03  

---

## 3.X Mathematical Modeling and Algorithmic Framework

This section details the mathematical formulations, queueing models, predictive time-series forecasting algorithms, and statistical data treatments integrated into the **Heart Check PHC** platform. These formulations serve as the analytical engine powering the self-service kiosk, the real-time operational workstations, the administrative analytics dashboard, and the empirical validation of outpatient patient flow.

---

### 3.X.1 Estimated Wait Time (EWT) Formulation

To provide incoming patients with an immediate, transparent expectation of waiting duration upon check-in, the self-service kiosk computes a hybrid Estimated Wait Time (EWT) at the exact moment of queue ticket generation. The calculation combines real-time queue position with empirical service rate averages and an operational buffer:

$$\text{EWT} = (P_a \times S_{\text{avg}}) + B$$

Where:
* **$\text{EWT}$** = Estimated Wait Time (in minutes) displayed on the kiosk screen, printed on the thermal queue slip, and transmitted via cellular SMS.
* **$P_a$** = **Position Ahead**, representing the count of active, unserved patients currently waiting in the same clinical service lane whose arrival timestamps precede the current patient ($\text{status} = \text{'waiting'}$ and $\text{created\_at} < \text{current\_ticket}$).
* **$S_{\text{avg}}$** = **Rolling Average Service Duration** (in minutes) for the selected clinical service, derived from historical consultation records for the matching hour-of-day operational window:
  $$S_{\text{avg}} = \frac{1}{m}\sum_{j=1}^m (\text{consult\_end}_j - \text{consult\_start}_j)$$
* **$B$** = **Operational Buffer**, fixed at **$5\text{ minutes}$** to account for physical patient transit between the waiting lounge and the examination cubicle, physician sanitization routines, and inter-patient handover delays.

---

### 3.X.2 Markovian Queueing Theory Formulations

Queueing processes within the Philippine Heart Center Outpatient Department are modeled using Kendall's notation under Markovian assumptions ($M/M/1$ and $M/M/c$). Service stages are analyzed independently to account for the physical constraints of single-server counters and cubicles.

#### 1. Parameter Estimation (Arrival and Service Rates)
Arrival and service rates are estimated empirically from patient timestamps:

* **Mean Arrival Rate ($\lambda$):** The rate at which patients arrive at the queue stage, computed as the reciprocal of the mean inter-arrival time:
  $$\lambda = \frac{1}{\bar{T}_{\text{inter}}} = \frac{1}{\frac{1}{n-1}\sum_{i=2}^n (t_i - t_{i-1})}$$
  Where $t_i$ represents the check-in or arrival timestamp of patient $i$ in minutes, expressed in patients per minute ($\text{patients/min}$).

* **Mean Service Rate ($\mu$):** The rate at which a server processes patients, computed as the reciprocal of the mean service duration:
  $$\mu = \frac{1}{\bar{S}} = \frac{1}{\frac{1}{n}\sum_{i=1}^n (\text{end\_time}_i - \text{start\_time}_i)}$$
  Expressed in patients per minute ($\text{patients/min}$).

---

#### 2. Single-Server Queue Model ($M/M/1$)
The $M/M/1$ queue model governs stages where a single server processes a dedicated stream of patients under First-In, First-Out (FIFO) discipline:
* Registration Counters 1 through 5 (each counter modeled as an independent single clerk).
* Consultation Cubicles (each cubicle modeled as an independent single-doctor queue because patients are pre-assigned to specific attending physicians).
* Specialized Diagnostic Stations (ECG, Warfarin Clinic, and Benzathine injections).

For each station, the operational metrics are derived using closed-form Markovian equations:

* **Traffic Intensity / Server Utilization ($\rho$):**
  $$\rho = \frac{\lambda}{\mu}$$
  *Stability Condition:* The system is steady and mathematically stable if and only if $\rho < 1$ ($\lambda < \mu$). If $\rho \ge 1$, the arrival rate exceeds processing capacity, resulting in an infinitely expanding bottleneck ($\text{status} = \text{'Unstable'}$).

* **Average Number of Patients in Queue ($L_q$):**
  $$L_q = \frac{\rho^2}{1 - \rho} = \frac{\lambda^2}{\mu(\mu - \lambda)}$$

* **Average Waiting Time in Queue ($W_q$):**
  $$W_q = \frac{L_q}{\lambda} = \frac{\lambda}{\mu(\mu - \lambda)} = \frac{\rho}{\mu(1 - \rho)}$$

* **Average Total Time in the System ($W$):**
  By Little's Law, total system time includes both queue wait time and active service duration:
  $$W = W_q + \frac{1}{\mu} = \frac{1}{\mu - \lambda}$$

* **Average Number of Patients in the System ($L$):**
  $$L = \lambda W = \frac{\lambda}{\mu - \lambda} = L_q + \rho$$

---

#### 3. Multi-Server Theoretical Benchmark ($M/M/c$ / Erlang C)
To assess the structural efficiency of PHC's policy of assigning patients to dedicated doctor cubicles versus pooling them into a shared multi-server queue, the system computes the multi-server $M/M/c$ model as a **theoretical lower-bound benchmark**:

* **Multi-Server Traffic Intensity ($\rho$):**
  $$\rho = \frac{\lambda}{c \cdot \mu}$$
  Where $c$ represents the number of available active consultation cubicles ($c = 5$ for Adult Cardiology, $c = 5$ for Pediatric Cardiology). Stability requires $\rho < 1$.

* **Offered Load ($a$):**
  $$a = \frac{\lambda}{\mu}$$

* **Erlang C Formula — Probability of Delay ($P_q$ or $C(c, a)$):**
  The probability that an arriving patient must wait in queue before being examined:
  $$P_q = \frac{\frac{a^c}{c!} \left(\frac{1}{1 - \rho}\right)}{\sum_{k=0}^{c-1} \frac{a^k}{k!} + \frac{a^c}{c!} \left(\frac{1}{1 - \rho}\right)}$$

* **Theoretical Benchmark Queue Length ($L_q$):**
  $$L_q = P_q \cdot \frac{\rho}{1 - \rho}$$

* **Theoretical Benchmark Waiting Time in Queue ($W_q$):**
  $$W_q = \frac{L_q}{\lambda}$$

> *Note on Operational Interpretation:* In actual clinical operations, patients are pre-assigned to designated specialists, causing queues to operate as parallel, independent $M/M/1$ queues. The $M/M/c$ benchmark demonstrates to hospital management the theoretical minimum wait time achievable if cross-cubicle doctor pooling were physically implemented.

---

### 3.X.3 Time-Series Patient Volume Forecasting Algorithms

The predictive analytics tier forecasts next-day outpatient arrival volumes to assist hospital administrators in scheduling attending physicians, sizing nursing triage staff, and setting appointment booking caps. The platform evaluates five distinct forecasting algorithms alongside a baseline model using walk-forward (rolling-origin) back-testing over historical hospital records.

All moving models operate over a standard sliding window of $k = 5$ clinic operating days (1 hospital business week, defined as `WINDOW_SIZE = 5` in the analytics configuration).

#### The Clinical Operational Scenario: PHC Cardiology Outpatient Intake
To illustrate the mathematical behavior of each algorithm in actual hospital operations, consider the Philippine Heart Center (PHC) Adult Cardiology Outpatient Department planning staffing and resources for the upcoming **Monday ($y_t$)**.

Over the preceding 5 operating days, the self-service kiosks and triage desks recorded the following daily patient check-in counts:

| Operating Day | Historical Series | Recorded Patients ($y$) | Clinical Situation at PHC OPD |
| :--- | :---: | :---: | :--- |
| **Day 1 (Last Mon)** | $y_{t-5}$ | **160** | **Post-weekend surge** (unmanaged walk-ins, triage queue pileup) |
| **Day 2 (Last Tue)** | $y_{t-4}$ | **130** | Routine adult cardiology follow-ups and diagnostic appointments |
| **Day 3 (Last Wed)** | $y_{t-3}$ | **115** | Warfarin clinic and specialized pediatric cardiology sessions |
| **Day 4 (Last Thu)** | $y_{t-2}$ | **105** | ECG, 2D-Echo scheduling, and routine prescription refills |
| **Day 5 (Last Fri)** | $y_{t-1}$ | **90** | Pre-weekend taper (lower walk-in demand before the weekend) |

---

#### 1. Baseline Model: Seasonal-Naive
The Seasonal-Naive model serves as the empirical benchmark ($s = 5\text{ business days}$, representing one hospital operating week):
$$\hat{y}_t = y_{t-s} = y_{t-5}$$

* **Step-by-Step Hospital Calculation:**
  $$\hat{y}_{\text{Monday}} = y_{\text{Last Monday}} = \mathbf{160\text{ patients}}$$
* **Operational Rationale:** Hospital scheduling frequently follows strict weekly habits. Because PHC clinics are closed over Saturday and Sunday, Monday consistently encounters post-weekend influx. The Seasonal-Naive baseline assumes this Monday will repeat the previous Monday's volume.
* **Role in Evaluation:** It does not compete to be chosen; it serves as the denominator for the Mean Absolute Scaled Error (MASE) to verify whether mathematical models beat simple weekly repetition.

---

#### 2. Algorithm 1: Simple Moving Average (SMA)
Computes the unweighted arithmetic mean of patient arrivals over the preceding sliding window of $k = 5$ clinic operating days:
$$\hat{y}_t = \frac{1}{k}\sum_{i=1}^k y_{t-i} = \frac{y_{t-1} + y_{t-2} + y_{t-3} + y_{t-4} + y_{t-5}}{5}$$

* **Step-by-Step Hospital Calculation:**
  $$\hat{y}_{\text{Monday}} = \frac{160 + 130 + 115 + 105 + 90}{5} = \frac{600}{5} = \mathbf{120\text{ patients}}$$
* **Hospital Administrative Decision:** The OPD Head Nurse stocks triage consumables (thermal kiosk paper rolls, sterile ECG electrodes, patient jacket folders) for **120 patients**.
* **Operational Characteristic:** Effectively smooths out isolated single-day anomalies. However, it reacts slowly to sustained downward or upward volume trajectories because it assigns equal 20% weight to both high Monday (160) and low Friday (90).

---

#### 3. Algorithm 2: Weighted Moving Average (WMA)
Assigns linearly increasing weights to more recent observation days, emphasizing immediate clinic demand trends over the 5-day window:
$$\hat{y}_t = \frac{\sum_{i=1}^k w_i \cdot y_{t-k+i}}{\sum_{i=1}^k w_i}$$

Using standardized linear ascending weights $w = [1, 2, 3, 4, 5]$ with total sum $\sum_{i=1}^5 w_i = 15$:
$$\hat{y}_t = \frac{1\cdot y_{t-5} + 2\cdot y_{t-4} + 3\cdot y_{t-3} + 4\cdot y_{t-2} + 5\cdot y_{t-1}}{15}$$

* **Step-by-Step Hospital Calculation:**
  $$\hat{y}_{\text{Monday}} = \frac{(1 \times 160) + (2 \times 130) + (3 \times 115) + (4 \times 105) + (5 \times 90)}{15}$$
  $$\hat{y}_{\text{Monday}} = \frac{160 + 260 + 345 + 420 + 450}{15} = \frac{1{,}635}{15} = \mathbf{109\text{ patients}}$$
* **Hospital Administrative Decision:** WMA forecasts **109 patients** (11 fewer than SMA).
* **Clinical Benefit:** Recognizing that late-week volume declined (due to adverse weather or transit disruptions), the Medical Director schedules **4 attending cardiologists** across active cubicles instead of opening 5, reassigning 1 physician to inpatient ward rounds to prevent idle clinical capacity.

---

#### 4. Algorithm 3: Exponential Moving Average (EMA)
Applies exponentially decreasing weights across all historical observations using a smoothing factor $\alpha = 0.3$:
$$\hat{y}_t = \alpha \cdot y_{t-1} + (1 - \alpha) \cdot \hat{y}_{t-1}$$
Where:
* $\alpha = 0.3$ allocates $30\%$ weighting to yesterday's actual patient volume ($y_{t-1}$).
* $1 - \alpha = 0.7$ allocates $70\%$ weighting to the historical smoothed volume projection ($\hat{y}_{t-1}$).

* **Step-by-Step Hospital Calculation:**
  Assuming PHC's long-term smoothed baseline was $\hat{y}_{t-1} = 125\text{ patients}$, and Friday recorded $y_{t-1} = 90\text{ patients}$:
  $$\hat{y}_{\text{Monday}} = (0.3 \times 90) + (0.7 \times 125) = 27.0 + 87.5 = 114.5 \approx \mathbf{115\text{ patients}}$$
* **Hospital Administrative Decision:** Prepares registration desks and nurse stations for **115 patients**.
* **Clinical Benefit:** Retains institutional memory of normal hospital traffic (70%) while acknowledging Friday's dip (30%). If Friday's drop was an isolated event, EMA protects the hospital from under-staffing reception counters.

---

#### 5. Algorithm 4: Ordinary Least Squares Linear Regression (LR)
Models patient arrival volume as a linear function of sequential clinic operating time ($t \in \{0, 1, 2, 3, 4\}$):
$$\hat{y}_t = \beta_0 + \beta_1 t$$
Where regression parameters are determined by minimizing residual sum of squares:
$$\beta_1 = \frac{\sum_{i=0}^{k-1} (t_i - \bar{t})(y_i - \bar{y})}{\sum_{i=0}^{k-1} (t_i - \bar{t})^2}, \quad \beta_0 = \bar{y} - \beta_1 \bar{t}$$

* **Step-by-Step Hospital Calculation:**
  With time indices $t = [0, 1, 2, 3, 4]$ and volumes $y = [160, 130, 115, 105, 90]$:
  - Mean time: $\bar{t} = 2.0$
  - Mean volume: $\bar{y} = 120.0$
  - Slope ($\beta_1$): $-16.5\text{ patients/day}$ (the department lost an average of 16.5 patients each operating day)
  - Intercept ($\beta_0$): $153.0\text{ patients}$
  - Evaluating for next operating day ($t = 5$):
    $$\hat{y}_{\text{Monday}} = 153.0 + (-16.5 \times 5) = 153.0 - 82.5 = \mathbf{70.5 \approx 71\text{ patients}}$$
    *(Enforced in Python code with `max(0.0, forecast)` to guarantee non-negative volume).*
* **Hospital Administrative Decision:** Forecasts a continued volume contraction to **71 patients**.
* **Clinical Benefit:** The Outpatient Pharmacy and Billing Sections are alerted that early morning queues will be exceptionally low, allowing staff to conduct drug inventory audits and chart reconciliation during morning hours.

---

#### 6. Algorithm 5: AutoRegressive Integrated Moving Average ($\text{ARIMA}(1,1,1)$)
A stationary, differenced time-series model capturing autoregressive momentum and moving average residual corrections:
$$\Delta y_t = c + \phi_1 \Delta y_{t-1} + \theta_1 \epsilon_{t-1} + \epsilon_t$$
Where:
* **$\Delta y_t = y_t - y_{t-1}$** = First-order differencing ($d = 1$) to remove non-stationarity across daily volume totals.
* **$p = 1$** = First-order autoregressive parameter ($\phi_1$), capturing whether yesterday's volume rate of change persists.
* **$q = 1$** = First-order moving average parameter ($\theta_1$), correcting for residual errors from the previous day.
* **$\epsilon_t$** = White noise error term with zero mean and constant variance ($\epsilon_t \sim \mathcal{N}(0, \sigma^2)$).

* **Hospital Calculation & Decision:** Evaluated via `statsmodels.tsa.arima.model.ARIMA`, yielding a stabilized prediction of **$\approx 85\text{ to }95\text{ patients}$**.
* **Clinical Benefit:** Automatically self-adjusts for systematic forecast overshoot or undershoot in cardiology subspecialty clinics without requiring manual rule recalibrations.

---

### 3.X.4 Forecast Accuracy Metrics, Walk-Forward Backtesting, and Model Selection

#### 1. Walk-Forward (Rolling-Origin) Back-Testing
Standard machine learning cross-validation (such as $k$-fold cross-validation) shuffles data randomly across time. In healthcare time series, this is methodologically invalid because it introduces **look-ahead bias** (using future data to predict the past).

To evaluate model accuracy under authentic hospital operating conditions, the backend pipeline implements **walk-forward (rolling-origin) back-testing**:
1. At day index $i = 5$ (`window_size`), the system uses only observations up to day 4 to generate a one-step-ahead forecast $\hat{y}_5$.
2. The forecast $\hat{y}_5$ is logged alongside the actual observed patient count $y_5$.
3. The origin rolls forward by 1 clinic day ($i \leftarrow i + 1$). At day 6, observations up to day 5 are used to predict day 6.
4. This chronological simulation advances across all historical clinic operating dates without look-ahead contamination.

#### 2. Mean Absolute Error (MAE) — Primary Deciding Metric
Measures the average magnitude of prediction errors in actual patient units:
$$\text{MAE} = \frac{1}{N}\sum_{t=1}^N |y_t - \hat{y}_t|$$
Where $y_t$ is the actual recorded patient volume on day $t$, $\hat{y}_t$ is the forecasted volume, and $N$ is the number of evaluated clinic days.
* **Clinical Meaning:** An $\text{MAE} = 11.4$ indicates that, on average, the daily forecast deviates from actual clinic arrivals by approximately 11 patients.

#### 3. Root Mean Squared Error (RMSE) — Secondary Outlier Metric
Measures the square root of the mean squared errors:
$$\text{RMSE} = \sqrt{\frac{1}{N}\sum_{t=1}^N (y_t - \hat{y}_t)^2}$$
* **Clinical Meaning:** Because errors are squared before averaging, RMSE heavily penalizes large isolated forecast misses (e.g. failing to anticipate an unannounced post-holiday surge).

#### 4. Mean Absolute Scaled Error (MASE) — Relative Benchmark Metric
Normalizes model error against the Seasonal-Naive baseline to provide scale-independent comparative evaluation:
$$\text{MASE} = \frac{\text{MAE}_{\text{model}}}{\text{MAE}_{\text{baseline}}} = \frac{\frac{1}{N}\sum_{t=1}^N |y_t - \hat{y}_t|}{\frac{1}{N}\sum_{t=1}^N |y_t - y_{t-s}|}$$
* **$\text{MASE} < 1.0$:** The forecasting algorithm outperforms the seasonal-naive baseline, proving genuine predictive capability.
* **$\text{MASE} \ge 1.0$:** The algorithm fails to improve over weekly repetition (demonstrating that daily volumes are capped by hospital appointment quotas rather than free mathematical variation).

#### 5. Example Backtesting Scorecard and Model Selection Rule
The backend analytics pipeline evaluates MAE across all candidate models and automatically selects the algorithm with the lowest MAE:
$$\text{Model}_{\text{selected}} = \arg\min_{m \in \{\text{SMA}, \text{WMA}, \text{EMA}, \text{LR}, \text{ARIMA}\}} (\text{MAE}_m)$$

| Algorithm | Model Type | Historical MAE (Patients) | RMSE | MASE | Selection Status |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Seasonal-Naive** | Baseline Benchmark | 14.20 | 18.50 | 1.0000 | Benchmark denominator |
| **Simple Moving Average (SMA)** | Statistical Smoother | 13.10 | 16.80 | 0.9225 | Evaluated |
| **Weighted Moving Average (WMA)** | Statistical Smoother | **11.40** | **14.20** | **0.8028** | **Selected Winner (Lowest MAE)** |
| **Exponential Moving Average (EMA)** | Exponential Smoother | 12.00 | 15.30 | 0.8451 | Evaluated |
| **Linear Regression (LR)** | Machine Learning | 16.80 | 21.40 | 1.1831 | Evaluated |
| **ARIMA(1,1,1)** | Stochastic Time-Series | 11.80 | 14.90 | 0.8310 | Evaluated |

In this backtest evaluation, **WMA** achieves the lowest MAE (**11.40 patients/day**) and $\text{MASE} = 0.8028 < 1.0$ (a 19.72% error reduction over the seasonal baseline). The system automatically selects WMA to compute tomorrow's official clinic volume.

#### 6. Computational Performance Optimization: ARIMA Refit Strategy
Fitting an ARIMA model via maximum likelihood optimization on every single backtest step across hundreds of clinic days causes severe dashboard latency. 

To preserve real-time responsiveness, the backend implements an **interval refitting strategy** (`ARIMA_REFIT_INTERVAL = 7`):
* Full numerical parameter re-estimation runs once every **7 to 21 clinic days**.
* On intermediate days, the model reuses fitted coefficients and updates internal Kalman filter states using `.append([history[-1]], refit=False)`.
* This bounds total fits to $\approx N / 7$, delivering a >90% execution speedup while maintaining identical predictive accuracy.

---

### 3.X.5 Statistical Data Treatment for User Acceptance Testing (UAT)

Data gathered from the fourteen ($N = 14$) healthcare staff respondents during User Acceptance Testing are statistically treated using weighted mean formulas and a 5-point Likert rating scale in accordance with the **ISO/IEC 25010:2023 Software Product Quality Model**.

#### 1. Weighted Mean Formula
The composite evaluation for each survey criterion is computed using the arithmetic weighted mean:
$$\bar{X} = \frac{\sum_{i=1}^k (w_i \cdot f_i)}{N}$$
Where:
* **$\bar{X}$** = Computed Weighted Mean score for the survey statement.
* **$w_i$** = Numerical weight assigned to the Likert scale response level ($w \in \{1, 2, 3, 4, 5\}$).
* **$f_i$** = Frequency (number of respondents who selected weight $w_i$).
* **$N$** = Total number of survey respondents ($N = 14$).

---

#### 2. Five-Point Likert Scale and Verbal Interpretation Table
The computed weighted mean scores are interpreted using standardized scale ranges and verbal descriptions:

### Table 3.2: Five-Point Likert Scale Interpretation Matrix ($N = 14$)

| Scale Weight ($w$) | Numerical Range | Verbal Interpretation (Usability / Agreement) | Quality Assessment (ISO/IEC 25010) |
| :---: | :---: | :--- | :--- |
| **5** | **4.50 – 5.00** | **Strongly Agree** | **Excellent / Highly Acceptable** |
| **4** | **3.50 – 4.49** | **Agree** | **Good / Acceptable** |
| **3** | **2.50 – 3.49** | **Neutral** | **Fair / Moderately Acceptable** |
| **2** | **1.50 – 2.49** | **Disagree** | **Poor / Unacceptable** |
| **1** | **1.00 – 1.49** | **Strongly Disagree** | **Very Poor / Highly Unacceptable** |

