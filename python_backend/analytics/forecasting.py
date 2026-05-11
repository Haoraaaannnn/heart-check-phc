"""
forecasting.py
Five time-series forecasting algorithms evaluated via backtesting.
Winner (lowest MAE) produces the next-day patient volume forecast.

Algorithms:
  SMA   — Simple Moving Average          (statistical)
  WMA   — Weighted Moving Average        (statistical)
  EMA   — Exponential Moving Average     (statistical)
  LR    — Linear Regression              (machine learning)
  ARIMA — AutoRegressive Integrated      (machine learning /
           Moving Average                 time-series model)
"""

import warnings
import numpy as np
import pandas as pd
from sklearn.linear_model    import LinearRegression
from sklearn.metrics         import mean_absolute_error, mean_squared_error
from statsmodels.tsa.arima.model import ARIMA
from .constants import WINDOW_SIZE, EMA_ALPHA

# ARIMA order — (p, d, q)
# p=1 autoregressive, d=1 differencing, q=1 moving average
# This is the standard starting point for weekly OPD data.
# Can be tuned once real data is available.
ARIMA_ORDER = (1, 1, 1)


def _fit_arima(series: np.ndarray) -> float:
    """
    Fit ARIMA on a series and return one-step-ahead forecast.
    Returns 0.0 on failure so it never crashes the pipeline.
    """
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model  = ARIMA(series, order=ARIMA_ORDER)
            result = model.fit()
            # forecast() returns a Series — take the first value
            forecast = float(result.forecast(steps=1).iloc[0])
            return max(0.0, forecast)
    except Exception:
        # ARIMA can fail on short or flat series — fall back to mean
        return float(np.mean(series))


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

    # Adaptively use available data if insufficient for full evaluation
    if len(volumes) < window_size + 2:
        # With limited data, use simple average forecast
        avg_forecast = float(np.mean(volumes))
        return {
            "status": "Limited data — using average forecast.",
            "best_algorithm": "Average",
            "next_day_forecast": max(0, int(round(avg_forecast))),
            "algorithmic_conclusion": f"Only {len(volumes)} days available; using historical average forecast.",
            "evaluation_metrics": {}
        }

    actuals                               = []
    sma_p, wma_p, ema_p, lr_p, arima_p   = [], [], [], [], []

    weights     = np.arange(1, window_size + 1, dtype=float)
    current_ema = float(np.mean(volumes[:window_size]))

    for i in range(window_size, len(volumes)):
        w           = volumes[i - window_size:i]
        ema         = alpha * volumes[i - 1] + (1 - alpha) * current_ema
        current_ema = ema

        lr = max(0.0, float(
            LinearRegression()
            .fit(np.arange(window_size).reshape(-1, 1), w)
            .predict([[window_size]])[0]
        ))

        # ARIMA fits on the full history up to this point
        # so it can detect longer patterns beyond the window
        arima = _fit_arima(volumes[:i])

        actuals.append(volumes[i])
        sma_p.append(float(np.mean(w)))
        wma_p.append(float(np.dot(w, weights) / weights.sum()))
        ema_p.append(ema)
        lr_p.append(lr)
        arima_p.append(arima)

    results = {
        name: {
            "MAE" : round(mean_absolute_error(actuals, preds), 4),
            "RMSE": round(float(np.sqrt(mean_squared_error(actuals, preds))), 4),
        }
        for name, preds in {
            "SMA"              : sma_p,
            "WMA"              : wma_p,
            "EMA"              : ema_p,
            "Linear Regression": lr_p,
            "ARIMA"            : arima_p,
        }.items()
    }

    best   = min(results, key=lambda k: results[k]["MAE"])
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
        "ARIMA"            : _fit_arima(volumes),
    }

    next_day = forecasts[best]
    return {
        "status"                : "Forecast computed",
        "evaluation_metrics"    : results,
        "algorithmic_conclusion": (
            f"Based on historical backtesting, {best} yielded the lowest MAE. "
            f"Next-day forecast: {int(round(next_day))} patients."
        ),
        "best_algorithm"        : best,
        "next_day_forecast"     : max(0, int(round(next_day))),
    }


def get_lr_chart_data(df: pd.DataFrame, window_size: int = WINDOW_SIZE) -> dict:
    """
    Returns chart-ready data for the Linear Regression
    forecast visualization on the admin dashboard.
    Unchanged — LR chart data is independent of ARIMA.
    """
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

    # Adjust window size to not exceed available data
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
    Returns chart-ready data for the ARIMA forecast visualization.
    Shows actual counts, ARIMA fitted values, and next-day forecast.
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
            forecast_val = round(max(0.0, float(result.forecast(steps=1).iloc[0])))
            aic     = round(float(result.aic), 2)
    except Exception:
        fitted       = [round(float(v), 1) for v in volumes]
        forecast_val = round(float(np.mean(volumes[-window_size:])))
        aic          = None

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