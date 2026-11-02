# Requirements Analysis

### The People Involved
These individuals actively participated in the operational interviews, system walkthroughs, development, and User Acceptance Testing (UAT) of the Heart Check PHC system.

The evaluation was conducted with a total of **fourteen (14) hospital staff respondents** from the Philippine Heart Center who evaluated the system based on their respective operational roles. Real, large-scale patient surveying and live queue time satisfaction measurements with active outpatient cardiac patients were not conducted in the live clinic setting due to operational constraints, including hardware availability, staff training logistics, and the administrative prerequisites of integrating the prototype directly into the hospital's existing production Hospital Information System (HIS). Consequently, the patient-facing touchpoints (the self-service kiosk, queue ticket issuance, and public monitor visibility) were evaluated through a structured role-playing methodology, where healthcare staff simulated patient check-in interactions.

**Healthcare Staff (Registration Clerks and Triage Coordinators)** are the frontline administrative users who participated in the UAT evaluation. They assessed registration counters 1 to 5, the Patient Transfer Dashboard (`app/transfer/`), appointment verification workflows, chronological First-In, First-Out (FIFO) queue discipline, and consultation cubicle routing. In addition, they performed simulated patient walkthroughs on the self-service kiosk to evaluate check-in learnability and interface clarity based on their daily observations of incoming hospital visitors. This group comprised five (5) registration clerks and triage coordinators (35.7% of the respondent sample).

**Clinical Station Nurses and Healthcare Workers** are the point-of-care clinical users stationed within the consultation and screening cubicles. They participated in evaluating the Nurse Station interface (`app/nurse/`), testing cubicle station claiming, four-stage clinical Kanban progression (Assigned, With Doctor, Carryout, and Finished Today), Deepgram Aura text-to-speech voice callouts, consultation timers, and local outbox resilience during simulated network disconnects. This group comprised four (4) clinical station nurses (28.6% of the respondent sample).

**Hospital Administrators and Clinic Supervisors** are the supervisory evaluators responsible for outpatient department oversight. They assessed the Executive Analytics Dashboard (`app/dashboard/`), verifying live operational key performance indicators (KPIs), inspecting patient flow audit ledgers, reviewing cubicle utilization grids, evaluating the four-tier analytics pipeline (descriptive summaries, diagnostic bottleneck identification, predictive forecasting, and prescriptive queueing models), and validating automated PHC-compliant Microsoft Excel report exports. This group comprised three (3) clinic heads and administrative supervisors (21.4% of the respondent sample).

**System Administrators (PHC MIS Officers)** are the technical authorities responsible for institutional infrastructure and system governance. They evaluated the SuperAdmin workstation (`app/superadmin/`), focusing on user account provisioning, role-based access control (RBAC), outpatient service catalog configuration, queue prefix rules, facility resource mapping (rooms, cubicles, counters, and doctor rosters), hardware thermal receipt printer pairing, and system security controls. This group comprised two (2) MIS systems officers (14.3% of the respondent sample).

---

### The Business Activity
The Philippine Heart Center (PHC) focuses on providing specialized cardiovascular medical services, diagnostic examinations, and clinical consultations while maintaining high standards of patient care and efficient daily operations. The Outpatient Department (OPD) operates under a scheduled appointment structure with fixed patient booking caps, non-expandable physical examination cubicles, and fixed specialist clinic hours. The implementation of Heart Check PHC will support the Outpatient Department’s daily operations by digitizing patient check-in, providing synchronized real-time queue visibility, and embedding an advanced scientific analytics framework into clinic administration.

The system integrates self-service touchscreen check-in, digital triage routing, point-of-care clinical tracking, and public queue broadcasting. It allows real-time tracking of patient flow across registration, consultation, and carryout stages; automated calculation of Estimated Wait Times (EWT); dispatch of cellular SMS notifications; and automated compilation of official hospital reports. The self-service kiosk check-in and public queue monitor features enhance the patient experience by reducing hallway uncertainty, eliminating unorganized lines, and significantly improving overall outpatient service efficiency.

---

### The Environment in Which the Work Takes Place
The development, testing, and operational evaluation of the Heart Check PHC system took place within a simulated clinical environment modeled precisely after the Outpatient Department of the Philippine Heart Center. The physical setting encompasses the outpatient entrance vestibule, public waiting lounges, registration windows 1 to 5, adult and pediatric consultation cubicles, specialized diagnostic examination rooms (such as ECG and Warfarin clinics), and administrative records offices. The outpatient clinic operates from Monday through Friday, 06:00 to 18:00 Philippine Standard Time (PHT).

