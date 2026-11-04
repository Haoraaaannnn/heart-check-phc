# Chapter 4 — Results and Discussion

## Heart Check PHC: A Kiosk-Based Queue Management and Analytics System
**Philippine Heart Center — Outpatient Department (OPD)**  
**STI College Caloocan — Bachelor of Science in Computer Science**  
**Academic Year:** 2024–2026

---

## 4.1 Introduction

This chapter presents an analysis of the 2024 outpatient consultation records and an exploratory simulation comparing a manual queue process with a proposed digital kiosk process. The records describe elapsed time between recorded patient-flow events. The simulation estimates how results may change under stated assumptions about manual ticketing, kiosk check-in, announcements, and registration-related time reduction.

The simulation is not a post-implementation evaluation or patient user acceptance test (UAT). The 2024 records provide an operational baseline, but they do not show patient experience with the kiosk. Accordingly, simulated differences are reported as conditional estimates and not as measured real-world improvements.

## 4.2 Data Source and Preparation

The analysis used the twelve monthly 2024 workbooks supplied for this study. Only event dates and timestamps needed to calculate durations were used; patient identifier fields were excluded from the analysis. Records whose available event timestamps were not in chronological order were excluded.

After this check, 26,908 records were retained for the scenario calculations. Six records with non-chronological event order were excluded. One retained record had no Carry Out Completed timestamp, so that record's observed journey ended at Doctor Completed. For descriptive interval statistics, zero-minute durations were excluded; consequently, the number of observations varies by interval.

The recorded events were interpreted as follows: Queuing, Initial Assessment, Doctor Seen, Doctor Completed, and Carry Out Completed. The workbooks do not separately record registration queue-entry time, registration service start, and registration service completion. Therefore, the interval from Queuing to Initial Assessment is reported using those event labels and is not treated as a direct measure of registration staff service time.

## 4.3 Observed 2024 Service Intervals

Table 4.1 presents the mean elapsed time between recorded events. Means are descriptive summaries of the supplied workbooks. Seven observed journeys exceeded twelve hours, and the longest recorded journey was 1,519 minutes; these long durations were retained and should be checked against the source records before final submission.

**Table 4.1. Observed Duration of 2024 Patient-Flow Intervals**

| Recorded interval | Records with positive duration (n) | Mean duration (minutes) | Median (minutes) | 95th percentile (minutes) |
|---|---:|---:|---:|---:|
| Queuing to Initial Assessment | 26,757 | 31.80 | 23 | 83 |
| Initial Assessment to Doctor Seen | 26,756 | 93.55 | 81 | 206 |
| Doctor Seen to Doctor Completed | 26,755 | 11.63 | 10 | 16 |
| Doctor Completed to Carry Out Completed | 26,756 | 7.59 | 7 | 12 |
| Queuing to final recorded event | 26,757 | 144.56 | 133 | 268 |

The longest average interval was from Initial Assessment to Doctor Seen, at 93.55 minutes. This interval represents elapsed time between the two recorded events and should not be interpreted as a measured registration-counter queue wait. The average Queuing-to-final-event journey was 144.56 minutes among records with a positive duration for that measure.

## 4.4 Simulation Method and Assumptions

The scenario analysis used the observed 2024 journey intervals as its baseline and added modeled process overheads. For the manual scenario, ticket issuance was modeled using a normal distribution with a mean of 3.5 minutes and standard deviation of 0.8 minutes, with a 0.5-minute minimum. Manual announcement time was modeled with a mean of 1.5 minutes and standard deviation of 0.3 minutes, with a zero-minute minimum. For the digital scenario, kiosk check-in was modeled with a mean of 0.67 minutes and standard deviation of 0.15 minutes, with a 0.1-minute minimum; announcement overhead was set to zero as a model assumption.

