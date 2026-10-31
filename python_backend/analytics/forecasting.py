"""
forecasting.py
Five time-series forecasting algorithms plus a seasonal-naive baseline
evaluated via walk-forward (rolling-origin) back-testing.
The winner (lowest MAE) produces the next-day patient volume forecast.

Algorithms:
  NAIVE — Seasonal-Naive (same weekday, one business week ago) (baseline)
  SMA   — Simple Moving Average                                (statistical)
  WMA   — Weighted Moving Average                              (statistical)
  EMA   — Exponential Moving Average                           (statistical)
  LR    — Linear Regression                                    (machine learning)
  ARIMA — AutoRegressive Integrated Moving Average             (time-series model)

Method notes:
  Walk-forward evaluation: each prediction uses only data observed before
  that date, preventing look-ahead bias.

  MASE (Mean Absolute Scaled Error) is reported alongside MAE.
  MASE = MAE_model / MAE_naive. Values < 1 mean the model beats the
  seasonal-naive baseline; values >= 1 mean it does not.

  ARIMA date-gap limitation:
  PHC operates Monday to Friday only (weekends and public holidays are
  non-clinic days). The daily volume series has irregular gaps that are
  NOT reindexed before ARIMA fitting. ARIMA(1,1,1) treats consecutive
  rows as equally spaced, so a Friday-to-Monday gap is identical to a
  Tuesday-to-Wednesday step in the model's view. This suppresses the
  weekly seasonality signal. On the 10-week historical sample currently
  available (~74 clinic days), this limitation has minimal practical
  impact because the short window cannot support seasonal ARIMA (SARIMA)
  with reliable parameter estimation. The limitation is documented as a
  stated assumption: ARIMA is used as a smoothed autoregressive estimator,
  not as a seasonal model.
"""

import warnings
import numpy as np
import pandas as pd
from sklearn.linear_model    import LinearRegression
from sklearn.metrics         import mean_absolute_error, mean_squared_error
from statsmodels.tsa.arima.model import ARIMA
from .constants import WINDOW_SIZE, EMA_ALPHA, ARIMA_REFIT_INTERVAL

# ARIMA order — (p, d, q)
# p=1 autoregressive, d=1 differencing, q=1 moving average
# Standard starting point for short weekly OPD data.
# A seasonal ARIMA order would require substantially more history
# than the current ~10-week sample provides.
ARIMA_ORDER = (1, 1, 1)


def _fit_arima(series: np.ndarray) -> float:
    """
    Fit ARIMA on a series and return one-step-ahead forecast.
    Returns 0.0 on failure so it never crashes the pipeline.
    Used for the final one-off forecasts (cheap — runs once, not in a loop).
    """
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model  = ARIMA(series, order=ARIMA_ORDER)
            result = model.fit()
            forecast = float(result.forecast(steps=1)[0])
            return max(0.0, forecast)
    except Exception:
        return float(np.mean(series))


def _backtest_arima(volumes: np.ndarray, window_size: int, refit_interval: int = ARIMA_REFIT_INTERVAL) -> list:
    """
    Efficient ARIMA backtest for the evaluation loop.

    The original version fit a brand-new ARIMA model on every single
    iteration (e.g. ~700 fits for 2 years of data — the source of the
    dashboard slowdown). This version re-estimates parameters only every
    `refit_interval` days; on the days in between, it reuses the existing
    fit and appends the newest observation via `.append(..., refit=False)`,
    which updates the model's state with new data WITHOUT re-running the
    expensive optimization.

    This keeps the worst case (e.g. "All Time" — 700+ days selected)
    bounded to roughly len(volumes)/refit_interval fits, instead of
    scaling 1:1 with history length.
    """
    preds = []
    result = None
    steps_since_refit = 0

    effective_refit = refit_interval
    if len(volumes) > 365:
        effective_refit = max(refit_interval, 21)
    elif len(volumes) > 180:
        effective_refit = max(refit_interval, 14)

    for i in range(window_size, len(volumes)):
        history = volumes[:i]
        need_refit = result is None or steps_since_refit >= effective_refit

        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                if need_refit:
                    result = ARIMA(history, order=ARIMA_ORDER).fit()
                    steps_since_refit = 0
                else:
                    result = result.append([history[-1]], refit=False)
                    steps_since_refit += 1

            forecast = float(result.forecast(steps=1)[0])
            preds.append(max(0.0, forecast))
        except Exception:
            # Fall back to mean for this step, and force a fresh fit
            # next iteration since `result`'s state may be inconsistent.
            preds.append(float(np.mean(history)))
            result = None
            steps_since_refit = 0

    return preds


def _seasonal_naive_baseline(volumes: np.ndarray, window_size: int) -> list:
    """
    Seasonal-naive baseline for walk-forward back-testing.

    For each step i in [window_size, len(volumes)-1], the prediction is
    the observation from one business week ago (i - 5 positions back in
    the series). This preserves within-week structure without any model
    complexity.

    If i - 5 < 0 (not enough history for the seasonal lag), the prediction
    falls back to the mean of the available history up to step i.

    @param volumes     Ordered daily patient count array.
    @param window_size Starting index for the evaluation loop.
    @returns           List of one-step-ahead predictions aligned with actuals[0:].
    """
    preds = []
    seasonal_lag = 5  # one PHC business week (Monday -> next Monday)
    for i in range(window_size, len(volumes)):
        lag_idx = i - seasonal_lag
        if lag_idx >= 0:
            preds.append(float(volumes[lag_idx]))
        else:
            preds.append(float(np.mean(volumes[:i])))
    return preds


