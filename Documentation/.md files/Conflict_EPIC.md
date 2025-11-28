# Conflicts Between Epics

| Conflict (Epics) | Possible Issue | Solution |
| :--- | :--- | :--- |
| **Epic 1 (Login/Registration)**<br>vs<br>**Epic 2 (CRUD)** | Tasks may not link to the correct user; tasks could get mixed. | Finish login first, and store tasks with a unique user ID. |
| **Epic 2 (CRUD)**<br>vs<br>**Epic 3 (UX & Accessibility)** | If the database changes later, filters and search may break. | Plan the database early with fields for tags, priorities, and deadlines. |
| **Epic 3 (UX)**<br>vs<br>**Epic 4 (Notifications & Export)** | Notifications rely on deadlines; UX changes may cause reminders to fail. | Freeze the deadline format before starting notification or export code. |
| **Epic 4 (Notifications & Export)**<br>vs<br>**Epic 5 (Chatbot)** | Changes in reminders or export may break chatbot commands. | Use one standard function for reminders/export for both UI and chatbot. |
| **Epic 5 (Chatbot)**<br>vs<br>**Epic 6 (Advanced Features)** | Chatbot may not handle subtasks or recurring tasks correctly. | Extend chatbot gradually, adding support for new features step by step. |
| **Epic 1 (Login)**<br>vs<br>**Epic 5 (Chatbot)** | Chatbot may try to create tasks before user login. | Ensure chatbot actions check if user is logged in first. |
| **Epic 2 (CRUD)**<br>vs<br>**Epic 6 (Advanced Features)** | Recurring tasks or subtasks may break existing CRUD logic. | Update CRUD functions to handle new task types before full release. |
| **Epic 3 (UX)**<br>vs<br>**Epic 6 (Advanced Features)** | Adding new filters or categories may conflict with UX layout. | Test UI with new features; adjust layouts for consistency. |
| **Epic 4 (Notifications & Export)**<br>vs<br>**Epic 6 (Advanced Features)** | Recurring tasks or subtasks may not trigger notifications correctly. | Extend notification logic to handle new task types. |
| **Epic 5 (Chatbot)**<br>vs<br>**Epic 3 (UX & Accessibility)** | Chatbot suggestions may conflict with manual UI actions. | Sync chatbot suggestions with UI actions to avoid duplication or conflict. |
