//let users = {};
// let currentUser = null;
// let tasks = {};
let editingTaskId = null;
let userTasksCache = [];
// NEW RENDER TASKS FUNCTION
// FULL RENDER TASKS FUNCTION (with Deadline Tracking)
async function renderTasks() {
  const taskList = document.getElementById("taskList");
  const token = localStorage.getItem('token');
 // let userTasks = [];

  try {
    // 1. Fetch tasks
    const response = await fetch('http://localhost:3000/api/tasks', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Failed to fetch tasks");
    userTasksCache = await response.json();

  } catch (error) {
    console.error("Error fetching tasks:", error);
    taskList.innerHTML = `<div class="empty-state"><p>Could not load your tasks. Please log in again.</p></div>`;
    return;
  }
  
  // 2. Handle no tasks
  if (userTasksCache.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <p>No tasks found. Add your first task to get started!</p>
        <button class="btn btn-primary" onclick="document.getElementById('taskTitle').focus()">Add Task</button>
      </div>
    `;
    return;
  }
  
  // 3. Get filter values (This is your original code)
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const priorityFilter = document.getElementById("priorityFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;
  
  let filteredTasks = userTasksCache.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm) || 
                          task.description.toLowerCase().includes(searchTerm);
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const matchesStatus = !statusFilter || task.status === statusFilter;
    
    return matchesSearch && matchesPriority && matchesStatus;
  });
  
  // 4. Handle no filtered tasks (Your original code)
  if (filteredTasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>No tasks match your filters. Try adjusting your search criteria.</p>
        <button class="btn btn-secondary" onclick="clearFilters()">Clear Filters</button>
      </div>
    `;
    return;
  }
  
  // 5. Render tasks
  const now = new Date(); // Get the current time *once*

  taskList.innerHTML = filteredTasks.map(task => {
    
    // --- THIS IS THE NEW LOGIC YOU ASKED ABOUT ---
    const dueDate = new Date(task.dueDate);
    let overdueClass = '';

    // Check if due date exists, is in the past, AND task is not completed
    if (task.dueDate && dueDate < now && task.status !== 'completed') {
      overdueClass = 'overdue';
    }
    // --- END OF NEW LOGIC ---

    // Now, we add the 'overdueClass' to the div
    return `
      <div class="task-item ${overdueClass} ${task.priority}-priority ${task.status === 'completed' ? 'completed' : ''}">
        <div class="task-header">
          <div class="task-title">${task.title}</div>
          <div class="task-actions">
            <button class="task-btn complete" onclick="toggleTaskStatus('${task.id}')" title="Mark as ${task.status === 'completed' ? 'pending' : 'completed'}">
              ${task.status === 'completed' ? '↶' : '✓'}
            </button>
            <button class="task-btn edit" onclick="editTask('${task.id}')" title="Edit task">✏</button>
            <button class="task-btn delete" onclick="deleteTask('${task.id}')" title="Delete task">🗑</button>
          </div>
        </div>
        <div class="task-meta">
          <span class="task-priority ${task.priority}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority</span>
          <span class="task-status ${task.status}">${formatStatus(task.status)}</span>
          ${task.dueDate ? `<span class="task-date">📅 ${formatDate(task.dueDate)}</span>` : ''}
        </div>
        <div class="task-description">${task.description}</div>
      </div>
    `;
  }).join('');

  updateStats();
}
function showLogin() {
  document.getElementById("loginModal").classList.remove("hidden");
  document.getElementById("registerModal").classList.add("hidden");
}

function showRegister() {
  document.getElementById("registerModal").classList.remove("hidden");
  document.getElementById("loginModal").classList.add("hidden");
}

function switchToLogin() {
  document.getElementById("registerModal").classList.add("hidden");
  document.getElementById("loginModal").classList.remove("hidden");
}

function switchToRegister() {
  document.getElementById("loginModal").classList.add("hidden");
  document.getElementById("registerModal").classList.remove("hidden");
}

function closeAuthModals() {
  document.getElementById("loginModal").classList.add("hidden");
  document.getElementById("registerModal").classList.add("hidden");
}

function togglePassword(fieldId, eyeIcon) {
  let field = document.getElementById(fieldId);
  if (field.type === "password") {
    field.type = "text";
    eyeIcon.textContent = "🙈";
  } else {
    field.type = "password";
    eyeIcon.textContent = "👁";
  }
}

function toggleOtherProfession() {
  const prof = document.getElementById("regProfession").value;
  const otherField = document.getElementById("otherProfession");
  if (prof === "Other") {
    otherField.classList.remove("hidden");
  } else {
    otherField.classList.add("hidden");
    otherField.value = "";
  }
}

function validatePassword(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// This is the NEW register function
async function register() {
  let user = document.getElementById("regUser").value.trim();
  let email = document.getElementById("regEmail").value.trim();
  let prof = document.getElementById("regProfession").value.trim();
  let otherProf = document.getElementById("otherProfession").value.trim();
  let pass = document.getElementById("regPass").value.trim();
  let confirmPass = document.getElementById("regConfirmPass").value.trim();
  let msg = document.getElementById("regMsg");

  // --- All your frontend validation stays the same ---
  if (!user || !email || !prof || !pass || !confirmPass || (prof === "Other" && !otherProf)) {
    msg.innerHTML = "❌ Please fill all fields correctly";
    msg.className = "error";
    return;
  }
  if (!validateEmail(email)) { /* ... */ }
  if (!validatePassword(pass)) { /* ... */ }
  if (pass !== confirmPass) { /* ... */ }
  // --- End of validation ---

  let professionFinal = prof === "Other" ? otherProf : prof;

  try {
    // --- THIS IS THE NEW PART ---
    // Send the data to your backend server
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: user,
        email: email,
        password: pass,
        profession: professionFinal
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Show error message from the server (e.g., "Username already exists")
      msg.innerHTML = `❌ ${data.message}`;
      msg.className = "error";
      return;
    }
    // --- END OF NEW PART ---

    msg.innerHTML = "✅ Registration successful! Redirecting to login...";
    msg.className = "success";

    setTimeout(() => {
      closeAuthModals();
      showLogin();
    }, 1500);

  } catch (error) {
    // This catches network errors (e.g., backend is down)
    console.error('Registration error:', error);
    msg.innerHTML = "❌ Could not connect to server.";
    msg.className = "error";
  }
}

// This is the NEW login function
async function login() {
  // NOTE: Your login form uses 'loginUser' as the ID for the email/username
  let userEmail = document.getElementById("loginUser").value.trim();
  let pass = document.getElementById("loginPass").value.trim();
  let msg = document.getElementById("loginMsg");

  try {
    // --- THIS IS THE NEW PART ---
    // Send the login data to your backend
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userEmail,
        password: pass
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Show error message from the server (e.g., "Invalid credentials")
      msg.innerHTML = `❌ ${data.message}`;
      msg.className = "error";
      return;
    }

    // --- SUCCESS! ---
    // Save the token and username from the server
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);
    // --- END OF NEW PART ---

    msg.innerHTML = "✅ Login successful! Welcome back!";
    msg.className = "success";

    setTimeout(() => {
      closeAuthModals();
      showDashboard();
    }, 1000);

  } catch (error) {
    console.error('Login error:', error);
    msg.innerHTML = "❌ Could not connect to server.";
    msg.className = "error";
  }
}

