# Chatbot Backend Integration Guide

## Overview

The chatbot backend has been enhanced with **task management tools** that integrate seamlessly with your Next.js Task Scheduler application. The AI assistant can now create, update, delete, and retrieve tasks on behalf of users through natural language conversation.

---

## 📁 File Structure

```
Chatbot/
├── main_backend.py              # Enhanced LangGraph chatbot with task tools
├── task_tools_helpers.py        # Helper functions for task validation and formatting
├── chatbot_api_bridge.py        # Python API bridge for Next.js integration
├── main_frontend.py             # Streamlit frontend (existing)
├── requirements.txt             # Updated Python dependencies
└── README_INTEGRATION.md        # This file
```

---

## 🔧 What Changed

### 1. **Enhanced `main_backend.py`**

#### Added Imports:
```python
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
```

#### New MongoDB Connection:
```python
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/task_scheduler')
mongo_client = MongoClient(MONGODB_URI)
db = mongo_client.get_database()
```

#### New Task Management Tools:

1. **`create_task`** - Create new tasks
   - Parameters: title, description, priority, status, due_date, start_time, end_time, user_id
   - Returns: Created task details or error

2. **`update_task`** - Update existing tasks
   - Parameters: task_id, title, description, priority, status, due_date, start_time, end_time, user_id
   - Returns: Updated task details or error

3. **`delete_task`** - Delete tasks
   - Parameters: task_id, user_id
   - Returns: Success message or error

4. **`get_tasks`** - Retrieve and filter tasks
   - Parameters: status, priority, search_query, user_id
   - Returns: List of matching tasks

#### Updated Tools List:
```python
tools = [get_tasks, create_task, update_task, delete_task, get_stock_price, calculator]
llm_with_tools = llm.bind_tools(tools)
```

---

### 2. **New `task_tools_helpers.py`**

Provides helper utilities:

- **`TaskToolsContext`**: Context manager for MongoDB and user authentication
- **`validate_task_data()`**: Validate task inputs before database operations
- **`format_task_response()`**: Format MongoDB documents for API responses
- **`get_task_statistics()`**: Calculate task statistics by status and priority
- **`suggest_task_priorities()`**: AI-powered task prioritization suggestions

---

### 3. **New `chatbot_api_bridge.py`**

Python API bridge for Next.js integration:

#### `ChatbotAPIBridge` Class Methods:

1. **`send_message(message, thread_id, user_id)`**
   - Send a message and get response
   - Handles tool calls automatically

2. **`stream_message(message, thread_id, user_id)`**
   - Stream responses in real-time
   - Yields chunks with type indicators

3. **`get_thread_messages(thread_id)`**
   - Retrieve conversation history

4. **`list_threads()`**
   - Get all thread IDs

5. **`clear_thread(thread_id)`**
   - Clear conversation history

---

## 🚀 Integration with Next.js

### Option 1: Python Microservice (Recommended)

Create a separate Python Flask/FastAPI service:

```python
# chatbot_service.py
from flask import Flask, request, jsonify
from chatbot_api_bridge import chatbot_bridge

app = Flask(__name__)

@app.route('/api/chatbot/message', methods=['POST'])
def chat_message():
    data = request.json
    message = data.get('message')
    thread_id = data.get('thread_id')
    user_id = data.get('user_id')
    
    response = chatbot_bridge.send_message(message, thread_id, user_id)
    return jsonify(response)

@app.route('/api/chatbot/stream', methods=['POST'])
def chat_stream():
    data = request.json
    message = data.get('message')
    thread_id = data.get('thread_id')
    user_id = data.get('user_id')
    
    def generate():
        for chunk in chatbot_bridge.stream_message(message, thread_id, user_id):
            yield f"data: {json.dumps(chunk)}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(port=5000)
```

### Option 2: Next.js API Route with Python Child Process

```typescript
// src/app/api/chatbot/message/route.ts
import { NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import { spawn } from 'child_process';

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { message, thread_id } = await request.json();

    // Call Python chatbot via child process
    const pythonProcess = spawn('python', [
      'Chatbot/chatbot_api_bridge.py',
      'chat',
      message,
      thread_id,
      userId
    ]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0) reject(new Error('Python process failed'));
        else resolve(null);
      });
    });

    const result = JSON.parse(dataString);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { message: 'Error processing message' },
      { status: 500 }
    );
  }
}
```

---

## 🔐 Authentication & User Context

### Setting User ID

The chatbot needs to know which user is making requests. There are two approaches:

#### Approach 1: Environment Variable (Development)
```bash
# .env
DEFAULT_USER_ID=507f1f77bcf86cd799439011
```

#### Approach 2: Dynamic User Context (Production)

Modify `main_backend.py`:

```python
# Global user context (thread-safe)
from threading import local
_user_context = local()

def get_current_user_id():
    return getattr(_user_context, 'user_id', None)

def set_current_user_id(user_id: str):
    _user_context.user_id = user_id
```

Call `set_current_user_id()` before processing each request.

---

## 📝 Example Conversations

### Creating a Task
**User:** "Create a task to finish the project report by November 20th with high priority"

**AI:** "I'll create that task for you."
- Calls `create_task(title="Finish project report", priority="high", due_date="2025-11-20")`
- Returns: "Task created successfully! I've added 'Finish project report' as a high-priority task due on November 20th."