The analysis also tested assumed reductions of 0, 1, 2, and 3 minutes in the Queuing-to-Initial-Assessment interval for the digital scenario, with a one-minute minimum for the adjusted interval. These reductions were not measured in the workbooks. The records do not establish how much time the kiosk would save during registration, nor do they separate waiting time from staff service time. The reduction values are therefore scenario assumptions, not observed effects.

## 4.5 Simulated Manual and Digital Scenarios

Table 4.2 summarizes the scenario results. In the two-minute reduction case, the modeled mean journey time was 148.76 minutes for the manual scenario and 142.45 minutes for the digital scenario, a modeled difference of 6.30 minutes. The estimated proportions at or below the 150-minute and 180-minute thresholds are calculated from simulated journey times; they are not observed post-implementation compliance rates.

**Table 4.2. Scenario Results Under Different Assumed Digital Reductions**

| Assumed reduction in Queuing-to-Initial-Assessment interval (minutes) | Manual mean journey (minutes) | Digital mean journey (minutes) | Modeled difference (minutes) | Manual at or below 150 min | Digital at or below 150 min | Manual at or below 180 min | Digital at or below 180 min |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 0 | 148.76 | 144.42 | 4.33 | 58.32% | 61.09% | 74.08% | 76.01% |
| 1 | 148.76 | 143.43 | 5.32 | 58.32% | 61.73% | 74.08% | 76.35% |
| 2 | 148.76 | 142.45 | 6.30 | 58.32% | 62.30% | 74.08% | 76.81% |
| 3 | 148.76 | 141.49 | 7.26 | 58.32% | 62.90% | 74.08% | 77.19% |

Under the assumptions tested, the digital scenario had a lower modeled mean journey time than the manual scenario. The modeled difference increased as the assumed reduction increased. This pattern is expected because the assumed reduction is an input to the scenario. It does not demonstrate that the digital system will produce the same reduction in actual clinic operations.

## 4.6 Interpretation and Limitations

The results support a conditional comparison of scenarios based on the 2024 records and the assumptions stated above. They do not establish a causal effect of the Heart Check PHC system. In particular, the source timestamps do not provide separate measurements of queue arrival, service start, and service completion at the registration counter. A registration-counter M/M/1 waiting-time estimate based on these combined event intervals would therefore require inputs not established by the supplied records and is not reported here as a validated result.

Statistical tests applied to paired simulated scenarios would assess differences generated by the model assumptions; they would not establish a real-world patient benefit. For this reason, the scenario differences are presented descriptively, without claiming statistical significance, a measured time saving, or improved patient outcomes. The 2024 workbooks also differ from the counts documented in an earlier project draft. The final dataset version, record exclusions, and reported totals should be confirmed with the research adviser before submission.

## 4.7 User Acceptance Testing

Patient UAT results were not available for this analysis. The simulation cannot determine whether patients find the kiosk easy to use, accessible, understandable, or acceptable. No UAT weighted mean or acceptance rating is reported. If the research group later conducts a survey, its respondent counts, questionnaire scale, item results, and interpretation ranges should be reported from the actual collected responses and the approved methodology. Until then, patient usability and acceptance remain unvalidated.

## 4.8 Summary

The 2024 workbooks showed a mean of 144.56 minutes from Queuing to the final recorded event. In the scenario using an assumed two-minute reduction in the Queuing-to-Initial-Assessment interval, the modeled mean journey was 148.76 minutes for the manual process and 142.45 minutes for the digital process. This 6.30-minute difference is a conditional simulation result, not a measured improvement. The timestamps do not independently validate a registration service-rate model, and patient UAT was not conducted. Future evaluation should measure the relevant registration events separately and gather feedback from intended users before conclusions are made about actual efficiency or patient acceptance.

---

**Source and analysis note:** This manuscript section is based on the redacted 2024 Excel workbooks supplied for the simulation analysis. Confirm the inclusion rules and reconcile workbook counts with the research adviser before treating these figures as final thesis results.
