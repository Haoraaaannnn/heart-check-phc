# ADR 004: Prohibition of Text Ellipsis on Clinical Data

## Status
Accepted

## Context
Standard responsive web development frequently relies on CSS ellipsis (`text-overflow: ellipsis`, Tailwind `truncate`) to prevent container overflow on constrained mobile or tablet screens.

In a hospital clinical queue system, however, truncated strings present severe operational hazards:
- A physician's name truncated from "Dr. Maria Santos-Cruz" to "Dr. Maria San..." causes ambiguity in multi-doctor departments.
- A patient ticket number truncated from "C014" to "C0..." can result in patients entering incorrect examination rooms.
- Truncated service names or cubicle numbers risk misdirecting elderly or distressed patients.

## Decision
We established a **strict prohibition against text ellipsis and truncation on clinical and operational indicators** (codified in AGENTS.md Rule 11):
1. Tailwind classes `truncate`, `text-ellipsis`, and CSS property `text-overflow: ellipsis` are banned on all patient names, ticket numbers, physician identifiers, cubicle designations, service labels, and medical statuses.
2. Layout containers must be engineered with adequate width or employ natural, graceful multi-line wrapping (`break-words`, `whitespace-normal`).
3. Card grids and table cells must expand or scale dynamically to accommodate the full text string without clipping.

## Consequences
- **Positive:** Eliminates clinical ambiguity and misidentification hazards across all nurse stations, transfer desks, and waiting room monitors.
- **Positive:** Complies with hospital ergonomic and safety guidelines.
- **Trade-off:** Requires deliberate layout design with dynamic container height and line wrapping considerations rather than quick single-line truncations.
- **Mitigation:** Subsystem style dictionaries (`<feature>.ts`) define explicit responsive min-heights and flexbox wrapping rules to maintain clean visual balance.
