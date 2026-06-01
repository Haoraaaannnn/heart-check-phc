# this file acts like package for analytics module, allowing us to import functions from other files in this directory

from .report import generate_report
from .forecasting import evaluate_forecasting_algorithms, get_lr_chart_data, get_arima_chart_data
from .queue_metrics import registration_metrics, per_cubicle_metrics, specialized_metrics
from .staffing import recommend_staff