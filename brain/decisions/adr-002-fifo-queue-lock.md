# ADR 002: Strict FIFO Queue Lock Discipline

## Status
Accepted

## Context
In hospital outpatient departments, patient queue discipline is vital to clinical fairness and patient satisfaction. In manual paper-based queues, preferential treatment, accidental misplacement of records, and queue jumping are frequent friction points.

In our digital clinical transfer desk (`/transfer`), healthcare operators drag patient cards from waiting stacks and drop them onto available registration counters or consultation cubicles. Without software constraints, operators could inadvertently drag patients out of arrival order, violating First-In, First-Out (FIFO) queue principles.

## Decision
We implemented a **strict programmatic FIFO lock** on patient queue stacks:
1. In any waiting lane or triage queue, **only the top patient card (`index === 0`, designated "Serving Next") is interactive, draggable, and assignable**.
2. All subsequent cards (`index > 0`) are rendered in a disabled, locked state with clear visual indicators showing their numbered position in line.
3. Pointer event handlers (`onPointerDown`, `onPointerMove`, `onPointerUp`) are attached exclusively to the card at index 0.

## Consequences
- **Positive:** Mathematically and operationally guarantees FIFO queue discipline. Healthcare staff cannot accidentally or deliberately bypass patients waiting ahead.
- **Positive:** Minimizes cognitive load on operators by removing ambiguity about which patient to serve next.
- **Trade-off:** In emergency clinical scenarios where a patient's condition suddenly deteriorates (triage escalation), the operator cannot drag a lower card directly.
- **Mitigation:** A dedicated triage override / emergency priority flag allows authorized triage staff to elevate urgent patients to index 0 through an explicit clinical confirmation modal.
