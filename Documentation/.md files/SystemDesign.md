## System Design: Complete Architecture of the PLAN-IT 

This Design explains the **overall structure** of the PLAN-IT application. The system design shows how the UI, API, Services, and Database layers work together to deliver all major features such as authentication, task management, analytics, Pomodoro flow, notifications, and chatbot support.

The architecture is designed to be **modular, secure, scalable**, and easy to maintain across all sprints.

---

### System Architecture Diagram  
<img width="2940" height="689" alt="SystemDesign drawio" src="https://github.com/user-attachments/assets/8ca0b2dd-d424-4d82-ba6e-5cbba9b0198f" />

---

## Key Architecture Layers

---

## Frontend Layer

This layer handles everything the user sees or interacts with.

### Key Components Implemented

* **Task UI:** Create, edit, delete tasks and update status & priority  
* **Auth UI:** Login, Register, Forgot Password  
* **Analytics UI:** Priority breakdown, overdue tasks, and statistics  
* **AI Chat UI:** Chatbot interface for user interaction  
* **Routing System:** Smooth navigation across screens  

---

## Backend API Layer

This layer exposes REST API endpoints used by the frontend to communicate with backend logic.

### Key API Endpoints

* **`/api/tasks/*`** → Task creation, editing, deletion, status update  
* **`/api/auth/*`** → Login, registration, JWT validation  
* **`/api/analytics`** → Priority breakdown, overdue tasks  
* **`/api/chatbot`** → AI chatbot integration  
* **`/api/settings`** → User preferences  

### Middleware Used

* **JWT Authentication**  
* **Input Validation**  

---

## Service Layer

This contains the **core business logic** of PLAN-IT.

### Key Services Implemented

* **Auth Service:**  
  Handles signup, login, password hashing, token creation  

* **Task Service:**  
  Task CRUD, editing, status transitions, priority updates  

* **Analytics Service:**  
  Priority distribution, total task count, overdue detection  

* **Chatbot / AI Service:**  
  Generates responses for AI chat  

---

## Database Layer

Stores all permanent data required by the application.

### Models Used

* **User Model**  
* **Task Model**  
* **Notification Model**  
* **ChatThread Model**  
* **Settings Model**  

---

## Functional Requirements Supported

* Task Create–Read–Update–Delete  
* User authentication  
* Task status & priority management  
* Pomodoro timer workflow  
* Dashboard analytics  
* Chatbot integration  
* User notifications  
* User settings & preferences  

---

## Non-Functional Requirements Supported

* **Security:** JWT Auth, input validation  
* **Performance:** Optimized API & service handling  
* **Reliability:** Layered architecture ensures stability  
* **Offline Support:** UI can cache essential data  
* **Scalability:** Services can scale independently  

---
