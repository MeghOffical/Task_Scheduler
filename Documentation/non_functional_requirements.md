# Non-Functional Requirements (NFR)

## NFR-01 - Reliability / Data integrity 

**Requirement:**
No silent data loss\
Atomic writes to local DB\
Example: Either the whole task is done or not\
Provide ability to Backup/Export data.

**Measurable:**
0% reported data loss in testing\
DB transactions for task create/update/delete.

**Identified by:**
Risk analysis and Survey. 

---

## NFR-02 - Performance / Responsiveness  

**Requirement:**
UI interactions (create/update/delete/filter) should respond within ~1s on typical laptop datasets.

**Measurable:**
95% of interactions < 1s.

**Identified by:**
Use cases, prototyping, surveys(expectation of “fast, simple”). 

---

## NFR-03 - Usability / Learnability  

**Requirement:**
Minimal UI complexity; new users can create a task in under ~10 seconds (goal).

**Measurable:**
Time-to-create task metric measured in usability tests.

**Identified by:**
 surveys, prototyping.

---

## NFR-04 - Portability / Platform support 

**Requirement:**
Deliver installers/packages for Windows and macOS and possibly linux (desktop app).

**Measurable:**
Verified install and run on targeted OSes.

**Identified by:**
Stakeholder analysis, studying documentation.

---

## NFR-05 – Maintainability / Modularity
 
**Requirement:**  
The codebase should be modular with a clear separation of concerns (UI, data, persistence).  
Core logic should have unit tests to ensure correctness.  

**Measurable:**  
Unit test coverage & success rate for core logic.  
*(i.e., how much of the code is tested = coverage, and how many tests pass = success rate).*  

**Identified by:**  
Risk analysis.  

---

## NFR-06 – Extensibility / Scalability 

**Requirement:**  
The architecture should allow adding future features like cloud sync, calendar API integrations, or gamification without major rewrites.  

**Measurable:**  
Existence of a clear adapter/service layer *(so base layer talks to the middle layer, not directly to the DB)* and documented integration points.  

**Identified by:**  
Interviews *(users wanted their tasks synced across devices, i.e., cloud sync)* and brainstorming sessions.  

---

## NFR-07 – Startup & Resource Footprint

**Requirement:**  
The app should start quickly and use low memory so that it runs smoothly on laptops.  

**Measurable:**  
Startup time < 5s on target hardware.  
Memory usage remains reasonable during idle state.  

**Identified by:**  
Usability expectations and survey feedback.  

---

## NFR-08 – Testability (for QA)

**Requirement:**  
The system should provide test hooks (e.g., debug mode, mock API) and proper logging (e.g., “Task created successfully at 12:05 PM”).  

**Measurable:**  
QA can run automated scenarios for core flows and verify outcomes consistently.  

**Identified by:**  
QA stakeholder analysis and group meetings (brainstorming). 

---

## NFR-09 – AI Privacy & Data Handling (MUST, for chatbot feature)

**Requirement:**  
Chatbot interactions must default to privacy-preserving behaviour.  
Users must explicitly opt in to any cloud-based processing, with local-only processing preferred where possible.  
All data handling should be transparent and described in a short in-app privacy notice.  

**Measurable:**  
- Opt-in toggle present.  
- Telemetry or transcripts are only collected with consent.  
- No personal data is shared without explicit consent.  

**Elicited by:**  
Risk analysis, interviews, stakeholder analysis (legal/privacy stakeholders).  

---

## NFR-10 – Chatbot Response Accuracy & Safety 

**Requirement:**  
Chatbot should provide clear confidence indicators and safe fallbacks.  
For example: *“I’m not sure – would you like me to create a draft task for you to review?”*  
The chatbot must avoid making irreversible changes without user confirmation.  

**Measurable:**  
In pilot testing, fewer than 5% of chatbot-suggested task creations are reverted by users.  

**Elicited by:**  
Pilot testing, prototyping, competitive analysis. 

---

## NFR-11 – Chatbot Latency & Availability

**Requirement:**  
Chat responses should return within a few seconds for a smooth conversational feel.  
If external services are unavailable, the system should detect this and gracefully fall back to offline help or local parsing.  

**Measurable:**  
90% of responses return in under 3 seconds during pilot (when cloud services are used).  

**Elicited by:**  
Prototyping and use-case expectations.  

---

## NFR-12 – Maintainability (Chatbot Models / Rules) 

**Requirement:**  
The chatbot must be designed as a modular layer so that rules, prompts, or models can be updated without breaking the core app.  

**Measurable:**  
Integration points are documented, and updates can be applied in a non-disruptive way.  

**Elicited by:**  
Brainstorming and competitive analysis. 