// NEW showDashboard FUNCTION
function showDashboard() {
  document.getElementById("introSection").style.display = "none";
  document.getElementById("mainHeader").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  
  // This is the fix for "currentUser is not defined"
  document.getElementById("dashboardUsername").textContent = localStorage.getItem('username');
  
  // This fetches tasks from your backend
  renderTasks(); 
  
  // We'll fix updateStats later
   updateStats();
  
  // Animate the chatbot button
  const chatbotToggle = document.getElementById('chatbotToggle');
  chatbotToggle.style.animation = 'pulse 1.5s infinite';
  setTimeout(() => {
    chatbotToggle.style.animation = '';
  }, 4500);
}
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
//  currentUser = null;
  editingTaskId = null;
  
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("introSection").style.display = "flex";
  document.getElementById("mainHeader").style.display = "flex";
  
  // Reset form
  document.getElementById("taskForm").reset();
  document.getElementById("formTitle").textContent = "Add New Task";
  document.getElementById("submitBtn").textContent = "Add Task";
  document.getElementById("cancelBtn").style.display = "none";
}


function formatStatus(status) {
  const statusMap = {
    'pending': 'Pending',
    'in-progress': 'In Progress',
    'completed': 'Completed'
  };
  return statusMap[status] || status;
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

function filterTasks() {
  renderTasks();
}

function clearFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("priorityFilter").value = "";
  document.getElementById("statusFilter").value = "";
  renderTasks();
}

