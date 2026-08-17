from analytics.staffing import recommend_staff


def test_recommend_staff_exposes_top_level_doctor_count_for_large_forecast():
    result = recommend_staff(
        forecasted_patients=302,
        opd_hours=8.0,
        avg_service_time_min=15.0,
        p_adult=0.50,
        p_pedia=0.50,
        p_consultation=0.65,
    )

    assert result["recommended_doctors"] >= 4
