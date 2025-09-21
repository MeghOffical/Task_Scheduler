# Epic 1 — User Authentication (Login & Registration)

## Description / Acceptance
This epic enables users to securely create accounts and log in to the app. Each user should only see their own tasks, ensuring privacy and secure access. Registration is immediate, and users can start managing tasks without delay. Wrong credentials or inactive accounts must block access with clear error messages.

**Associated User Stories:**  
- User Story 1 — Registration (Sign-Up): Create an account.
- User Story 2 — Login: Log in and access saved tasks.

---

# Epic 2 — Core CRUD + Local Persistence

## Description / Acceptance
This epic ensures users can create, view, edit, and delete tasks reliably, with all data stored locally to survive app restarts. Undo options restore accidentally deleted tasks. Task priorities and deadlines are supported and changes are instantly reflected on the dashboard. Overall, it provides the basic task management foundation.

**Associated User Stories:**  
- User Story 3 — Task Creation: Create new tasks.
- User Story 4 — Task Editing: Modify task details.
- User Story 5 — Task Deletion: Remove tasks with undo option.
- User Story 6 — Priority Setting: Assign/change task priority.
- User Story 7 — Deadline Management: Set deadlines with reminders.

---

# Epic 3 — UX Polish, Quick-add & Accessibility

## Description / Acceptance
This epic improves usability and accessibility for all users. Tasks can be added quickly, and users can sort, filter, or search efficiently. Screen reader support ensures inclusivity. The goal is to make task management fast, intuitive, and accessible for students and power users alike.

**Associated User Stories:**  
- User Story 8 — Sorting & Viewing: Sort/filter tasks effectively.
- User Story 9 — Search Tasks: Find tasks by keyword.  

---

# Epic 4 — Notifications, Export/Import & Task Organization

## Description / Acceptance
This epic introduces notifications, CSV export/import, and task organization features. Users are reminded before deadlines, can categorize tasks, and export/import data safely. All data must persist reliably across app restarts. This improves productivity and overall task management efficiency.

**Associated User Stories:**  
- User Story 10 — Notifications: Trigger reminders at correct time.
- User Story 11 — Task Categories/Tags: Organize tasks with categories.  

---

# Epic 5 — AI Chatbot

## Description / Acceptance
This epic enables users to manage tasks using natural language commands. The AI chatbot can create or query tasks and provide intelligent suggestions. Privacy options ensure data security, and commands are parsed accurately. This feature enhances productivity by reducing manual input and guiding task management.

**Associated User Stories:**  
- User Story 12 — Intelligent Suggestions: Suggest deadlines/priorities via AI.  

---

# Epic 6 — Advanced Features & Final Release

## Description / Acceptance
This epic focuses on advanced functionality and final polish for release. Features include recurring tasks, subtasks, improved filters, onboarding guides, and installer packaging. The system ensures performance, security, and multi-device support. Documentation explains workflows clearly, preparing the app for professional release.

**Associated User Stories:**  
User Story 13 — Multi-Device Access (Future): Sync tasks across devices. 
