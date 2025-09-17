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