The system operates across a heterogeneous computing environment engineered to support patient self-service and clinical workstations:
1. **Entrance Kiosk Terminal:** An industrial touchscreen terminal situated at the OPD entrance, equipped with a responsive touch interface, integrated 58mm/80mm ESC/POS thermal receipt printer (interfaced via WebUSB or raw TCP network socket), and built-in audio hardware running a locked Chromium kiosk browser environment.
2. **Public Waiting Area Monitors:** Commercial Full HD (1080p) and 4K wall-mounted television monitors positioned across patient waiting lounges, running the system's public monitor interface (`app/monitor/`) in an institutional light mode with 100% zero-scroll viewport containment.
3. **Triage and Clinical Workstations:** Desktop personal computers and touch-enabled clinical tablets (such as iPads or Android tablets with medical stylus support) utilized by triage receptionists and cubicle nurses, featuring unified Pointer Events drag-and-drop and tap-to-select controls.
4. **Resilient Network Infrastructure:** The system operates within an on-premises Local Area Network (LAN) backed by an offline-resilient Write-Ahead Logging (WAL) persistent outbox via IndexedDB. This architecture guarantees that even during intermittent hospital WiFi interference or local network dropouts, queue mutations are saved to local persistent disk and synchronized without data loss or duplicate ticketing.

---

### The Timing
The proposed system was developed, tested, simulated, and prepared for operational evaluation within the planned project timeline *[INSERT: Project duration and dates, e.g., from August 2024 to November 2026]*.

Due to practical constraints—specifically the logistics of deploying dedicated kiosk hardware across the hospital, conducting extensive multi-shift clinician training, and integrating directly into PHC's production Hospital Information System—live patient satisfaction surveys and real-world queue time measurements on active cardiac patients were not conducted during this evaluation period. Instead, system performance and queue behavior were rigorously validated through a complementary three-phase testing methodology:
1. **Mathematical and Historical Validation:** Verifying queueing theory formulas (M/M/1 per cubicle, Erlang C benchmark) and time-series volume forecasting models (SMA, WMA, EMA, Linear Regression, ARIMA) against actual PHC historical outpatient records spanning March 2024 to December 2025 (~74 clinic days). Algorithms were evaluated using Mean Absolute Error (MAE) and Mean Absolute Scaled Error (MASE) against a Seasonal-Naive baseline.
2. **Discrete-Event Simulation (SimPy):** Evaluating queue throughput, bottleneck dynamics, and theoretical cycle-time reductions through a computerized SimPy simulation (`chapter4_simulation.ipynb`, `run_simulation_paper.py`) parameterized with empirical hospital arrival and service distributions.
3. **User Acceptance Testing (UAT):** Administering structured evaluation instruments based on the ISO/IEC 25010:2023 Software Product Quality Model to **14 hospital staff respondents**. Healthcare personnel evaluated their specific operational workstation modules and conducted simulated patient check-in walkthroughs on the kiosk, providing an expert assessment of functionality, usability, and operational suitability prior to formal institutional deployment.

---

### The Current Procedures Performed
The proponents have observed that the Outpatient Department of the Philippine Heart Center currently relies on semi-manual, paper-reliant, or basic spreadsheet methods in managing outpatient queues and recording daily patient consultations:

*[INSERT FIGURE 3.X: Flowchart of Existing / Traditional Outpatient Check-in and Consultation Procedures]*

1. **Manual Check-In and Verification:** Arriving patients physically line up at intake desks to present appointment slips and hospital identification cards. During early morning peak arrival hours (06:00 to 09:00 AM), this manual intake process results in long waiting queues, crowded entrance hallways, and administrative fatigue.
2. **Absence of Wait Time Estimation:** Patients are issued physical paper numbers or handwritten priority slips without an objective indication of their expected waiting time or the number of patients ahead of them in their assigned service lane. This lack of visibility increases patient anxiety and causes repeated inquiries at the triage desk.
3. **Manual Triage and Cubicle Routing:** Patient transfers from registration windows to consultation cubicles are coordinated through physical paper charts or verbal staff directions. Without an automated queue lock, operational risks such as accidental queue jumping, record misplacement, or uneven patient distribution across attending physicians can occur.
4. **Untracked Consultation Milestones:** Critical clinical milestones—such as doctor examination start time, consultation completion time, and post-consultation prescription and laboratory order release (carryout)—are recorded manually or left unrecorded, creating data gaps that hinder operational bottleneck analysis.
5. **Retrospective Reporting:** Operational throughput reports are compiled manually at the end of each month from physical logbooks and disjointed Excel files. Without predictive forecasting models, clinic administrators must make policy decisions regarding daily appointment caps and doctor allocations without data-driven projections.

To address these issues, the proponents developed **Heart Check PHC**, an integrated kiosk-based queue management and analytics system. The system provides self-service kiosk check-in, real-time waiting room television broadcasting, strict FIFO queue discipline, four-stage clinical consultation tracking, automated voice callouts, SMS notifications, and a four-tier analytics pipeline, resulting in improved operational efficiency, reduced hallway congestion, and a superior clinical service experience for both patients and healthcare personnel.

