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

The predictive analytics tier forecasts next-day outpatient arrival volumes to assist administrators in scheduling attending physicians and setting appointment booking caps. The platform evaluates five distinct forecasting algorithms alongside a baseline model using walk-forward (rolling-origin) back-testing over historical data.

#### 1. Baseline Model: Seasonal-Naive
The Seasonal-Naive model serves as the baseline benchmark ($s = 5\text{ business days}$, representing one hospital operating week):
$$\hat{y}_t = y_{t-s} = y_{t-5}$$
Where the forecast for a given weekday equals the actual patient volume observed on the same day of the preceding operating week (e.g., Monday predicts the next Monday).

---

#### 2. Algorithm 1: Simple Moving Average (SMA)
Computes the unweighted arithmetic mean of patient arrivals over the preceding sliding window of $k = 5$ clinic operating days:
$$\hat{y}_t = \frac{1}{k}\sum_{i=1}^k y_{t-i} = \frac{y_{t-1} + y_{t-2} + y_{t-3} + y_{t-4} + y_{t-5}}{5}$$

---

#### 3. Algorithm 2: Weighted Moving Average (WMA)
Assigns linearly increasing weights to more recent observation days, emphasizing recent clinic demand trends over a window of $k = 5$ operating days:
$$\hat{y}_t = \frac{\sum_{i=1}^k w_i \cdot y_{t-k+i}}{\sum_{i=1}^k w_i}$$
With standardized linear weights $w = [1, 2, 3, 4, 5]$ ($\sum_{i=1}^5 w_i = 15$):
$$\hat{y}_t = \frac{1\cdot y_{t-5} + 2\cdot y_{t-4} + 3\cdot y_{t-3} + 4\cdot y_{t-2} + 5\cdot y_{t-1}}{15}$$

---

#### 4. Algorithm 3: Exponential Moving Average (EMA)
Applies exponentially decreasing weights to older patient volume observations using a smoothing factor $\alpha = 0.3$:
$$\hat{y}_t = \alpha \cdot y_{t-1} + (1 - \alpha) \cdot \hat{y}_{t-1}$$
Where:
* $\alpha = 0.3$ allocates $30\%$ weighting to the most recent day's actual volume and $70\%$ weighting to historical smoothed projections.

---

#### 5. Algorithm 4: Ordinary Least Squares Linear Regression (LR)
Models patient arrival volume as a linear function of sequential operating clinic time ($t$):
$$\hat{y}_t = \beta_0 + \beta_1 t$$
Where coefficients are derived by minimizing the sum of squared residuals:
$$\beta_1 = \frac{\sum_{i=1}^k (t_i - \bar{t})(y_i - \bar{y})}{\sum_{i=1}^k (t_i - \bar{t})^2}$$
$$\beta_0 = \bar{y} - \beta_1 \bar{t}$$

---

#### 6. Algorithm 5: AutoRegressive Integrated Moving Average ($\text{ARIMA}(1,1,1)$)
A stationary, differenced time-series model capturing autoregressive momentum and moving average error corrections:
$$\Delta y_t = c + \phi_1 \Delta y_{t-1} + \theta_1 \epsilon_{t-1} + \epsilon_t$$
Where:
* **$\Delta y_t = y_t - y_{t-1}$** = First-order differencing ($d = 1$) to eliminate non-stationarity across daily volume totals.
* **$p = 1$** = First-order autoregressive parameter ($\phi_1$).
* **$q = 1$** = First-order moving average parameter ($\theta_1$).
* **$\epsilon_t$** = White noise error term with zero mean and constant variance ($\epsilon_t \sim \mathcal{N}(0, \sigma^2)$).

---

### 3.X.4 Forecast Accuracy Metrics and Model Selection Rule

To prevent look-ahead bias, model performance is evaluated using **walk-forward (rolling-origin) back-testing**, wherein every prediction utilizes only data observed prior to that date.

#### 1. Mean Absolute Error (MAE)
Measures the average magnitude of prediction errors in actual patient units:
$$\text{MAE} = \frac{1}{N}\sum_{t=1}^N |y_t - \hat{y}_t|$$
Where $y_t$ is the actual recorded patient volume on day $t$, $\hat{y}_t$ is the model's forecasted volume, and $N$ is the number of evaluated clinic days.

#### 2. Mean Absolute Scaled Error (MASE)
Normalizes model error against the Seasonal-Naive baseline to provide scale-independent comparative evaluation:
$$\text{MASE} = \frac{\text{MAE}_{\text{model}}}{\text{MAE}_{\text{baseline}}} = \frac{\frac{1}{N}\sum_{t=1}^N |y_t - \hat{y}_t|}{\frac{1}{N}\sum_{t=1}^N |y_t - y_{t-s}|}$$
* **$\text{MASE} < 1.0$:** The forecasting algorithm outperforms the seasonal-naive baseline.
* **$\text{MASE} \ge 1.0$:** The forecasting algorithm fails to beat the seasonal-naive baseline.

#### 3. Automated Model Selection Rule
The backend analytics pipeline calculates the MAE for all five algorithms and automatically selects the winning model to generate the next operating day's official forecast:
$$\text{Model}_{\text{selected}} = \arg\min_{m \in \{\text{SMA}, \text{WMA}, \text{EMA}, \text{LR}, \text{ARIMA}\}} (\text{MAE}_m)$$

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