// NEW ADD/UPDATE TASK FUNCTION
// NEW ADD/UPDATE TASK FUNCTION (with Edit logic)
async function addOrUpdateTask(e) {
  e.preventDefault(); 
  
  const title = document.getElementById("taskTitle").value.trim();
  const description = document.getElementById("taskDescription").value.trim();
  const priority = document.getElementById("taskPriority").value;
  const status = document.getElementById("taskStatus").value;
  const dueDate = document.getElementById("taskDueDate").value;
  
  if (!title) {
    alert("Please enter a task title");
    return;
  }
  
  const taskData = { title, description, priority, status, dueDate };
  const token = localStorage.getItem('token');
  
  try {
    let response;
    if (editingTaskId) {
      // --- THIS IS THE NEW EDIT LOGIC ---
      response = await fetch(`http://localhost:3000/api/tasks/${editingTaskId}`, {
        method: 'PUT', // PUT means "Update"
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      // --- END OF NEW LOGIC ---

    } else {
      // This is your existing "Add Task" logic
      response = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
    }

    if (!response.ok) {
      throw new Error("Failed to save task");
    }
    
    cancelEdit(); // This also resets the form
    renderTasks(); // Re-fetch and render all tasks
    
  } catch (error) {
    console.error("Error saving task:", error);
    alert("Could not save task. Please try again.");
  }
}

// NEW editTask FUNCTION
function editTask(id) {
  // This is the fix: It finds the task in our new cache
  const task = userTasksCache.find(task => task.id === id); 
  if (!task) return;
  
  // This part is the same as your old function
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDescription").value = task.description;
  document.getElementById("taskPriority").value = task.priority;
  document.getElementById("taskStatus").value = task.status;
  
  // This handles the datetime-local input
  document.getElementById("taskDueDate").value = task.dueDate ? task.dueDate.slice(0, 16) : "";
  
  document.getElementById("formTitle").textContent = "Edit Task";
  document.getElementById("submitBtn").textContent = "Update Task";
  document.getElementById("cancelBtn").style.display = "inline-block";
  
  editingTaskId = id;
  
  // Scroll to form
  document.getElementById("taskForm").scrollIntoView({ behavior: 'smooth' });
}
function cancelEdit() {
  document.getElementById("taskForm").reset();
  document.getElementById("formTitle").textContent = "Add New Task";
  document.getElementById("submitBtn").textContent = "Add Task";
  document.getElementById("cancelBtn").style.display = "none";
  editingTaskId = null;
}

// NEW deleteTask FUNCTION
async function deleteTask(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      renderTasks(); // Refresh the task list

    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Could not delete task.");
    }
  }
}

// NEW toggleTaskStatus FUNCTION
async function toggleTaskStatus(id) {
  // 1. Find the task in our cache to know its current status
  // We need the userTasksCache to be up-to-date for this to work
  const task = userTasksCache.find(task => task.id === id);
  if (!task) return;

  // 2. Determine the new status
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';

  try {
    const token = localStorage.getItem('token');
    
    // 3. Send the API request
    const response = await fetch(`http://localhost:3000/api/tasks/${id}/status`, {
      method: 'PATCH', // PATCH is standard for partial updates
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus }) // Send only the new status
    });

    if (!response.ok) {
      throw new Error("Failed to update status");
    }

    // 4. Refresh the list to show the change
    renderTasks();
   //  updateStats(); // We'll fix this last

  } catch (error) {
    console.error("Error toggling task status:", error);
    alert("Could not update task status.");
  }
}

