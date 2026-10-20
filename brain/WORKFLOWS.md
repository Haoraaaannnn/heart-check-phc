# Second Brain Workflows & Memory Protocol

**Last Updated:** 2026-10-18

This document defines the operational protocol for maintaining and interacting with the Heart Check PHC repo-local second brain. It applies to **Antigravity**, other AI coding assistants, and human developers.

---

## 1. Principles of Selective Context Retrieval

To avoid saturating the context window, degrading reasoning quality, and wasting tokens:

1. **Never Load the Entire Brain:**
   - Loading all files in `brain/` is strictly prohibited.
   - The second brain is organized into focused domains so agents load only what is directly implicated by the task.

2. **Hierarchical Retrieval Order:**
   - **Step 1: Classify the Task:** Simple tasks skip loading the brain entirely. Nontrivial tasks proceed to step 2.
   - **Step 2: Read [INDEX.md](./INDEX.md):** Identify the specific domain note or directory README matching the task.
   - **Step 3: Read [CURRENT.md](./CURRENT.md):** Check current git branch, active milestone, blockers, and next steps if relevant to ongoing work.
   - **Step 4: Load Only the Matching Note:** Load only that single targeted document (e.g., [kiosk-and-printing.md](./knowledge/kiosk-and-printing.md)).
   - **Step 5: Verify Against Source Code:** Brain notes provide context, not ground truth. Always read active source files before writing code.

---

## 2. Before-Task Workflow (Memory Ingestion)

```
Task Classification
     │
     ├── Simple task ──────────────────────────────────► Direct execution (Skip brain)
     │
     └── Nontrivial / Architecture task
               │
               ▼
         Read brain/INDEX.md
               │
               ▼
         Check brain/CURRENT.md (If branch/milestone context is needed)
               │
               ▼
         Read single targeted note (e.g. brain/architecture/database-and-rls.md)
               │
               ▼
         Verify active source code files (Targeted rg / line-slice view)
               │
               ▼
         Execute task
```

### Domain Retrieval Matrix

| If the task involves... | Load this Brain Note: |
| :--- | :--- |
| Table schemas, PostgreSQL RLS, AES-256-GCM phone encryption, historical immutability | [database-and-rls.md](./architecture/database-and-rls.md) |
| Route guarding (`requireSuperadmin`), middleware, authentication, rate limits | [security-model.md](./architecture/security-model.md) |
| Queue ordering, FIFO discipline, drag-and-drop, room counters | [queue-and-state.md](./architecture/queue-and-state.md) |
| Offline outbox, WebSocket reconnects, network resilience safeguards | [network-resilience.md](./architecture/network-resilience.md) |
| Kiosk touchscreen, thermal printing, ticket generation, ESC/POS commands | [kiosk-and-printing.md](./knowledge/kiosk-and-printing.md) |
| Nurse Kanban, cubicle intake, audio callout TTS, optimistic UI | [nurse-and-kanban.md](./knowledge/nurse-and-kanban.md) |
| Forecasting models, queue metrics, M/M/1 queuing equations, staffing rules | [analytics-and-ml.md](./knowledge/analytics-and-ml.md) |
| Excel workbook import/export, AM/PM heuristics, timezone offsets | [data-pipelines.md](./knowledge/data-pipelines.md) |
| Troubleshooting errors, printer timeouts, RLS recursion | [common-issues.md](./debugging/common-issues.md) |
| Running or updating Chapter 4 consultation queue simulation | [simulation-guide.md](./debugging/simulation-guide.md) |

---

## 3. After-Task Workflow (Memory Persistence)

Memory is only useful if it is continuously maintained and accurate:

1. **Update Discipline:**
   - Update only knowledge that is **new, verified, reusable, and likely to matter again**.
   - Do NOT update notes merely because a task was completed.
   - Summarize only important outcomes; avoid dumping large command outputs or entire files.

2. **Update [CURRENT.md](./CURRENT.md):**
   - Replace stale information instead of accumulating a diary. Keep it brief with active milestone, blockers, and next steps.

3. **Log Multi-Step Work in [SESSION_LOG.md](./SESSION_LOG.md):**
   - For multi-turn tasks or ongoing work, record decisions made, files changed, checks performed, unresolved issues, and next actions.

4. **Record Architecture Decisions (ADRs):**
   - If an architectural trade-off with lasting consequences was made, create a new ADR note in [decisions/](./decisions/README.md) following `adr-00X-short-description.md`.
   - Update [INDEX.md](./INDEX.md) and [decisions/README.md](./decisions/README.md).

5. **Maintain Directory Indexes:**
   - Whenever a knowledge file is added, renamed, or removed, update [INDEX.md](./INDEX.md) and the corresponding directory `README.md`.

6. **Update Feature Guides (`app/**/README.md`):**
   - If UI components, constants, or text files were added or renamed, update the corresponding subsystem `README.md` "Where to Edit" table per AGENTS.md Rule 8.

---

## 4. Markdown and Link Standards for Portability

To guarantee that notes work seamlessly in Obsidian, GitHub, VS Code, and AI toolchains:

- **Standard Relative Markdown Links:** Always format links as `[Label](./path/to/note.md)` or `[Label](../path/to/note.md)`.
- **No Proprietary WikiLinks (`[[Note]]`):** Standard Markdown links ensure full cross-editor portability and work natively in GitHub.
- **Zero Emojis Standard:** Never include emojis in headings, lists, tables, or text.
- **Explicit ISO Date Stamps:** Maintain `**Last Updated:** YYYY-MM-DD` on all updated documentation files.
