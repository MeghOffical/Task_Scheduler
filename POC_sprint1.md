# POC — Sprint 1

## Objective

The first sprint POC demonstrates the basic onboarding workflow of PlanIt using web technologies (HTML, CSS, JavaScript). The focus is on user registration, login validation, and introduction to the dashboard, without full task management features.

## Features Covered in Sprint 1

### 1. User Registration

**Description:** Users can create an account by entering name, email, and password. Optionally, role selection (Student / Professional / Freelancer) is included.

**Implementation (POC):**

* HTML form captures user details.
* JavaScript validates fields (required, email format, password rules).
* Registration data is temporarily stored using localStorage for demonstration purposes.
* Confirmation message appears on successful registration.

### 2. User Login

**Description:** Registered users can log in to access their dashboard.

**Implementation (POC):**

* Login form validates credentials against stored data in localStorage.
* Error messages display for incorrect or missing credentials.
* On success, users are redirected to the dashboard page.

### 3. Introduction / Dashboard Preview

**Description:** After login, users are introduced to the dashboard interface.

**Implementation (POC):**

* Dashboard displays mock task list (placeholder tasks).
* Includes summary metrics like "Total Tasks" and "Upcoming Tasks".
* Minimal UI components: navigation menu, create task button (non-functional in Sprint 1).
* Optionally, a welcome message or tutorial modal guides first-time users.
