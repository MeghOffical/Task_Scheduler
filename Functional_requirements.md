# Functional Requirements (FR)

## FR-01 - User Login

**Description:**\
A registered user can log in using their email and password. The system
validates credentials and prevents unauthorized access.

**Acceptance:**\
If credentials are correct, the user is redirected to the dashboard. If
incorrect, an error message is shown. Login sessions persist until
logout.

**Identified by:**\
Stakeholder analysis, interviews, and task observation.

------------------------------------------------------------------------

## FR-02 - User Registration

**Description:**\
A new user can register by providing their name, email, and password.
Optionally, the user can select their role (Student / Professional /
Freelancer). Passwords must meet basic security rules.

**Acceptance:**\
After registration, the user receives a success message and can log in
immediately. The user data is stored securely in the local database.

**Identified by:**\
Questionnaires, interviews, and stakeholder analysis.

------------------------------------------------------------------------

## FR-03 - Create Task

**Description:**\
A new task can be created by the user and include a title, optional
description, priority, deadline (date and time), and optional tags.

**Acceptance:**\
The task immediately shows up on the dashboard and persists to the local
database.

**Identified by:**\
Task observation, interviews, questionnaires, and stakeholder analysis.  

------------------------------------------------------------------------

## FR-04 - Password Recovery 

**Description:**\ 
Users can reset their password if they forget it, using their registered email.
A temporary link or OTP is sent to verify identity.

**Acceptance:**\
Users can set a new password, and the system updates the database securely.
An email confirmation is sent after successful reset.

**Identified by:**\
Task observation, interviews, questionnaires, and stakeholder analysis.

------------------------------------------------------------------------

## FR-05 - Read / View Tasks 

**Description:**  
Provide a clear, uncluttered dashboard with a progress summary, past-due tasks, and upcoming tasks.

**Acceptance:**  
Dashboard updates within 1s after any change; shows correct counts (upcoming/overdue).

**Identified by:**  
Project vision in PDF, prototyping, and interviews.

------------------------------------------------------------------------


## FR-06 - Update Task 

**Description:**  
Any task fields (title, description, priority, deadline, tags, and completed status) can be edited.

**Acceptance:**  
Modifications are instantly reflected in the dashboard and saved to the local database.

**Identified by:**  
Stakeholder analysis, interviews.

------------------------------------------------------------------------

## FR-07 - Filtering & Searching Tasks

**Description:**  
You can search by keywords, tag, priority, or date range.

**Acceptance:**  
On moderate data sets, filters are applied within 0.5–1 seconds.

**Identified by:**  
Interviews, prototyping, power-user feedback.

------------------------------------------------------------------------

## FR-08 - Delete Task

**Description:**  
Task removal (with undo option for unintentional deletions).

**Acceptance:**  
Deleted tasks are no longer visible or in the database; they can be undone in a brief period of time.

**Identified by:**  
Stakeholder analysis, questionnaires.

------------------------------------------------------------------------
------------------------------------------------------------------------

## FR-09 - Export / Import (CSV)

**Description:**  
To populate tasks, export task lists to CSV and perform a basic import, beneficial to independent contractors.

**Acceptance:**  
Essential fields are included in the export, and duplicates are verified in the import.

**Identified by:**  
Interviews (freelancers), pilot requests.

------------------------------------------------------------------------

## FR-10 - Notifications / Reminders (Local)

**Description:**  
Notifications or reminders for approaching deadlines on a local desktop.

**Acceptance:**  
While the app is running, notifications reliably fire at predetermined times (and optionally via OS notification system).

**Identified by:**  
Questionnaires, task observation.

------------------------------------------------------------------------


## FR-11 - Logout 

**Description:**  
Logged-in users can log out from the system at any time.

**Acceptance:**  
User session ends immediately, and the dashboard is no longer accessible without login.

**Identified by:**  
Stakeholder analysis and task observation.

------------------------------------------------------------------------
