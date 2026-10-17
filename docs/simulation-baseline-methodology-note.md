# Simulation Baseline Methodology Note: Mean of Monthly Averages vs. Grand Mean

**Last Updated:** 2026-10-17

---

## The Question

> "Is it more accurate if I average all the monthly averages of 2024 records, then use that as the baseline for the simulation?"

In other words: instead of computing a single grand mean across all records pooled together (what `extract_baseline_metrics()` currently does), compute the mean for each month of 2024 individually, then average those twelve monthly means to produce the baseline.

This technique is called the **mean of means** (or an unweighted average of subgroup means).

---

## Short Answer

**It depends on what you are trying to represent, and it introduces a subtle but important bias risk.**

Both approaches are academically defensible, but they answer slightly different questions and they are only equivalent when months have the same patient count. Since PHC is a real clinic with seasonal attendance variation, they will produce different values.

---

## Detailed Analysis

### Approach 1 — Grand Mean (Current Approach)

Pool all consultation records and compute:

```
global_mean = sum(all durations) / total_n
```

- **What it represents:** The literal average duration experienced across all recorded patient visits.
- **Weight:** Each patient visit contributes exactly one data point regardless of which month it came from.
- **Advantage:** Mathematically clean. Directly grounded in the raw observation set. No aggregation artifacts.
- **Disadvantage:** Months with high patient volume (e.g., January post-holiday surge, July back-to-school) dominate the average. If January has 300 records and June has 80, January's service pattern has nearly 4x the influence.

### Approach 2 — Mean of Monthly Averages (Proposed)

Compute per-month means for each calendar month, then average them:

```
monthly_means  = [mean(Jan), mean(Feb), ..., mean(Dec)]
baseline_mean  = sum(monthly_means) / 12
```

- **What it represents:** An equal-weighted composite of twelve operational "snapshots", treating each month as having equal representative weight.
- **Weight:** Each month contributes equally regardless of how many patients were seen that month.
- **Advantage:** Corrects for volume-driven month dominance. If PHC's service behavior is roughly consistent across months but volume varies, this gives a fairer cross-month composite. It is also more robust to seasonal outlier months.
- **Disadvantage:** Introduces aggregation noise from months with small sample sizes. If November has only 20 records (e.g., due to a data gap or holiday closure), its monthly average is noisy and is given the same weight as January's 300 records. This can skew the baseline.

---

## Recommendation

### For this simulation: Stay with the Grand Mean, but add a monthly breakdown table.

Here is the rationale:

1. **The simulation feeds individual patient rows, not monthly summaries.** `chapter4_simulation.py` processes each historical record one-by-one and adds scenario overhead per patient. The baseline metrics from `extract_baseline_metrics()` are used as a calibration anchor for the M/M/1 service rate (mu) and for the `DIGITAL_REG_REDUCTION_MIN` calculation. The grand mean is the correct input for M/M/1, which is a flow-level model, not a per-month model.

2. **The mean of means is only more accurate when sample sizes are equal across groups.** This is a standard statistical property. If PHC's monthly visit counts vary (which they do in real clinics), the mean of monthly averages is not more accurate — it is differently weighted. The grand mean is the maximum-likelihood estimator of the true mean service time across the full operational period.

3. **The mean of means would be appropriate if your goal is seasonal balance.** If Chapter 4 argues "PHC operates at a consistent pace across the calendar year" and you want to normalize away the summer surge or post-holiday spike, then the mean of monthly averages makes that argument well.

4. **Risk of the 2024-only scope.** Restricting the baseline to only 2024 records reduces your sample size for months where data is thin (e.g., March 2024 is the first imported month and may be incomplete). The smaller the monthly sample, the noisier the monthly mean, and the less defensible the mean-of-means becomes.

---

## Suggested Approach for Chapter 4

Use the grand mean as the simulation anchor (current design), but add a secondary descriptive table showing monthly means for transparency:

| Month | n | Mean Reg. Service (min) | Mean Consult. Service (min) |
|-------|---|-------------------------|------------------------------|
| Jan   | X | X.XX                    | X.XX                         |
| Feb   | X | X.XX                    | X.XX                         |
| ...   |   |                         |                              |
| Dec   | X | X.XX                    | X.XX                         |
| **Grand Mean** | | **X.XX** | **X.XX** |
| **Mean of Monthly Means** | | **X.XX** | **X.XX** |

This table lets your thesis panel see both values, understand the difference, and confirm they are close (which they should be if monthly volumes do not vary wildly). If they differ by more than roughly 10%, report both and explain the volume variation.

---

## When the Mean of Monthly Means IS the Right Choice

The mean of monthly means is the correct statistical approach when:

- You are computing a **performance metric for management reporting** (e.g., "average monthly service rate"), where you want each operational month to count equally.
- You are computing a **seasonal adjustment factor** to detect if December service is slower than April.
- The M/M/1 computation is stratified per month (one simulation run per month), and you are averaging the twelve Wq outputs. In that case, averaging those twelve values is appropriate.

---

## If You Decide to Use Mean of Monthly Means Anyway

If your panel or adviser specifically recommends equal weighting across months, extend `extract_baseline_metrics()` with this snippet:

```python
# Inside extract_baseline_metrics(), after computing global stats:

df["month"] = pd.to_datetime(df["kiosk_time"]).dt.to_period("M")
monthly_reg     = df.groupby("month")["service_registration"].mean()
monthly_consult = df.groupby("month")["service_consultation"].mean()

mean_of_monthly_reg     = round(float(monthly_reg.mean()), 2)
mean_of_monthly_consult = round(float(monthly_consult.mean()), 2)

print(f"  service_registration (mean of monthly means): {mean_of_monthly_reg} min")
print(f"  service_consultation (mean of monthly means): {mean_of_monthly_consult} min")
```

Report both in the thesis and let the data speak. If they agree closely, it strengthens the claim that PHC's service pace is stable year-round. If they diverge, it reveals seasonal variation worth discussing in the analysis.

---

## Summary Table

| Criterion | Grand Mean | Mean of Monthly Means |
|-----------|-----------|----------------------|
| Statistically unbiased estimator of true service mean | Yes (given i.i.d. assumption) | No (unless all months have equal n) |
| Correct input for M/M/1 flow-level model | Yes | No (M/M/1 uses rates, not period averages) |
| Robust to thin monthly samples | Yes | No (a month with few records distorts it) |
| Removes seasonal volume dominance | No | Yes |
| Best for management or seasonal reporting | No | Yes |
| Recommended for simulation baseline | **Yes** | Only if simulation is run per-month |

---

_This note does not mandate a code change. It is a design-decision reference for the Chapter 4 simulation methodology._
