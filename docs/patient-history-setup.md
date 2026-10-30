# Ticket movement history

The History button opens the same panel in Dashboard Patient Flow & Records, Doctors Station, and Transfer. Each committed movement records the staff username at the time, server timestamp, source and destination, service, clinical stage, queue position and rotation count. Calls, timer pauses/resumes, removal, reactivation and completion also appear. Automatic rotations identify the initiating workstation account separately from the automatic action.

The panel lists the latest step first and loads older steps in pages of 50. Refresh retrieves the latest recorded steps. All displayed timestamps use Manila time, including seconds.

## Activate recording

1. Deploy this application version first. Its server routes attach the verified staff identity to their database requests. Keep this version running when applying the migration, because manual-call recording requires that verified identity.
2. In an approved database-admin session, run [patient_movement_history.sql](migrations/patient_movement_history.sql). The existing `monitor_calls` table from [monitor_calls.sql](migrations/monitor_calls.sql) must already exist. The migration creates the history table and triggers in one transaction and adds a clearly labelled starting point for existing live tickets. It does not modify patient records.
3. Verify setup using [verify_patient_movement_history.sql](migrations/verify_patient_movement_history.sql). This check only reads database metadata; it does not move or create tickets.
4. During a supervised check with a test ticket, move it through the existing workflow and open History. Confirm the signed-in username, Manila timestamp, stage, source and destination at each step. Check both counter handoffs and clinical transitions, then refresh from Dashboard after completion.

The migration has to be applied to the database used by the running app. Until then, the panel explicitly reports that detailed history is unavailable. Application tests use isolated fixtures; they do not validate execution of the SQL against the deployed database.

## Identity, access and privacy

Authenticated client writes derive identity from `auth.uid()`. Client-supplied operator headers are ignored. Authenticated server routes use a request-specific header only after their existing permission checks; the trigger accepts it only for service-role requests. Database work without an identifiable operator is explicitly labelled. Staff usernames and roles are snapshotted so later account renaming does not rewrite earlier events.

Administrators can inspect Dashboard records, including retained history for deleted tickets. Doctor and nurse accounts can inspect only tickets in their currently assigned cubicles or linked physician stations. Shared OPD Screening viewing does not unlock other doctors' detailed history. Transfer and intake staff can inspect their assigned services or counters. Previously assigned clinical tickets become inaccessible to the previous doctor after reassignment; administrators retain access to the whole timeline.

Only the authenticated server history endpoint can read the history table. Browser roles cannot insert, rewrite, delete or directly read history. Triggers write within the original transaction: rejected or rolled-back movements do not create successful history entries. Repeated unchanged writes and derived display timer updates do not create handoff events. Historical patient rows are excluded from operational recording.

History stores a strict allowlist of operational state. Patient names, contact details, speech messages, request bodies and credentials are excluded. The API additionally strips internal authentication identifiers. A history row survives physical ticket deletion because it has no cascading foreign key to patients. Staff history is never added to public monitor responses.

Earlier handoffs cannot be recovered from current patient state. Existing tickets begin at an explicitly labelled observed starting point with the migration timestamp. This feature does not invent old operators, movement times or destinations.

## Database references

The database capture uses [PostgreSQL AFTER triggers](https://www.postgresql.org/docs/18/trigger-definition.html) and [PostgREST transaction-scoped request settings](https://postgrest.org/en/stable/references/transactions.html). The server-only operator header is attached to each individual query builder; the shared database client is never globally assigned an operator identity.
