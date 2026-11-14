# Appendix: System Operations and User Manual

## Heart Check PHC: A Kiosk-Based Queue Management and Analytics System
**Target Facility:** Philippine Heart Center (PHC) — Outpatient Department (OPD)  
**Academic Institution:** STI College Caloocan — Department of Computer Studies  
**Document Type:** Capstone Thesis Appendix — Operational User Manual  
**Document Version:** 2.2.0  
**Effective Academic Year:** 2026–2027  

---

## Manual Overview

This manual provides instructions for operating the **Heart Check PHC** queue management and analytics system. The system coordinates outpatient flow across the Philippine Heart Center Outpatient Department, linking the entrance kiosks, public waiting area monitors, triage desks, clinical consultation rooms, and administrative offices.

### Table of Contents

1. [Part 1: Patient Self-Service Kiosk](#part-1-patient-self-service-kiosk)
2. [Part 2: Public Waiting Room Television Monitor](#part-2-public-waiting-room-television-monitor)
3. [Part 3: Staff Login and Workstation Setup](#part-3-staff-login-and-workstation-setup)
4. [Part 4: Triage and Registration Transfer Desk](#part-4-triage-and-registration-transfer-desk)
5. [Part 5: Clinical Nurse and Doctor Consultation Station](#part-5-clinical-nurse-and-doctor-consultation-station)
6. [Part 6: Administrative and Analytics Dashboard](#part-6-administrative-and-analytics-dashboard)
7. [Part 7: SuperAdmin Management Portal](#part-7-superadmin-management-portal)
8. [Part 8: Troubleshooting and Frequently Asked Questions](#part-8-troubleshooting-and-frequently-asked-questions)

---

## Part 1: Patient Self-Service Kiosk

**Interface:** Physical Touchscreen Kiosk at OPD Entrance  
**Users:** Arriving Cardiac Outpatients and Clinic Greeters  

---

### 1.1 Starting Check-In (Welcome Screen)

[Image: Screenshot of the Kiosk Welcome and Idle Slideshow Screen with the 'Pindutin ang Screen Upang Magsimula / Tap Screen to Start' prompt]

When the kiosk is idle, it displays institutional health advisories and announcements.

1. Approach the kiosk terminal located at the entrance of the Outpatient Department.
2. Tap anywhere on the screen to begin.
3. The kiosk sounds a brief confirmation tone and opens the Patient Classification screen.

---

### 1.2 Patient Classification (New vs. Returning Patient)

[Image: Screenshot of the Patient Classification Screen showing 'Bagong Pasyente' and 'Dating Pasyente' cards]

Patients must declare whether they are visiting for the first time or returning with an existing hospital record.

1. Select your patient category:
   - Tap **Bagong Pasyente (New Patient)** if this is your first visit or you do not have an official PHC hospital record. Your printed ticket will direct you to Registration Counters 1–5 first.
   - Tap **Dating Pasyente (Old / Returning Patient)** if you already have a PHC hospital card or appointment slip. Your ticket will direct you directly to the waiting area or clinical cubicles.
2. To cancel and return to the idle screen, tap **Bumalik (Back)** at the upper-left corner.
3. Once tapped, the system opens the Services Menu.

---

### 1.3 Clinical Services Selection

[Image: Screenshot of the Clinical Services Menu grid showing cards for General Consultation, OPD Screening, ECG, Warfarin Clinic, and Medical Certificate]

This screen displays all outpatient services available for check-in.

1. Locate the service listed on your referral slip or appointment document (e.g., General Consultation, OPD Screening, ECG, Warfarin Clinic).
2. If your service is not visible, swipe upward on the screen to scroll through the full list.
3. Tap the card for your desired service.
4. The system routes you to the next step based on your selection:
   - If you selected **General Consultation**, the Age Selection screen opens.
   - For services without age triage (such as ECG or Medical Certificate), the system proceeds directly to Doctor Selection or Mobile Number entry.

---

### 1.4 Demographic Age Category (Adult vs. Pediatric)

[Image: Screenshot of the Demographic Age Triage Screen with 'Adult' and 'Pediatric' options]

General Consultation is divided into adult and children's cardiology to route patients to the correct physician pool.

1. Tap **Adult** if the patient is 19 years of age or older.
2. Tap **Pediatric** if the patient is 18 years of age or younger.
3. The system records your age category and advances to Doctor Selection.

---

### 1.5 Attending Physician and Cubicle Selection

[Image: Screenshot of the Attending Physician and Cubicle Selection grid displaying active room numbers, cubicle numbers, and doctor names]

Patients with scheduled follow-up visits can select their specific attending doctor.

1. Review the list of active cubicles and physician names.
2. Select your doctor:
   - If you have an assigned physician, tap their designated cubicle card (e.g., *Room 101 — Cubicle 2 — Dr. Maria Santos*).
   - If you are a walk-in patient or have no doctor preference, tap **Walang Piling Doktor (Any Available Doctor)**.
3. The system confirms your station preference and opens the Mobile Number screen.

---

### 1.6 Mobile Number Entry (SMS Queue Alerts)

[Image: Screenshot of the Mobile Phone Input Screen with numeric touch keypad, formatted phone display, and Data Privacy notice]

Patients can provide an 11-digit mobile number to receive automated SMS alerts as their turn approaches.

1. Using the on-screen keypad, enter your 11-digit mobile number starting with `09` (e.g., `09171234567`).
2. If you make a mistake, tap **Bumura (Backspace)** to correct it.
3. Once 11 valid digits are entered, tap **Magpatuloy (Continue)**.
4. If you do not have a mobile phone or do not want SMS alerts, tap **Laktawan (Skip)**.

*Note: In compliance with the Data Privacy Act of 2012 (RA 10173), contact numbers are encrypted and used solely for queue notifications.*

---

### 1.7 Transaction Summary and Confirmation

[Image: Screenshot of the Transaction Review Screen showing category, service, age group, doctor, and masked contact number]

This screen provides a summary of all selected options before your ticket is printed.

1. Review the summary details:
   - Patient Category (*Bagong Pasyente* or *Dating Pasyente*)
   - Clinical Service Name
   - Age Group (*Adult* or *Pediatric*)
   - Assigned Station / Attending Doctor
   - Mobile Number (displayed in masked format: `0917 •••• 567`)
2. If any information needs correction, tap **I-edit (Edit)** to step backward.
3. If all details are correct, tap **Kumpirmahin (Confirm)**.
4. A brief confirmation dialog locks the screen while the system issues your ticket.

---

### 1.8 Queue Ticket Retrieval

[Image: Screenshot of the Ticket Success Screen and a sample printed 80mm thermal receipt ticket]

The thermal receipt printer dispenses your official queue credential.

1. Wait for the paper ticket to print from the dispenser mouth located below the screen.
2. Tear off your receipt and verify the printed information:
   - **Ticket Number:** Large bold code (e.g., **C001**).
   - **Service & Category:** The clinical department you selected.
   - **Destination:** Initial station where you must report (**Registration Counter 1–5** for new patients, or **Waiting Area / Cubicle** for returning patients).
   - **Estimated Wait Time:** Approximate waiting duration in minutes.
3. Proceed to your indicated waiting area. The kiosk resets automatically after 5 seconds.

[Image: Screenshot of the On-Screen Ticket Fallback Display showing the large ticket code and camera photo instruction]

*Note on Printer Maintenance: If the printer is out of paper or offline, the kiosk automatically displays the On-Screen Ticket Fallback screen shown above. Take a photo of the screen with your smartphone camera and proceed to the waiting area.*

---

### 1.9 Inactivity Warning and Automatic Reset

[Image: Screenshot of the Inactivity Timeout Modal showing the circular 15-second countdown ring and the 'Magpatuloy / Continue' button]

If a user stops interacting with the kiosk for 45 seconds, the terminal displays an inactivity reminder to protect patient data.

1. When 45 seconds pass without touch input, the kiosk sounds a two-tone warning chime and displays a 15-second countdown ring.
2. To continue your session, tap **Magpatuloy (Continue)** before the timer reaches zero.
3. If no input is detected within 15 seconds, the kiosk clears all entered data and returns to the idle slideshow.

---

## Part 2: Public Waiting Room Television Monitor

**Interface:** Wall-Mounted 55"–65" Displays in Waiting Areas  
**Users:** Waiting Patients, Companions, and Clinic Staff  

---

### 2.1 Display Monitor Launch and Department Setup

[Image: Screenshot of the Public Monitor Gateway screen showing options to select Registration Counters, Consultation, Screening, or ECG]

Clinic staff configure each television monitor to display the correct department queue upon system startup.

1. Turn on the waiting room television and open the browser to `https://<hospital-host>/monitor`.
2. Click the card matching the clinic area where the monitor is installed:
   - **Registration Counters** (Front intake lobby)
   - **General Consultation — Adult** (Adult cardiology waiting area)
   - **General Consultation — Pediatric** (Pediatric waiting area)
   - **OPD Screening** (Screening hallway)
   - **ECG / Diagnostic Stations** (Diagnostic testing waiting area)
3. The monitor loads the live queue board for that department.

---

### 2.2 Audio Chime Activation (Start Screen)

[Image: Screenshot of the TV Start Screen showing the prompt: 'Click Anywhere to Initialize Audio Chimes']

Web browsers block automatic sound until an initial user interaction occurs.

1. When the monitor page loads, a prompt appears: **"Click Anywhere to Initialize Audio Chimes"**.
2. Using the TV remote control (air-mouse mode) or a wireless mouse, click once anywhere on the screen.
3. The prompt closes. Audio announcements and attention chimes are now enabled for all subsequent patient calls.

---

### 2.3 Reading the Consultation Cubicle Display

[Image: Screenshot of the Public Monitor Paired Cubicle Layout showing cubicles side-by-side with doctor names, large queue numbers, and live timers]

This screen displays multiple doctor cubicles operating within a consultation room.

1. **Locate Your Cubicle:** Look for the room and cubicle header (e.g., *Room 101 — Cubicle 3*).
2. **Identify Your Doctor:** The attending physician's name is displayed beneath the cubicle title.
3. **Check the Current Ticket:** The large number in the center (e.g., **C001**) is the patient currently being examined.
4. **Consultation Timer:** A clock below the number indicates how many minutes the current consultation has been in progress.

---

### 2.4 Reading the Registration Counter Display

[Image: Screenshot of the Registration Counter 2x2 Matrix Screen showing Counters 1 to 4 with hero ticket numbers and upcoming queue rosters]

This display is mounted above the front registration windows.

1. **Now Serving (Left):** The large number displayed on the left of each counter card is the ticket currently being served at that window.
2. **Upcoming Queue (Right):** The list on the right shows the next four tickets in line:
   - The ticket highlighted with an amber **NEXT** badge is the very next patient who should proceed near the counter.
   - The tickets below are second, third, and fourth in sequence.

---

### 2.5 Active Patient Calling Alert

[Image: Screenshot of an Active Calling Station Card with solid crimson surface, pulsing amber 'CALLING NOW' badge, and radiating beacon rings]

When clinical staff summon a ticket, the monitor alerts patients through synchronized visual and acoustic signals:

1. **Acoustic Chime:** A two-tone chime sounds through the waiting room speakers.
2. **Voice Callout:** An automated voice announces the ticket: *"Patient C001, please proceed to Cubicle 4."*
3. **Screen Highlight:** The station card flashes red, displays a pulsing **CALLING NOW** badge, and animates a beacon ring around the ticket number.
4. **Patient Action:** When you hear and see your number, walk directly to the indicated room or counter.

---

## Part 3: Staff Login and Workstation Setup

**Interface:** Staff Authentication and Workstation Selector  
**Users:** Registration Clerks, Nurses, Doctors, Supervisors, IT Staff  

---

### 3.1 Logging In to a Staff Workstation

[Image: Screenshot of the Staff Login Portal showing the username field, password field with show password toggle, and the red Sign In button]

Staff members access the system using their assigned hospital credentials.

1. Open Google Chrome or Microsoft Edge and navigate to `https://<hospital-host>/login`.
2. Enter your assigned **Username** or **Email Address**.
3. Enter your **Password**. Click the eye icon to verify what you typed.
4. Click **Sign In (Mag-login)**.
5. Upon verification, the system opens the Screen Display Selector.

---

### 3.2 First-Time Login Password Change

[Image: Screenshot of the Mandatory Password Change Dialog showing Temporary Password, New Password, Confirm Password, and the password strength meter]

New accounts issued with temporary credentials must set a private password before accessing hospital records.

1. In the first field, enter the **Temporary Password** provided by IT or your supervisor.
2. In the second field, enter your **New Password** (minimum 8 characters, including uppercase, lowercase, numbers, and symbols).
3. Re-enter the identical password in the **Confirm Password** field.
4. Click **Update Password & Continue**. The system saves your new credentials and unlocks workstation access.

---

### 3.3 Selecting Your Workstation Mode

[Image: Screenshot of the Screen Display Selector interface displaying cards for Patient Transfer, Nurse Station, Analytics Dashboard, and SuperAdmin]

The Screen Display Selector binds your computer to your specific role or desk for the day.

1. Review the available workstation options:
   - **Patient Transfer Desk (`/transfer`):** For triage coordinators and registration clerks.
   - **Nurse Station (`/nurse`):** For cubicle nurses and attending physicians.
   - **Analytics Dashboard (`/dashboard`):** For clinic supervisors and medical directors.
   - **SuperAdmin Portal (`/superadmin`):** For IT systems officers.
2. Click the card matching your operational assignment.
3. If prompted, select your physical counter or cubicle number, then click **Open Workstation**.

---

## Part 4: Triage and Registration Transfer Desk

**Interface:** `/transfer` Workstation  
**Users:** Registration Clerks, Triage Nurses, Care Coordinators  

---

### 4.1 Claiming a Counter Window and Managing Breaks

[Image: Screenshot of the Counter Claiming Modal Dialog showing counter selection buttons and service lane checkboxes]

Registration clerks must claim their physical window to receive incoming patient routing.

1. Upon opening the Transfer Desk, verify your counter in the top bar.
2. To change assignments, click **Change Desk Setup** and select your window (Counters 1 through 5).
3. Check the service categories your window processes today, then click **Save Desk Setup**.
4. **Taking a Break:**
   - Click **Take a Break** when leaving your desk for lunch or shift relief.
   - Your station status toggles to *On Break*, pausing automated patient routing to your counter.
   - Upon returning, click **Resume Station** to re-enter active rotation.

---

### 4.2 Workspace Layout and Service Navigation

[Image: Screenshot of the Patient Transfer Main Dashboard showing the service sidebar on the left, the active FIFO queue in the center, and destination cubicles on the right]

1. **Service Sidebar (Left):** Displays clinical lanes (*Consultation*, *Screening*, *ECG*) with real-time patient count badges. Click the collapse icon at the top to toggle between a 72px icon rail and an expanded 256px panel.
2. **Active Queue Stack (Center):** Displays arriving patients in strict chronological order.
3. **Destination Cubicles (Right):** Displays examination cubicles and doctors available for patient transfer.

---

### 4.3 First-In, First-Out (FIFO) Queue Enforcement

[Image: Screenshot of the Active Queue Panel highlighting the green 'Serving Next' badge on Patient #1 at the top, while Patient #2 and #3 below have padlock icons and 'Locked in stack']

The system enforces strict queue fairness based on arrival timestamps:

1. **Serving Next (Index 0):** The top patient card displays a green **Serving Next** badge. This card is unlocked, interactive, and ready for assignment.
2. **Locked Queue (Index > 0):** All subsequent patients display a padlock icon and the label *"Locked in stack — waits for turn"*. These cards cannot be transferred until the top patient has been processed, eliminating queue jumping.

---

### 4.4 Transferring a Patient to a Cubicle

[Image: Screenshot showing the drag-and-drop transfer in progress with a floating drag ghost and the target cubicle highlighted with a red dashed border]

Staff can transfer the unlocked patient using either a mouse or a touchscreen tablet:

#### Option A: Drag-and-Drop (Desktop Mouse or Stylus)
1. Click and hold the unlocked **Serving Next** patient card.
2. Drag the card across the screen over to the target cubicle (e.g., *Cubicle 3 — Dr. Santos*).
3. When the cubicle card outlines with a red dashed border, release the mouse button.

#### Option B: Tap-to-Select (Touchscreen Tablet)
1. Tap once on the unlocked **Serving Next** card to select it (solid red border appears).
2. Tap once on the target cubicle card.

---

### 4.5 Confirming the Transfer

[Image: Screenshot of the Pre-Commit Confirmation Modal Dialog showing ticket code, destination cubicle, doctor name, and SMS alert status]

1. Review the details in the confirmation dialog:
   - Patient Ticket Code (e.g., `C001`)
   - Destination Station (e.g., *Room 101 — Cubicle 3*)
   - Attending Physician (e.g., *Dr. Maria Santos*)
   - SMS Alert Status
2. Click **Confirm Assignment (Kumpirmahin)** to commit the transfer.
3. The patient is moved to the cubicle's queue, an automated SMS notification is dispatched to their phone, and the lobby TV updates instantly. The next patient in line automatically unlocks as **Serving Next**.
4. To cancel an accidental transfer, click **Cancel (Bumalik)**.

---

### 4.6 Managing Unresponsive Patients (Idle Numbers)

[Image: Screenshot of the Idle Numbers Panel showing parked tickets with rotation counts and 'Restore to Queue' and 'Dismiss' buttons]

When a summoned patient fails to appear at the desk, park their ticket without stopping the queue:

1. On the patient's card, click **Mark Idle / Unresponsive**.
2. The ticket moves into the **Idle Numbers** panel on the right, receives an incremented rotation count (e.g., *x1*), and enters a 5-minute cooldown.
3. The main queue advances to the next waiting patient.
4. **When the patient returns:** Locate their ticket in the Idle Numbers panel and click **Restore to Active Queue**. The ticket returns to the active queue with priority.
5. **At clinic closing:** Click **Dismiss / Remove from Queue** on any remaining abandoned tickets to archive them as *Cancelled*.

---

## Part 5: Clinical Nurse and Doctor Consultation Station

**Interface:** `/nurse` Workstation  
**Users:** Cubicle Staff Nurses, Clinic Aides, Attending Physicians  

---

### 5.1 Setting Up Your Cubicle Station

[Image: Screenshot of the Nurse Station Selection Banner showing room selector, cubicle number, and attending doctor name]

1. Open `/nurse` on your cubicle computer.
2. In the top banner, select your physical **Room Number** (e.g., *Room 101*) and **Cubicle Number** (e.g., *Cubicle 2*).
3. Confirm that the displayed **Attending Physician** matches the doctor on duty.
4. Your screen will now filter to show only patients directed to your specific cubicle.  
   *(Note: Head nurses can check "Show All Stations" to view all cubicles in the clinic at once).*

---

### 5.2 Four-Stage Kanban Clinical Workflow

[Image: Screenshot of the Clinical Nurse 4-Stage Kanban Board displaying columns for 'In Queue', 'With Doctor', 'Carryout & Post-Care', and the 'View Finished Ledger' button]

Follow this progression for every patient consultation:

#### Stage 1: Calling the Patient (In Queue)
1. View arriving patients in the **In Queue / Assigned** column.
2. When ready for the next patient, click the red **Call** button on their card.
3. The lobby TV rings its chime, the voice announcement sounds, and the card reflects *"Calling..."*.

#### Stage 2: Conducting Examination (With Doctor)
1. As the patient enters the cubicle, click **With Doctor**.
2. The card moves to the **With Doctor** column, and an elapsed consultation timer starts counting upward. The same timer reflects on the waiting room TV.

#### Stage 3: Post-Care and Orders (Carryout)
1. When the physician concludes medical evaluation, click **Carryout**.
2. The card moves to the **Carryout & Post-Care** column.
3. The nurse performs post-care duties:
   - Administering prescribed injections or medications.
   - Issuing diagnostic laboratory or ECG request slips.
   - Scheduling follow-up clinic appointments.
   - Providing prescription instructions.

#### Stage 4: Completing the Visit
1. Once all post-care activities are concluded, click the green **Done** button.
2. The visit is finalized, and the card is archived into the Finished Ledger.

---

### 5.3 Viewing Completed Patients (Finished Ledger)

[Image: Screenshot of the slide-over Finished Patient Ledger Drawer showing a table of today's completed encounters with consultation and carryout durations]

1. Click **View Finished Ledger** in the upper-right toolbar.
2. A slide-over drawer displays all patients completed today, showing check-in times, doctor examination durations, and carryout times.
3. Click **Close Ledger** to return to the active Kanban board.

---

### 5.4 Station Breaks and Theme Toggle

[Image: Screenshot of the Nurse Station Header showing the 'On Break' toggle switch and the Light/Dark Mode theme icon]

1. **Toggling Breaks:** Switch the station control from **Active** to **On Break** when stepping away for lunch or physician rounds. This alerts triage staff not to route patients to your cubicle.
2. **Adjusting Theme:** Click the **Sun / Moon icon** in the upper-right corner to toggle between Institutional Light Mode (for daytime clinic lighting) and Matte Dark Mode (for low-light eye comfort).

---

## Part 6: Administrative and Analytics Dashboard

**Interface:** `/dashboard` Portal  
**Users:** Clinic Supervisors, Head Nurses, Medical Directors, Data Analysts  

---

### 6.1 Real-Time Operational Overview

[Image: Screenshot of the Executive Overview Dashboard showing live metric cards for Total Arrivals, Waiting, In-Consultation, and Completed, with an hourly arrival trend chart]

1. Log into `/dashboard` and select **Dashboard Overview** in the sidebar.
2. Review the four live KPI cards:
   - **Total Arrivals Today:** Total queue tickets issued.
   - **Currently Waiting:** Patients waiting in triage and cubicle queues.
   - **In Consultation:** Patients currently inside doctor examination rooms.
   - **Completed Encounters:** Total patients discharged today.
3. Examine the **Hourly Arrival Chart** to identify morning arrival peaks.
4. Use the date filter pill to switch between *Today*, *Yesterday*, *Last 7 Days*, and *Month to Date*.

---

### 6.2 Patient Flow Ledger and Audit Records

[Image: Screenshot of the Patient Flow Audit Ledger Table showing ticket numbers, services, cycle times, and masked contact numbers (0917 •••• 567)]

1. Click **Patient Flow & Records** in the sidebar.
2. Use the search bar to locate a specific ticket code (e.g., `C005`).
3. Filter records by service category, doctor name, date range, or status (*Waiting*, *With Doctor*, *Carryout*, *Done*, *Cancelled*).
4. Review exact stage timestamps and cycle durations.
5. Patient telephone numbers are displayed in masked format (`0917 •••• 567`) in compliance with RA 10173.

---

### 6.3 Real-Time Cubicle Occupancy Grid

[Image: Screenshot of the Real-Time Cubicle Occupancy Grid showing green 'Vacant' cards, red 'Occupied' cards with active doctor timers, and gray 'Offline' cards]

1. Click **Cubicles** in the sidebar.
2. Review active consultation cubicles across each room:
   - **Green (Vacant):** Station is open and ready for patients.
   - **Red (In Consultation):** Station is actively examining a patient, with an active duration timer.
   - **Gray (Offline / On Break):** Station is closed or on staff break.
3. If any consultation exceeds 30 minutes, the card highlights in amber, alerting supervisors to potential clinical bottlenecks.

---

### 6.4 Four-Tier Analytics Framework

[Image: Screenshot of the Analytics Page displaying Descriptive volume breakdowns, Diagnostic bottleneck heatmaps, Predictive volume forecasts, and Prescriptive staffing recommendations]

1. Click **Reports & Analytics** in the sidebar.
2. **Tier 1 (Descriptive):** View patient volume distributions and statistical duration percentiles across each service stage.
3. **Tier 2 (Diagnostic):** Review bottleneck heatmaps and evaluate doctor utilization rates ($\rho = \lambda / \mu$).
4. **Tier 3 (Predictive):** Click the **Volume Forecasting** tab to view time-series forecast models (ARIMA, Moving Averages) predicting patient arrivals for the coming week.
5. **Tier 4 (Prescriptive):** Click the **Prescriptive Staffing** tab to view queueing theory recommendations ($M/M/1$ and Erlang C) detailing optimal cubicle staffing to maintain waiting times below 30 minutes.

---

### 6.5 Importing Historical Hospital Datasets

[Image: Screenshot of the Historical Dataset Import page showing the drag-and-drop file upload zone and automatic spreadsheet column mapping]

1. Click **Import Data** in the sidebar.
2. Drag and drop an official PHC Excel spreadsheet (`.xlsx`) or CSV file into the upload zone.
3. Review the column mapping preview (*"Queuing Time"* to check-in time, *"Doctor Seen"* to consultation start, *"Doctor Completed"* to consultation finish).
4. Click **Process and Ingest Records**. The system commits the historical data under an immutable read-only flag for research analysis.

---

### 6.6 Exporting Official PHC Excel Reports

[Image: Screenshot of the Export Data screen showing date selectors, clinical department checkboxes, and the green 'Generate Official PHC Excel Workbook' button]

1. Click **Export Data** in the sidebar.
2. Select your **Start Date** and **End Date**.
3. Choose the clinical departments you wish to export (or select *All Services*).
4. Click **Generate Official PHC Excel Workbook**.
5. The system generates a formatted multi-tab `.xlsx` report matching official Philippine Heart Center OPD standards and downloads it to your computer.

---

## Part 7: SuperAdmin Management Portal

**Interface:** `/superadmin` Console  
**Users:** Hospital IT Officers, MIS Systems Engineers, System Administrators  

---

### 7.1 Managing Staff User Accounts and Permissions

[Image: Screenshot of the SuperAdmin User Management Table with the 'Add New User' modal dialog open, showing role selection and room assignment checkboxes]

1. Navigate to `/superadmin` and select the **User Accounts** tab.
2. Click **Add New User** in the upper-right toolbar.
3. Fill in the user profile: Full Name, Email, Username, and Temporary Password.
4. Select the user's role:
   - `nurse`: Cubicle Kanban station and consultation callouts.
   - `staff`: Front-desk registration and triage transfer desks.
   - `admin`: Operational dashboard, reporting, and analytics.
   - `superadmin`: Full system administration and configuration.
5. Check the specific rooms and counters the user is permitted to manage.
6. Click **Create User Account**.
7. To edit or deactivate an account, locate the user in the table and click the edit (pencil) or deactivate (trash) icon.

---

### 7.2 Configuring Services and Ticket Prefixes

[Image: Screenshot of the Service Configuration Modal showing fields for Filipino Title, English Subtitle, Queue Prefix letter, and feature toggle checkboxes]

1. Click **Kiosk Services** in the SuperAdmin sidebar.
2. Click **Add New Service** (or click the edit icon on an existing service).
3. Enter the display titles (e.g., Filipino: *Konsultasyon*, English: *General Consultation*).
4. Set the **Queue Prefix Letter** (e.g., `C` for Consultation, `S` for Screening, `E` for ECG).
5. Toggle clinical workflow features:
   - Check **Requires Registration** if new patients must visit a registration counter first.
   - Check **Has Subcategories** if age division (Adult vs. Pediatric) is required.
   - Check **Doctor Selection** if patients may select specific physicians.
   - Check **Monitor Broadcasting** to display this service on lobby TV screens.
6. Click **Save Service Settings**. Kiosks update immediately.

---

### 7.3 Mapping Rooms, Cubicles, and Counters

[Image: Screenshot of the Physical Facilities Management screen showing the room list, cubicle numbers, and doctor assignment dropdowns]

1. Click **Facilities & Cubicles** in the sidebar.
2. **Add a Room:** Click **Add Room**, enter the room identifier (e.g., *Room 101*), and click save.
3. **Add a Cubicle:** Select the room, click **Add Cubicle**, enter the cubicle number, and assign the attending doctor from the staff directory.
4. **Configure Counters:** Switch to the **Counter Stations** tab and configure registration windows 1 through 5.

---

### 7.4 Pairing and Testing Thermal Receipt Printers

[Image: Screenshot of the Hardware Printer Configuration card showing the 'Discover WebUSB Printer' button, IP address settings, and the 'Test Print Slip' button]

1. Go to the **Hardware & Terminals** section in SuperAdmin.
2. **WebUSB Printers (Connected Directly to Kiosk):**
   - Click **Discover WebUSB Printer**.
   - Select your thermal printer from the browser popup (e.g., *Epson TM-T88*, *Xprinter 80mm*) and click **Connect**.
3. **Network Printers (Connected via LAN Cable):**
   - Enter the printer's static IP address (e.g., `192.168.1.150`) and raw port `9100`.
4. **Verification:** Click **Test Print Slip** to confirm that the printer prints and cuts a test receipt.

---

### 7.5 Global System Settings and API Keys

[Image: Screenshot of the Global System Settings form showing timeout sliders (45s warning, 15s countdown) and API key inputs for Deepgram TTS and UniSMS]

1. Click **System Settings** in the SuperAdmin sidebar.
2. Adjust system parameters:
   - **Kiosk Inactivity Warning Delay:** Seconds before the warning chime sounds (default: `45`).
   - **Kiosk Inactivity Countdown:** Duration of the countdown ring (default: `15`).
   - **TV Calling Beacon Duration:** Seconds the TV station card flashes red (default: `15`).
3. Enter API credentials:
   - **Deepgram API Key:** For text-to-speech voice callouts.
   - **UniSMS API Key:** For cellular text message notifications.
4. Click **Commit Global Settings** to save.

---

## Part 8: Troubleshooting and Frequently Asked Questions

### 8.1 What to do if the Kiosk Ticket Printer stops printing
- **Cause:** The printer ran out of paper, has a paper jam, or the USB cable is loose.
- **Action:**
  1. The kiosk automatically activates the **On-Screen Camera Fallback**. Direct the patient to photograph their ticket number displayed on the screen.
  2. Open the printer casing, insert a fresh 80mm thermal paper roll (feeding from underneath), and close the cover securely.
  3. The kiosk detects the paper automatically and resumes printing without requiring a restart.

---

### 8.2 What to do if the Waiting Room TV has no sound
- **Cause:** Browser audio autoplay was not initialized, or the TV volume is muted.
- **Action:**
  1. If the TV displays *"Click Anywhere to Initialize Audio Chimes"*, use the TV remote or wireless mouse to click once on the screen.
  2. Ensure the TV volume is unmuted and set to at least 65%.
  3. Test calling a patient from any nurse station to verify that the chime and voice announcement sound clearly.

---

### 8.3 What to do if the Hospital WiFi or Network drops
- **Cause:** Temporary network disruption.
- **Action:**
  1. Continue working normally. The system operates with an automated **Offline Write-Ahead Logging (WAL) Outbox**.
  2. A yellow banner will appear at the top of staff screens: *"Offline Mode — Mutations Queued Locally"*.
  3. Staff can continue calling patients and advancing stages. All actions are safely stored on the local computer.
  4. Once connectivity returns, the system automatically synchronizes all queued actions with the server within seconds.

---

### 8.4 How to reset a forgotten Staff Password
- **Action:**
  1. An MIS officer logs into `/superadmin`.
  2. Go to the **User Accounts** tab, locate the staff member, and click the key icon.
  3. Enter a temporary password and save.
  4. The staff member logs in with the temporary password and will be prompted to set a new private password immediately.

---

## Document Certification

This operational manual reflects the verified interface and standard operating procedures of **Heart Check PHC**, compiled from the production codebase and validated during User Acceptance Testing at the Philippine Heart Center Outpatient Department.

**Approved for Institutional Implementation:**  
Philippine Heart Center (PHC) — Outpatient Department  
STI College Caloocan — Department of Computer Studies  
Academic Year 2026–2027
