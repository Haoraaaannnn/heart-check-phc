# Analytics Engine & Machine Learning Models

This document specifies the four-tier analytics framework, predictive forecasting algorithms, queueing theory equations, and automated model selection implemented in the **FastAPI analytical backend**.

---

## 1. Four-Tier Analytics Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Descriptive Analytics                                    │
│ - Historical hourly arrival curves                          │
│ - Department volume distributions                           │
│ - Average stage durations (Registration vs Consultation)    │
├─────────────────────────────────────────────────────────────┤
│ 2. Diagnostic Analytics                                     │
│ - Service duration variances and outlier detection          │
│ - Stage drop-offs and bottleneck identification             │
│ - Doctor-to-cubicle utilization disparities                 │
├─────────────────────────────────────────────────────────────┤
│ 3. Predictive Analytics                                     │
│ - 5 Forecasting models for patient arrival volume           │
│ - Automated MAE-based model selection                       │
│ - M/M/1 and M/M/c queueing theory calculations              │
├─────────────────────────────────────────────────────────────┤
│ 4. Prescriptive Analytics                                   │
│ - Dynamic staffing recommendations                          │
│ - Optimal cubicle count recommendations                     │
│ - Suggested appointment cap adjustments per department      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Predictive Forecasting Models (5 Algorithms)

The forecasting engine (`python_backend/routers/forecasting.py`) computes forecasts across five models:

1. **Simple Moving Average (SMA):**
   $$SMA_t = \frac{1}{k} \sum_{i=1}^{k} y_{t-i}$$
   Smooths short-term fluctuations to highlight baseline volume trends.
2. **Weighted Moving Average (WMA):**
   $$WMA_t = \frac{\sum_{i=1}^{k} w_i \cdot y_{t-i}}{\sum_{i=1}^{k} w_i}$$
   Applies linearly decreasing weights, prioritizing recent days.
3. **Exponential Moving Average (EMA):**
   $$EMA_t = \alpha \cdot y_{t-1} + (1 - \alpha) \cdot EMA_{t-1}$$
   Where smoothing factor $\alpha = \frac{2}{k + 1}$.
4. **Linear Regression Trend:**
   $$y = \beta_0 + \beta_1 \cdot t$$
   Captures directional growth or seasonal decline over multi-month horizons.
5. **Autoregressive Integrated Moving Average (ARIMA):**
   Fits an $ARIMA(p, d, q)$ model for time series with autocorrelation and weekly seasonality.

### Automated MAE-Based Model Selection
The engine evaluates each model against historical test windows using **Mean Absolute Error (MAE)**:
$$MAE = \frac{1}{n} \sum_{i=1}^{n} |y_i - \hat{y}_i|$$
The algorithm automatically selects and flags the model with the lowest MAE as the "Optimal Forecast" displayed on the executive dashboard.

---

## 3. Queueing Theory Formulations

### M/M/1 Single-Server Queue Model
Used for individual registration counters and dedicated cubicle lanes:
- **Arrival Rate ($\lambda$):** Average patients arriving per hour.
- **Service Rate ($\mu$):** Average patients served per hour.
- **Traffic Intensity ($\rho$):**
  $$\rho = \frac{\lambda}{\mu} \quad (\text{System is stable when } \rho < 1)$$
- **Expected Queue Length ($L_q$):**
  $$L_q = \frac{\rho^2}{1 - \rho} = \frac{\lambda^2}{\mu(\mu - \lambda)}$$
- **Expected Waiting Time in Queue ($W_q$):**
  $$W_q = \frac{L_q}{\lambda} = \frac{\lambda}{\mu(\mu - \lambda)}$$
- **Total Time in System ($W$):**
  $$W = W_q + \frac{1}{\mu} = \frac{1}{\mu - \lambda}$$

### Little's Law Validation
Validates empirical system measurements:
$$L = \lambda \cdot W$$
Where $L$ is average patients in the clinic, $\lambda$ is arrival throughput, and $W$ is average total time spent.

---

## 4. Bottleneck Detection & Staffing Engine

- **Severity Scoring:**
  - **Normal:** $\rho < 0.70$ (stable flow, minimal waiting).
  - **Moderate:** $0.70 \le \rho < 0.85$ (approaching capacity).
  - **High:** $0.85 \le \rho < 1.00$ (queue accumulating rapidly).
  - **Critical:** $\rho \ge 1.00$ (system unstable, indefinite queue growth).
- **Prescriptive Staffing Recommendation:**
  Determines minimum required cubicles $c^*$ to achieve target wait time $W_{target}$:
  $$c^* = \left\lceil \frac{\lambda}{\mu \cdot \rho_{target}} \right\rceil$$

---

## Cross-References

- [Data Import and Export Pipelines](./data-pipelines.md)
- [Simulation Execution Guide](../debugging/simulation-guide.md)
- [Backend Algorithms Reference (`python_backend/docs/`)](file:///home/jensen/Github-Repositories/Heart_Check_PHC/python_backend/docs/ANALYTICS_AND_ALGORITHMS_REFERENCE.md)