// NEW exportTasks FUNCTION
function exportTasks() {
  // 1. Get the current tasks from our cache
  if (userTasksCache.length === 0) {
    alert("No tasks to export");
    return;
  }
  
  // 2. This is your exact same CSV logic from before
  const headers = ['id', 'title', 'description', 'priority', 'status', 'dueDate', 'createdAt'];
  const csvData = userTasksCache.map(task => [
    task.id,
    `"${task.title.replace(/"/g, '""')}"`,
    `"${task.description.replace(/"/g, '""')}"`,
    task.priority,
    task.status,
    task.dueDate || '',
    task.createdAt
  ]);
  
  const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
  
  // 3. This is your exact same download logic
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Get username for the file name
  const username = localStorage.getItem('username') || 'user';
  a.download = `planit-tasks-${username}-${new Date().toISOString().split('T')[0]}.csv`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// NEW importTasks FUNCTION
async function importTasks() {
  try {
    // 1. Create a hidden file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv'; // Only accept CSV files
    fileInput.style.display = 'none';

    // 2. Listen for when a file is chosen
    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) {
        return; // User cancelled
      }

      // 3. Create FormData to send the file
      const formData = new FormData();
      formData.append('csvfile', file); // 'csvfile' must match multer on backend

      // 4. Send the file to the backend
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/tasks/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // NOTE: Do NOT set 'Content-Type'. The browser sets it
          // automatically to 'multipart/form-data' for FormData.
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Import failed");
      }

      // 5. Success! Refresh the task list
      alert(data.message);
      renderTasks();
    };

    // 6. Click the hidden input to open the file dialog
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);

  } catch (error) {
    console.error("Error importing tasks:", error);
    alert(`Import failed: ${error.message}`);
  }
}
// LLM Chatbot Functions
function toggleChatbot() {
  const chatbotContainer = document.getElementById('chatbotContainer');
  chatbotContainer.classList.toggle('open');
}

function closeChatbot() {
  const chatbotContainer = document.getElementById('chatbotContainer');
  chatbotContainer.classList.remove('open');
}

// NEW sendMessage FUNCTION
async function sendMessage() {
  const input = document.getElementById('chatbotInput');
  const message = input.value.trim();
  
  if (message) {
    addMessage(message, 'user'); // Show the user's message
    input.value = ''; // Clear the input
    
    try {
      // 1. Send the user's message to the backend
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: message })
      });

      if (!response.ok) {
        throw new Error("AI is not responding.");
      }

      const data = await response.json();
      
      // 2. Add the AI's response to the chat
      addMessage(data.message, 'bot');

    } catch (error) {
      console.error("Chatbot error:", error);
      addMessage("I'm having trouble connecting right now. Please try again later.", 'bot');
    }
  }
}

function sendSuggestion(suggestion) {
  document.getElementById('chatbotInput').value = suggestion;
  sendMessage();
}

function addMessage(text, sender) {
  const messagesContainer = document.getElementById('chatbotMessages');
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', sender);
  messageElement.textContent = text;
  messagesContainer.appendChild(messageElement);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}



// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById("taskForm").addEventListener("submit", addOrUpdateTask);
  document.getElementById("cancelBtn").addEventListener("click", cancelEdit);
  document.getElementById("searchInput").addEventListener("input", renderTasks);
  
  // Chatbot event listeners
  document.getElementById("chatbotToggle").addEventListener("click", toggleChatbot);
  document.getElementById("chatbotClose").addEventListener("click", closeChatbot);
  document.getElementById("chatbotSend").addEventListener("click", sendMessage);
  document.getElementById("chatbotInput").addEventListener("keypress", function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
});

// Close modals when clicking outside
document.addEventListener('click', function(event) {
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  
  if (event.target === loginModal || event.target === registerModal) {
    closeAuthModals();
  }
});


// NEW updateStats FUNCTION
async function updateStats() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }

    const stats = await response.json();

    // Update the dashboard cards with the new numbers
    document.getElementById("totalTasks").textContent = stats.totalTasks;
    document.getElementById("completedTasks").textContent = stats.completedTasks;
    document.getElementById("pendingTasks").textContent = stats.pendingTasks;
    document.getElementById("highPriorityTasks").textContent = stats.highPriorityTasks;

  } catch (error) {
    console.error("Error fetching stats:", error);
    // We don't show an alert, just log the error
  }
}

// --- ADD THIS AT THE VERY BOTTOM of main.js ---
// This makes your onclick="" functions work with Vite

window.showLogin = showLogin;
window.showRegister = showRegister;
window.switchToLogin = switchToLogin;
window.switchToRegister = switchToRegister;
window.togglePassword = togglePassword;
window.toggleOtherProfession = toggleOtherProfession;
window.register = register;
window.login = login;
window.logout = logout;
window.filterTasks = filterTasks;
window.exportTasks = exportTasks;
window.importTasks = importTasks;
window.toggleTaskStatus = toggleTaskStatus;
window.editTask = editTask;
window.deleteTask = deleteTask;
window.sendSuggestion = sendSuggestion;
window.clearFilters = clearFilters;

// --- Also add this for the chatbot functions ---
window.toggleChatbot = toggleChatbot;
window.closeChatbot = closeChatbot;
window.sendMessage = sendMessage;
window.addOrUpdateTask = addOrUpdateTask;