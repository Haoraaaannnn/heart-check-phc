import os
import tempfile
import unittest

import pandas as pd

from analytics.preprocessing import preprocess_queue_data
from analytics.forecasting import evaluate_forecasting_algorithms
import db_seeder


class ForecastingPipelineTests(unittest.TestCase):
    def test_seeder_data_is_preprocessed_for_forecasting(self):
        with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as tmp:
            tmp_path = tmp.name

        try:
            df = db_seeder.generate_fake_patients(
                num_days=10,
                patients_per_day=40,
                start_date='2026-05-01',
                output_filename=tmp_path,
            )
            clean = preprocess_queue_data(df)

            self.assertIn('patient_id', clean.columns)
            self.assertIn('visit_date', clean.columns)

            result = evaluate_forecasting_algorithms(clean)
            self.assertIn(result['best_algorithm'], {'SMA', 'WMA', 'EMA', 'ARIMA', 'Linear Regression'})
            self.assertGreaterEqual(result['next_day_forecast'], 0)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


if __name__ == '__main__':
    unittest.main()
