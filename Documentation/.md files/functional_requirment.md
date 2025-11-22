# Functional Requirements (FR)

## FR-01 - User Login

Description:  
A registered user can log in using their email and password. The system validates credentials and prevents unauthorized access.

Acceptance:  
If credentials are correct, the user is redirected to the dashboard. If incorrect, an error message is shown. Login sessions persist until logout.

Identified by:  
Stakeholder analysis, interviews, and task observation.

------------------------------------------------------------------------

## FR-02 - User Registration

Description:  
A new user can register by providing their name, email, and password. Optionally, the user can select their role (Student / Professional / Freelancer). Passwords must meet basic security rules.

Acceptance:  
After registration, the user receives a success message and can log in immediately. The user data is stored securely in the local database.

Identified by:  
Questionnaires, interviews, and stakeholder analysis.

------------------------------------------------------------------------

## FR-03 - Create Task

Description:  
A new task can be created by the user and include a title, optional description, priority, deadline (date and time), and optional tags.

Acceptance:  
The task immediately shows up on the dashboard and persists to the local database.

Identified by:  
Task observation, interviews, questionnaires, and stakeholder analysis.  

------------------------------------------------------------------------

## FR-04 - Password Recovery

Description:  
Users can reset their password if they forget it, using their registered email. A temporary link or OTP is sent to verify identity.

Acceptance:  
Users can set a new password, and the system updates the database securely. An email confirmation is sent after successful reset.

Identified by:  
Task observation, interviews, questionnaires, and stakeholder analysis.

------------------------------------------------------------------------

## FR-05 - Read / View Tasks

Description:  
Provide a clear, uncluttered dashboard with a progress summary, past-due tasks, and upcoming tasks.

Acceptance:  
Dashboard updates within 1 second after any change; shows correct counts (upcoming/overdue).

Identified by:  
Project vision in PDF, prototyping, and interviews.

------------------------------------------------------------------------

## FR-06 - Update Task

Description:  
Any task fields (title, description, priority, deadline, tags, and completed status) can be edited.

Acceptance:  
Modifications are instantly reflected in the dashboard and saved to the local database.

Identified by:  
Stakeholder analysis, interviews.

------------------------------------------------------------------------

## FR-07 - Filtering & Searching Tasks

Description:  
You can search by keywords, tag, priority, or date range.

Acceptance:  
On moderate data sets, filters are applied within 0.5–1 second.

Identified by:  
Interviews, prototyping, power-user feedback.

------------------------------------------------------------------------

## FR-08 - Delete Task

Description:  
Task removal with an undo option for unintentional deletions.

Acceptance:  
Deleted tasks are no longer visible or in the database, but they can be undone for a brief period.

Identified by:  
Stakeholder analysis, questionnaires.

------------------------------------------------------------------------

## FR-09 - Export / Import (CSV)

Description:  
Users can export task lists to CSV and perform a basic import, which is useful for independent contractors.

Acceptance:  
Essential fields are included in the export, and duplicates are verified during import.

Identified by:  
Interviews (freelancers), pilot requests.

------------------------------------------------------------------------

## FR-10 - Notifications / Reminders (Local)

Description:  
Notifications or reminders for approaching deadlines on a local desktop.

Acceptance:  
While the app is running, notifications reliably fire at predetermined times (and optionally via the operating system's notification system).

Identified by:  
Questionnaires, task observation.

------------------------------------------------------------------------

## FR-11 - Recurring Tasks

Description:  
Encourage regular patterns of recurrence (daily, weekly, custom).

Acceptance:  
Recurrence generates and displays the subsequent instance according to the defined rule.

Identified by:  
Roadmap in PDF, interviews with students and professionals.

------------------------------------------------------------------------

## FR-12 - Sub-tasks / Task Hierarchy

Description:  
For complicated projects, permit parent/child task nesting.

Acceptance:  
Subtasks report progress to the parent; the user interface manages collapsing and expanding.

Identified by:  
Brainstorming, power-user sessions.

------------------------------------------------------------------------

## FR-13 - Simple Time-Tracking per Task (Freelancer Use)

Description:  
Set a timer to start and stop a task and record the amount of time spent.

Acceptance:  
The timer persists across app restarts and can be exported.

Identified by:  
Freelancer interviews and focus groups.

------------------------------------------------------------------------

## FR-14 - Task Priority Assignment

Description:  
Users can assign a priority level (High / Medium / Low) to each task they create. The priority helps in sorting, filtering, and highlighting tasks on the dashboard.

Acceptance:  
When a task is created or edited, the selected priority is saved in the local database. Tasks are visually distinguished by priority (e.g., color coding or icons). Users can filter or sort tasks by priority.

Identified by:  
Task observation, stakeholder and user questionnaires.

------------------------------------------------------------------------

## FR-15 - AI Chatbot Assistant

Description:  
An in-app conversational assistant helps users manage tasks via natural language: create/update/delete tasks, set reminders, query upcoming/overdue tasks, suggest priority or scheduling, and answer simple how-to questions about the app.

Acceptance:  
AI assists users in managing tasks efficiently.

Identified by:  
Brainstorming, interviews, prototyping.

------------------------------------------------------------------------

## FR-16 - Local Data Persistence (Local DB)

Description:  
All user data is stored locally (SQLite or equivalent) and survives app restarts.

Acceptance:  
No data loss occurs across restarts or OS sleep/wake cycles; there is a migration path for database schema changes.

Identified by:  
PDF priority (explicit), JAD, risk analysis.

------------------------------------------------------------------------

## FR-17 - Logout

Description:  
Logged-in users can log out from the system at any time.

Acceptance:  
User session ends immediately, and the dashboard is no longer accessible without logging in again.

Identified by:  
Stakeholder analysis and task observation.

------------------------------------------------------------------------