def _compute_mase(actuals: list, model_preds: list, naive_preds: list) -> float:
    """
    Mean Absolute Scaled Error.

    MASE = MAE_model / MAE_naive.
    Values < 1 mean the model beats the seasonal-naive baseline.
    Values >= 1 mean the model does not improve over naive.
    Returns None when the naive MAE is zero (all predictions identical).

    @param actuals      True observation values.
    @param model_preds  Model predictions, same length as actuals.
    @param naive_preds  Seasonal-naive predictions, same length as actuals.
    @returns            MASE score rounded to 4 decimal places, or None.
    """
    naive_mae = mean_absolute_error(actuals, naive_preds)
    if naive_mae == 0:
        return None
    return round(mean_absolute_error(actuals, model_preds) / naive_mae, 4)


def evaluate_forecasting_algorithms(
    df          : pd.DataFrame,
    window_size : int   = WINDOW_SIZE,
    alpha       : float = EMA_ALPHA,
) -> dict:
    volumes = (
        df.groupby('visit_date')['patient_id']
        .count()
        .sort_index()
        .values
    )

    if len(volumes) < window_size + 2:
        avg_forecast = float(np.mean(volumes))
        return {
            "status": "Limited data — using average forecast.",
            "best_algorithm": "Average",
            "next_day_forecast": max(0, int(round(avg_forecast))),
            "algorithmic_conclusion": f"Only {len(volumes)} days available; using historical average forecast.",
            "evaluation_metrics": {}
        }

    actuals                      = []
    sma_p, wma_p, ema_p, lr_p    = [], [], [], []
    weights     = np.arange(1, window_size + 1, dtype=float)
    current_ema = float(np.mean(volumes[:window_size]))

    # SMA / WMA / EMA / LR are cheap — evaluate them per-iteration.
    for i in range(window_size, len(volumes)):
        w           = volumes[i - window_size:i]
        ema         = alpha * volumes[i - 1] + (1 - alpha) * current_ema
        current_ema = ema

        lr = max(0.0, float(
            LinearRegression()
            .fit(np.arange(window_size).reshape(-1, 1), w)
            .predict([[window_size]])[0]
        ))

        actuals.append(volumes[i])
        sma_p.append(float(np.mean(w)))
        wma_p.append(float(np.dot(w, weights) / weights.sum()))
        ema_p.append(ema)
        lr_p.append(lr)

    # ARIMA is expensive — evaluated separately with the refit-every-N-days
    # strategy. Same index range (window_size .. len(volumes)-1) so it lines
    # up with `actuals` one-to-one.
    arima_p = _backtest_arima(volumes, window_size)

    # Seasonal-naive baseline — used as the MASE denominator.
    # A model with MASE < 1 genuinely outperforms naive prediction.
    naive_p = _seasonal_naive_baseline(volumes, window_size)

    model_preds = {
        "SMA"              : sma_p,
        "WMA"              : wma_p,
        "EMA"              : ema_p,
        "Linear Regression": lr_p,
        "ARIMA"            : arima_p,
        "Seasonal Naive"   : naive_p,
    }

    naive_mae_val = mean_absolute_error(actuals, naive_p)

    results = {
        name: {
            "MAE" : round(mean_absolute_error(actuals, preds), 4),
            "RMSE": round(float(np.sqrt(mean_squared_error(actuals, preds))), 4),
            "MASE": _compute_mase(actuals, preds, naive_p),
        }
        for name, preds in model_preds.items()
    }

    # Model selection excludes the naive baseline itself (it is the
    # denominator, not a candidate winner).
    candidate_models = {k: v for k, v in results.items() if k != "Seasonal Naive"}
    best   = min(candidate_models, key=lambda k: candidate_models[k]["MAE"])
    latest = volumes[-window_size:]

    forecasts = {
        "SMA"              : float(np.mean(latest)),
        "WMA"              : float(np.dot(latest, weights) / weights.sum()),
        "EMA"              : alpha * volumes[-1] + (1 - alpha) * current_ema,
        "Linear Regression": max(0.0, float(
            LinearRegression()
            .fit(np.arange(window_size).reshape(-1, 1), latest)
            .predict([[window_size]])[0]
        )),
        "ARIMA"            : _fit_arima(volumes),  # one-off fit, cheap
    }

    next_day = forecasts[best]

    best_beats_naive = (
        results[best]["MASE"] is not None
        and results[best]["MASE"] < 1.0
    )
    conclusion_suffix = (
        f" MASE = {results[best]['MASE']} (beats seasonal-naive baseline)."
        if best_beats_naive
        else f" MASE = {results[best]['MASE']} (does not improve over seasonal-naive baseline — "
             "volume may be policy-capped rather than trend-driven)."
    )

    return {
        "status"                : "Forecast computed",
        "evaluation_metrics"    : results,
        "naive_mae"             : round(naive_mae_val, 4),
        "algorithmic_conclusion": (
            f"Based on historical walk-forward backtesting, {best} yielded the lowest MAE. "
            f"Next-day forecast: {int(round(next_day))} patients."
            + conclusion_suffix
        ),
        "best_algorithm"        : best,
        "next_day_forecast"     : max(0, int(round(next_day))),
    }


