# Application simulation readiness

Checked on 26 October 2026. These checks use isolated fixtures and do not create or change live patient records, send SMS, or print tickets.

## Verified checks

- All 57 automated tests pass with no failures or skipped tests.
- TypeScript checking passes.
- Full-repository lint passes with no errors; existing warnings remain.
- The final production build passes using Webpack, including nurse loading recovery and the header layout correction; all 59 pages generate successfully.
- Tests cover first login, shared sessions across tabs, retryable loading failures, session expiration, assignment scope and capacity, returning tickets to counters, and routing calls to monitors.
- Isolated nurse tests complete Assigned, With Doctor, Carryout, and Done, including backward actions, stale requests, rejected saves, historical protection, role restrictions, and durable offline replay under the same account.
- Phone encryption tests cover randomized ciphertext, tampering, masking, and missing-key rejection.
- Monitor tests cover Pedia isolation and hiding patients at unavailable stations.

## Repairs made during this review

- Nurse saves now use a restricted server endpoint and require acknowledgement. Rejected requests cannot fall back to an unrestricted client update.
- Offline nurse saves require durable storage, retain their original stage and account, and replay through the same server checks. Conflicting queued actions remain pending for staff review.
- Nurse queue reads return an error when assignments or patient reads fail, rather than displaying a false empty queue. Daily boundaries consistently use Manila time.
- Nurse startup uses the shared session guard, bounds data loading, and offers a retry instead of an indefinite loading screen or a competing login redirect.
- Empty Pedia monitors no longer fall back to Adult data. Unavailable stations remain hidden even when every station is unavailable.
- Loading and station setup no longer change React hook order. Station setup releases its saving state when a save throws.
- Nurse header controls wrap when space is limited, preventing the station selector from colliding with physician information. Clinical labels remain visible without text ellipsis.
- Monitor call highlighting expires without waiting for unrelated data updates.
- A busy printer returns a retryable failure instead of claiming that an unprinted ticket succeeded.
- SMS entry no longer falls back to storing an unencrypted phone number. Encryption requires a configured secret, and an unused public decryption action was removed.
- Build tracing and server-action exports were corrected. The build script uses Webpack, matching the development configuration.

## Required hands-on rehearsal

Software checks do not certify the physical setup. Before the demonstration, use a clearly fictitious ticket and check:

1. Open Transfer, Nurse, and Superadmin in separate tabs. Refresh one and confirm the others stay signed in.
2. Generate a ticket, confirm the paper prints, and verify its service and number.
3. Pause and resume the registration timer, assign the ticket to the intended cubicle, then use Back and confirm it returns to a counter.
4. Call from registration and nursing. Confirm the intended monitor speaks and staff devices stay silent.
5. Put a counter and cubicle on break. Confirm neither receives new assignments or appears on its monitor; resume both afterward.
6. Complete the nurse stages and confirm the completed queue updates.
7. If SMS is part of the demonstration, verify delivery using a consenting team member's number and the approved SMS provider.
8. Check the configured session duration, reconnect after a brief network interruption, and explicitly log out when finished.

Physical printer operation, audible monitor announcements, SMS delivery, and a full live multi-device patient journey remain hands-on acceptance checks.

## Browser verification

The public Pedia monitor renders correctly, and the kiosk entrance was reached without creating a patient. Nurse initially remained in loading with intermittent browser-control timeouts. After adding loading recovery and using Retry, the signed-in nurse board, station selector, finished ledger, and break control rendered successfully with no recorded browser errors. Loading latency still needs a rehearsal on the actual demonstration devices and network.

Transfer, Nurse, and Superadmin subsequently rendered in three separate signed-in tabs. Superadmin displayed its inactivity countdown. No staff session was logged out during that check.
