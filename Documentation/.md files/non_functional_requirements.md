# Non-Functional Requirements (NFR)

## NFR-01 - Reliability / Data integrity

**Requirement:**
No data should ever be lost silently.
Every write to the local database must be atomic.
Example: A task should be either fully completed or not done at all — no partial updates.
The system must allow users to back up or export their data.

**Measurable:**
0% data loss during testing.
All task create, update, and delete actions must use database transactions.

**Identified by:**
Found through risk analysis and user surveys.

---

## NFR-02 - Performance / Responsiveness

**Requirement:**
UI actions (create, update, delete, filter) should respond in about 1 second on a normal laptop with typical data.

**Measurable:**
95% of actions should take less than 1 second.

**Identified by:**
Based on use cases, early prototypes, and surveys (users expect the app to feel "fast and simple").

---

## NFR-03 - Usability / Learnability

**Requirement:**
The UI should be simple, and new users should be able to create a task in about 10 seconds (goal).

**Measurable:**
The time it takes to create a task will be measured during usability tests.

**Identified by:**
Surveys and prototypes.

---

## NFR-04 - OS and Installation Support

**Requirement:**
Provide installers/packages for Windows, macOS, and possibly Linux (for the desktop app).

**Measurable:**
Confirmed that the app installs and runs on all target operating systems.

**Identified by:**
Stakeholder analysis and reviewing documentation.

---

## NFR-05 – Maintainability / Modularity

**Requirement:**
The code should be modular, with clear separation between UI, data handling, and storage.
Core logic should have unit tests to make sure it works correctly.

**Measurable:**
Unit test coverage and success rate for the core logic.
(Coverage = how much of the code is tested; Success rate = how many tests pass.)

**Identified by:**
Risk analysis.

---

## NFR-06 – Extensibility / Scalability

**Requirement:**
The system's design should make it easy to add future features like cloud sync, calendar API support, or gamification without needing large code changes.

**Measurable:**
There should be a clear adapter/service layer (so the main app talks to the middle layer instead of directly to the database) and well-documented places where new features can be added.

**Identified by:**
Interviews (users wanted their tasks to sync across devices — cloud sync) and brainstorming sessions.

---

## NFR-07 – Startup & Resource Footprint

**Requirement:**
The app should start fast and use low memory so it runs smoothly on laptops.

**Measurable:**
Startup time should be under 5 seconds on the target hardware.
Memory usage should stay low when the app is idle.

**Identified by:**
User expectations and survey feedback.

---

## NFR-08 – Testability (for QA)

**Requirement:**
The system should offer test hooks (like debug mode or mock APIs) and clear logs (for example: "Task created successfully at 12:05 PM").

**Measurable:**
QA should be able to run automated tests for the main features and get consistent results.

**Identified by:**
QA stakeholder analysis and group brainstorming meetings.

---

## NFR-09 – AI Privacy & Data Handling (MUST, for chatbot feature)

**Requirement:**
The chatbot must follow privacy-friendly behavior by default.
Users must clearly choose (opt in) if they want any cloud-based processing, and local processing should be used whenever possible.
All data handling must be clear and explained in a short in-app privacy notice.

**Measurable:**
⦁ An opt-in toggle is available.
⦁ Telemetry or chat transcripts are collected only if the user gives consent.
⦁ No personal data is shared without explicit user consent.

**Elicited by:**
Risk analysis, interviews, and discussions with legal/privacy stakeholders.

---

## NFR-10 – Chatbot Response Accuracy & Safety

**Requirement:**
The chatbot should show clear confidence levels and provide safe fallback options.
For example: "I'm not sure – would you like me to create a draft task for you to review?"
It must not make irreversible changes without asking the user first.

**Measurable:**
In pilot tests, less than 5% of chatbot-suggested task creations are undone by users.

**Elicited by:**
Pilot testing, prototypes, and competitive analysis.

---

## NFR-11 – Chatbot Latency & Availability

**Requirement:**
Chat responses should come back within a few seconds for a smooth conversation.
If external services are unavailable, the system should detect this and safely fall back to offline help or local processing.

**Measurable:**
90% of responses should return in under 3 seconds during pilot tests when cloud services are used.

**Elicited by:**
Prototypes and expected use cases.

---

## NFR-12 – Maintainability (Chatbot Models / Rules)

**Requirement:**
The chatbot should be modular so that rules, prompts, or models can be updated without affecting the main app.

**Measurable:**
Integration points are documented, and updates can be made without disrupting the system.

**Elicited by:**
Brainstorming and competitive analysis.