### Listing Tasks
**User:** "Show me all my pending high-priority tasks"

**AI:** "Let me check your tasks."
- Calls `get_tasks(status="pending", priority="high")`
- Returns: "You have 3 pending high-priority tasks: 1. Finish project report (due Nov 20), 2. Review code changes (due Nov 18), 3. Update documentation (due Nov 22)"

### Updating a Task
**User:** "Mark the project report task as in progress"

**AI:** "I'll update that task."
- Calls `get_tasks(search_query="project report")` to find the task ID
- Calls `update_task(task_id="...", status="in-progress")`
- Returns: "Updated! The 'Finish project report' task is now marked as in-progress."

### Deleting a Task
**User:** "Delete the documentation task"

**AI:** "I'll remove that task."
- Calls `get_tasks(search_query="documentation")`
- Calls `delete_task(task_id="...")`
- Returns: "Task deleted successfully!"

---

## 🔌 Environment Variables

Update your `.env` file:

```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/task_scheduler

# Google AI (existing)
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

# User Context (optional for development)
DEFAULT_USER_ID=507f1f77bcf86cd799439011

# Next.js URL (for internal API calls)
NEXTAUTH_URL=http://localhost:3000
```

---

## 📦 Installation

1. **Install Python Dependencies:**

```bash
cd planit-next/Chatbot
pip install -r requirements.txt
```

2. **Verify MongoDB Connection:**

```bash
python -c "from pymongo import MongoClient; print(MongoClient('mongodb://localhost:27017/task_scheduler').admin.command('ping'))"
```

3. **Test Chatbot:**

```bash
python chatbot_api_bridge.py chat "Show me my tasks" test-thread-123 YOUR_USER_ID
```

---

## 🧪 Testing

### Test Task Creation:
```bash
python chatbot_api_bridge.py chat "Create a task called Test Task with high priority" test-thread-456 YOUR_USER_ID
```

### Test Task Retrieval:
```bash
python chatbot_api_bridge.py chat "Show all my high priority tasks" test-thread-456 YOUR_USER_ID
```

### Test Thread History:
```bash
python chatbot_api_bridge.py history test-thread-456
```

---

## 🛠️ Troubleshooting

### Issue: "User not authenticated"
- Ensure `DEFAULT_USER_ID` is set in `.env` or pass `user_id` in API calls
- Verify the user ID exists in MongoDB's `users` collection

### Issue: "Failed to connect to MongoDB"
- Check `MONGODB_URI` in `.env`
- Ensure MongoDB is running: `mongod` or Docker container

### Issue: "Tool not found" or tools not executing
- Verify tools are in the `tools` list: `tools = [get_tasks, create_task, ...]`
- Check LLM binding: `llm_with_tools = llm.bind_tools(tools)`

### Issue: Invalid ObjectId
- Ensure user IDs and task IDs are valid 24-character hex strings
- Use `str(object_id)` when passing to functions

---

## 🎨 Frontend Integration (Next.js Page)

```typescript
// src/app/chatbot/page.tsx
'use client';

import { useState } from 'react';

export default function ChatbotPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [threadId] = useState(() => crypto.randomUUID());

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);

    // Call API
    const response = await fetch('/api/chatbot/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input, thread_id: threadId })
    });

    const data = await response.json();
    
    // Add AI response
    setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              {msg.content}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 p-2 border rounded"
          placeholder="Ask me about your tasks..."
        />
        <button onClick={sendMessage} className="px-4 py-2 bg-blue-500 text-white rounded">
          Send
        </button>
      </div>
    </div>
  );
}
```

---

## 📊 Advanced Features

### Task Statistics Tool

Add to conversation context:

```python
@tool
def get_task_stats(user_id: Optional[str] = None) -> dict:
    """Get statistics about user tasks."""
    from task_tools_helpers import get_task_statistics
    uid = user_id or get_current_user_id()
    if not uid:
        return {"error": "User not authenticated"}
    return get_task_statistics(uid, db)
```

### Priority Suggestions Tool

```python
@tool
def suggest_priorities(user_id: Optional[str] = None) -> dict:
    """Suggest which tasks to prioritize."""
    from task_tools_helpers import suggest_task_priorities
    uid = user_id or get_current_user_id()
    if not uid:
        return {"error": "User not authenticated"}
    return suggest_task_priorities(uid, db)
```

Add these to the tools list and rebind to LLM.

---

## 🔒 Security Considerations

1. **Validate User Permissions:** Always verify the user owns the task before update/delete
2. **Sanitize Inputs:** The tools include basic validation, but add more as needed
3. **Rate Limiting:** Implement rate limits on API endpoints
4. **Error Handling:** Never expose internal errors to users
5. **Logging:** Log all tool calls for audit trails

---

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ✅ Test chatbot with sample user
4. 🔲 Create Next.js API routes or Python microservice
5. 🔲 Integrate with existing chatbot UI (`src/app/chatbot/page.tsx`)
6. 🔲 Add authentication middleware
7. 🔲 Deploy Python service (Docker/Cloud Run)

---

## 📚 Additional Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangChain Tools](https://python.langchain.com/docs/modules/agents/tools/)
- [MongoDB Python Driver](https://pymongo.readthedocs.io/)

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review error logs in terminal
3. Verify MongoDB connection and data
4. Test tools individually using `chatbot_api_bridge.py` CLI

---

**Happy Task Managing! 🚀**
