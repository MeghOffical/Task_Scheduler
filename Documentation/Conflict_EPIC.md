# Conflicts Between Epics

| **Conflict (Epics)** | **Possible Issue** | **Solution** |
|----------------------|-----------------|-------------|
| Epic 1 (Login/Registration) vs Epic 2 (CRUD) | Tasks may not be linked to the correct user; all tasks could get mixed together. | Finish login first, and store tasks with a unique user ID. |
| Epic 2 (CRUD) vs Epic 3 (UX & Accessibility) | If the database changes later, filters and search might break. | Plan the database schema early with fields for tags, priorities, and deadlines. |
| Epic 3 (UX) vs Epic 4 (Notifications & Export) | Notifications rely on deadlines; UX changes might cause reminders to fail. | Freeze the deadline format before starting notification or export code. |
| Epic 4 (Notifications & Export) vs Epic 5 (Chatbot) | Changes in reminders or export logic might break chatbot commands. | Use one standard function for reminders/export that both UI and chatbot use. |
| Epic 5 (Chatbot) vs Epic 6 (Advanced Features) | Chatbot may not handle subtasks or recurring tasks correctly. | Extend chatbot gradually, adding support for new features step by step. |
| Epic 1 (Login) vs Epic 5 (Chatbot) | Chatbot may try to create tasks before user login. | Ensure chatbot actions check if user is logged in first. |
| Epic 2 (CRUD) vs Epic 6 (Advanced Features) | Recurring tasks or subtasks may break the existing CRUD logic. | Update CRUD functions to handle new task types before full release. |
| Epic 3 (UX) vs Epic 6 (Advanced Features) | Adding new filters or categories might conflict with existing UX layout. | Test UI with new features; adjust layouts for consistency. |
| Epic 4 (Notifications & Export) vs Epic 6 (Advanced Features) | Recurring tasks or subtasks may not trigger notifications correctly. | Extend notification logic to handle new task types. |
| Epic 5 (Chatbot) vs Epic 3 (UX & Accessibility) | Chatbot suggestions might conflict with manual UI actions. | Sync chatbot suggestions with UI actions to avoid duplication or conflict. |