*[INSERT FIGURE 3.Y: Flowchart of Proposed Heart Check PHC Operational Patient Flow]*

---

### Respondents Interview
The developers utilized on-site workflow observations, stakeholder interviews, and structured User Acceptance Testing (UAT) questionnaires to assess existing operational problems and formulate the requirements of the proposed system.

The study engaged a total of **fourteen (14) hospital staff respondents** from the Philippine Heart Center, who participated in the evaluation by acting according to their specialized operational roles. Direct surveys with active cardiac outpatients to measure live queue times and patient satisfaction were deliberately not conducted due to three primary deployment constraints:
1. **Hardware Constraints:** The physical deployment of dedicated industrial touchscreen kiosks, wall-mounted display monitors, and network thermal printers was limited to prototype and testing stations rather than a full-scale physical installation across every OPD clinic room.
2. **Staff Training Constraints:** Conducting live patient operations across an active hospital requires extensive training of all clinical personnel, attending physicians, resident doctors, and multi-shift nursing staff, which was logistically unfeasible during the academic prototype development phase.
3. **System Integration Constraints:** Live operational queueing requires direct two-way integration with PHC's existing production Hospital Information System (HIS / EHR), requiring formal institutional data security clearances, API development, and MIS administrative approvals that serve as prerequisites for full hospital adoption.

To overcome these constraints while ensuring rigorous system validation, the developers employed a **role-based expert proxy evaluation methodology**. Because hospital staff interact with hundreds of cardiac patients daily, they possess deep insight into patient behaviors, literacy challenges, and queuing frustrations. Staff respondents evaluated both their professional workstation modules (Transfer, Nurse, Dashboard, and SuperAdmin) and conducted simulated patient walkthroughs on the self-service kiosk and public displays.

### Table 3.1: Distribution of UAT Staff Respondents (N = 14)

| Stakeholder Group | Operational Role / Designation | Sample Size ($n$) | Percentage (%) | System Modules Evaluated |
| :--- | :--- | :---: | :---: | :--- |
| **Registration & Triage** | Front-Desk Registration Clerks & Triage Floor Coordinators | 5 | 35.7% | Transfer Dashboard, Registration Counters, Kiosk Simulation |
| **Clinical Nursing** | Outpatient Consultation & Screening Cubicle Nurses | 4 | 28.6% | Nurse Station Kanban, Voice Callouts, Outbox WAL |
| **Clinic Administration** | Outpatient Clinic Supervisors & Department Administrators | 3 | 21.4% | Executive Dashboard, 4-Tier Analytics, Excel Export |
| **Hospital IT / MIS** | Systems Administrators & MIS Technical Officers | 2 | 14.3% | SuperAdmin Portal, RBAC Security, Hardware & LAN Setup |
| **Total** | **All Healthcare Staff Evaluators** | **14** | **100.0%** | **Complete System Evaluation** |

The 14 staff respondents were distributed across the following operational categories:
1. **Registration and Triage Personnel (5 respondents):** Evaluated front-desk counter claiming, appointment verification, FIFO transfer routing, and simulated patient check-in interactions on the kiosk.
2. **Clinical Station Nurses (4 respondents):** Evaluated consultation cubicle progression (Assigned, With Doctor, Carryout, Done), Deepgram Aura voice announcements, and offline data reliability.
3. **Hospital Administrators and Supervisors (3 respondents):** Evaluated executive KPI tracking, patient flow audit ledgers, four-tier analytics, and automated Excel compliance exports.
4. **PHC MIS Officers (2 respondents):** Evaluated platform security, role-based access control, service catalog configuration, and on-premises LAN deployment readiness.

*[INSERT: Summary of Key Interview Findings and Quotations from the 14 Hospital Staff Respondents]*

*[INSERT: Reference to Appendix containing the Complete 14-Respondent UAT Evaluation Questionnaire based on ISO/IEC 25010:2023]*

---

### Checklist of Items to Insert into Your Thesis Paper:
- `[INSERT: Project duration and dates, e.g., from August 2024 to November 2026]`
- `[INSERT: Date range of historical dataset, e.g., March 2024 to December 2025, covering 74 clinic days]`
- `[INSERT FIGURE 3.X: Flowchart of Existing / Traditional Outpatient Check-in and Consultation Procedures]`
- `[INSERT FIGURE 3.Y: Flowchart of Proposed Heart Check PHC Operational Patient Flow]`
- `[INSERT: Summary of Key Interview Findings and Quotations from the 14 Hospital Staff Respondents]`
- `[INSERT: Reference to Appendix containing the Complete 14-Respondent UAT Evaluation Questionnaire based on ISO/IEC 25010:2023]`
