

# Non-Functional Requirements (NFR)

## NFR-01 - Reliability / Data integrity - MUST

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


## NFR-02 - Performance / Responsiveness - MUST
**Requirement:**\
UI interactions (create/update/delete/filter) should respond within ~1s on typical laptop datasets.

**Measurable:**\
95% of interactions < 1s in pilot.

**Identified by:**\
Use cases, prototyping, surveys(expectation of “fast, simple”).
