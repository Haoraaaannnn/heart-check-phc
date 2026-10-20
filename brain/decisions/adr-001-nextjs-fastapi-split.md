# ADR 001: Next.js and FastAPI Service Split

## Status
Accepted

## Context
Heart Check PHC requires an interactive, real-time user interface for kiosk terminals, public monitors, and clinical triage stations, alongside complex analytical computations:
- Five predictive queue forecasting models (SMA, WMA, EMA, Linear Regression, ARIMA).
- Queueing theory equations (M/M/1 and M/M/c models).
- Discrete-event simulation engines (SimPy) and automated Excel workbook reporting.

Evaluating architecture options:
1. **Monolithic Next.js (All-in-Node):** Implementing mathematical, scientific, and ML libraries in Node.js (via JavaScript/WebAssembly ports) would result in substandard scientific computing support, fragile ARIMA implementations, and potential event-loop blocking during intensive recalculations.
2. **Monolithic Python (FastAPI/Django):** Implementing reactive UI touchscreens, drag-and-drop queues, and complex responsive clinical workstations with server-rendered Python templates would slow frontend development and degrade UX responsiveness.
3. **Decoupled Architecture (Next.js UI + FastAPI Scientific Backend):** Separates clinical presentation and real-time UI synchronization from mathematical computations and queue forecasting.

## Decision
We adopted a **decoupled two-tier architecture**:
1. **Frontend Tier (Next.js 15 App Router):** Manages touch UI, state machines, Realtime WebSocket subscriptions, session authentication, and Route Handlers.
2. **Analytical Tier (FastAPI):** Exposes stateless scientific computing endpoints powered by NumPy, Pandas, Scikit-learn, Statsmodels, and OpenPyXL.
3. **Inter-Service Contract:** Communication takes place over internal HTTP REST endpoints protected by private networking, schema validation (Zod on Next.js, Pydantic on FastAPI), and a strict 10-second request timeout (`AbortController`).

## Consequences
- **Positive:** Leverages Python's mature scientific computing ecosystem for clinical queue modeling while utilizing React 19 / Next.js 15 for hospital touchscreens.
- **Positive:** Analytical calculations cannot block the Next.js event loop or cause UI latency at kiosk check-in.
- **Trade-off:** Requires maintaining two runtime environments (Node.js 18+ and Python 3.10+) in development and deployment.
- **Mitigation:** Subsystem health checks and timeouts isolate failures cleanly so UI operations continue even if analytical services experience temporary delays.