def get_lr_chart_data(df: pd.DataFrame, window_size: int = WINDOW_SIZE) -> dict:
    """Unchanged — LR chart data is independent of ARIMA and already cheap."""
    daily = (
        df.groupby('visit_date')['patient_id']
        .count()
        .sort_index()
        .reset_index()
    )

    if len(daily) < 2:
        today = pd.Timestamp.now(tz='UTC').date()
        dates = [
            (today - pd.Timedelta(days=i)).strftime('%Y-%m-%d')
            for i in range(4, -1, -1)
        ]
        return {
            "labels"        : dates,
            "actual"        : [0] * 5,
            "lr_line"       : [0] * 5,
            "forecast_date" : str(today + pd.Timedelta(days=1)),
            "forecast_value": 0,
            "slope"         : 0.0,
            "trend"         : "stable",
            "r2"            : 0.0,
        }

    dates   = [str(d) for d in daily['visit_date']]
    volumes = daily['patient_id'].values.astype(float)
    n       = len(volumes)
    X       = np.arange(n).reshape(-1, 1)

    lr      = LinearRegression().fit(X, volumes)
    lr_line = [round(max(0.0, float(v)), 1) for v in lr.predict(X)]
    slope   = round(float(lr.coef_[0]), 4)

    ss_res  = float(np.sum((volumes - lr.predict(X)) ** 2))
    ss_tot  = float(np.sum((volumes - volumes.mean()) ** 2))
    r2      = round(1 - ss_res / ss_tot, 4) if ss_tot > 0 else 0.0

    actual_window = min(window_size, n)
    latest   = volumes[-actual_window:]
    X_window = np.arange(actual_window).reshape(-1, 1)

    forecast = max(0.0, float(
        LinearRegression()
        .fit(X_window, latest)
        .predict([[actual_window]])[0]
    ))

    return {
        "labels"         : dates,
        "actual"         : [int(v) for v in volumes],
        "lr_line"        : lr_line,
        "forecast_date"  : str(
            (pd.to_datetime(daily['visit_date'].iloc[-1])
             + pd.Timedelta(days=1)).date()
        ),
        "forecast_value" : round(forecast),
        "slope"          : slope,
        "trend"          : "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable",
        "r2"             : r2,
    }


def get_arima_chart_data(df: pd.DataFrame, window_size: int = WINDOW_SIZE) -> dict:
    """
    Unchanged in structure — still a single ARIMA fit on the full range.
    Now that the backtest loop is fixed, this one extra fit is negligible
    (previously it was fit #701 out of 701; now it's fit #14 out of 14
    roughly, depending on refit interval and range length), so it's not
    worth the added complexity of threading the backtest's final fitted
    model through just to save one fit.
    """
    import warnings

    daily = (
        df.groupby('visit_date')['patient_id']
        .count()
        .sort_index()
        .reset_index()
    )

    if len(daily) < window_size + 2:
        today = pd.Timestamp.now(tz='UTC').date()
        dates = [
            (today - pd.Timedelta(days=i)).strftime('%Y-%m-%d')
            for i in range(4, -1, -1)
        ]
        return {
            "labels"        : dates,
            "actual"        : [0] * 5,
            "fitted"        : [0] * 5,
            "forecast_date" : str(today + pd.Timedelta(days=1)),
            "forecast_value": 0,
            "aic"           : None,
            "status"        : "Insufficient data",
        }

    dates   = [str(d) for d in daily['visit_date']]
    volumes = daily['patient_id'].values.astype(float)

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            from statsmodels.tsa.arima.model import ARIMA as _ARIMA

            model   = _ARIMA(volumes, order=ARIMA_ORDER)
            result  = model.fit()
            fitted  = [round(max(0.0, float(v)), 1) for v in result.fittedvalues]
            forecast_val = round(max(0.0, float(result.forecast(steps=1)[0])))
            aic     = round(float(result.aic), 2)
    except Exception as e:
        fitted       = [round(float(v), 1) for v in volumes]
        forecast_val = round(float(np.mean(volumes[-window_size:])))
        aic          = None
        print(f"Warning: ARIMA model failed to fit: {e}")

    last_date     = pd.to_datetime(daily['visit_date'].iloc[-1])
    forecast_date = str((last_date + pd.Timedelta(days=1)).date())

    return {
        "labels"        : dates,
        "actual"        : [int(v) for v in volumes],
        "fitted"        : fitted,
        "forecast_date" : forecast_date,
        "forecast_value": forecast_val,
        "aic"           : aic,
        "status"        : "ok",
    }