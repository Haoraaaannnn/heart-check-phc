# ADR 003: Supabase Realtime with Row-Level Security

## Status
Accepted

## Context
Heart Check PHC requires low-latency synchronization across distributed screens:
- Public monitors in waiting rooms must instantly display ticket numbers when called.
- Clinical transfer desks must update room counts as soon as cubicle intake completes.
- Nurse stations must receive newly transferred patients immediately.

Additionally, sensitive Patient Health Information (PHI) such as phone numbers and historical records must not be exposed to unauthorized subscribers listening on WebSocket channels.

## Decision
We adopted **Supabase Realtime Channels bound to Row-Level Security (RLS)**:
1. All client applications connect to Supabase Realtime using Postgres Change feeds (`postgres_changes`).
2. RLS policies configured on the PostgreSQL database govern Realtime message broadcasts. When a row changes, Postgres evaluates RLS for each active listener before dispatching the payload.
3. Kiosk monitors subscribe using the anonymous public role, receiving only public operational fields (e.g., `patientNum`, `status`, `cubicleNum`) while sensitive PII (encrypted phone numbers, historical data) remains restricted.
4. Historical research rows (`is_historical = true`) are filtered out of live operational broadcast channels.

## Consequences
- **Positive:** Zero need to manage custom WebSocket servers, pub/sub brokers (e.g. Redis), or connection state logic in Next.js.
- **Positive:** Enforces uniform security rules across both REST queries and real-time push streams.
- **Trade-off:** RLS policy evaluation adds slight compute overhead on PostgreSQL during high-throughput bulk changes.
- **Mitigation:** Live check-in traffic is naturally rate-limited by physical kiosk touch interaction (one patient every 30-60 seconds), keeping database CPU utilization minimal.
