# Non-Functional Requirements (NFR)

## NFR-01 - Reliability / Data integrity 

**Requirement:**\
No silent data loss\
Atomic writes to local DB\
Example: Either the whole task is done or not)\
Provide ability to Backup/Export data.

**Measurable:**\
0% reported data loss in testing\
DB transactions for task create/update/delete.

**Identified by:**\
Risk analysis and Survey. 


## NFR-02 - Performance / Responsiveness  

**Requirement:**\
UI interactions (create/update/delete/filter) should respond within ~1s on typical laptop datasets.

**Measurable:**\
95% of interactions < 1s in pilot.

**Identified by:**\
Use cases, prototyping, surveys(expectation of “fast, simple”). 


## NFR-03 - Usability / Learnability  

**Requirement:**\
Minimal UI complexity; new users can create a task in under ~10 seconds (goal).

**Measurable:**\
Time-to-create task metric measured in usability tests.

**Identified by:**\
 surveys, prototyping.


## NFR-04 - Portability / Platform support 

**Requirement:**\
Deliver installers/packages for Windows and macOS and possibly linux (desktop app).

**Measurable:**\
Verified install and run on targeted OSes.

**Identified by:**\
Stakeholder analysis, studying documentation.


## NFR-05 – Maintainability / Modularity
 

**Requirement:**\ 
The code should be written in a modular way, with separate parts for UI, data, and storage.\
Core logic should have unit tests.

**Measurable:**\ 
Check unit test coverage and whether core logic tests pass.

**Identified by:**\ 
Risk analysis.

## NFR-06 – Extensibility / Scalability 


**Requirement:**\ 
The system design should make it easy to add future features like cloud sync, calendar integration, 
or gamification without big changes.

**Measurable:**\ 
Existence of a service layer and documented points for adding new features.

**Identified by:**\ 
Roadmap and brainstorming.



