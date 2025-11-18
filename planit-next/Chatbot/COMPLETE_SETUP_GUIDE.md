# 🚀 Complete Setup Guide - Python Chatbot with Task Management

## Overview

This guide will help you set up the Python-powered AI chatbot that can create, update, delete, and search tasks using natural language.

---

## 📋 Prerequisites

- ✅ Python 3.9+ installed
- ✅ Node.js 18+ installed
- ✅ MongoDB running (local or Atlas)
- ✅ Google Gemini API key

---

## 🛠️ Step-by-Step Setup

### Step 1: Install Python Dependencies

```bash
cd planit-next/Chatbot
pip install -r requirements.txt
```

**Expected packages:**
- `langgraph` - AI agent framework
- `langchain` - LLM orchestration
- `pymongo` - MongoDB driver
- `fastapi` - Web API framework
- `uvicorn` - ASGI server
- `google-generativeai` - Gemini AI

### Step 2: Configure Environment Variables

Create or update `.env` in `planit-next/` root:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/task_scheduler

# Google Gemini API Key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Default User ID (get from MongoDB - see below)
DEFAULT_USER_ID=673a2b8e9f1c2d4e5a6b7c8d

# Python Chatbot Server
CHATBOT_PORT=8000

# Next.js (existing)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

### Step 3: Get Your User ID from MongoDB

```bash
# Option 1: MongoDB Shell
mongosh
use task_scheduler
db.users.findOne({}, {_id: 1, email: 1})

# Option 2: MongoDB Compass
# Connect to mongodb://localhost:27017
# Open task_scheduler database
# View users collection
# Copy any _id value
```

**Example output:**
```json
{
  "_id": ObjectId("673a2b8e9f1c2d4e5a6b7c8d"),
  "email": "user@example.com"
}
```

Copy the `_id` value (without `ObjectId()`) and paste as `DEFAULT_USER_ID` in `.env`.

### Step 4: Get Google Gemini API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Click **"Create API Key"**
3. Select your Google Cloud project or create new one
4. Copy the API key
5. Paste into `.env` as `GOOGLE_GENERATIVE_AI_API_KEY`

### Step 5: Update Next.js Environment

Add to `planit-next/.env.local`:

```bash
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000
```

---

## 🏃 Running the Application

### Terminal 1: Start Python Chatbot Server

```bash
cd planit-next/Chatbot
python chatbot_server.py
```

**Expected output:**
```
╔══════════════════════════════════════════════════════════╗
║  🤖 Task Assistant Chatbot API Server                   ║
╚══════════════════════════════════════════════════════════╝

Server running on: http://localhost:8000
API Docs: http://localhost:8000/docs
Health: http://localhost:8000/health

Available Tools:
✅ create_task    - Create new tasks
✅ update_task    - Update existing tasks
✅ delete_task    - Delete tasks
✅ get_tasks      - Search and filter tasks
✅ calculator     - Math operations
✅ get_stock_price - Stock market data
```

### Terminal 2: Start Next.js Development Server

```bash
cd planit-next
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

---

## 🧪 Testing the Chatbot

### Test 1: Health Check

Open browser: http://localhost:8000/health

**Expected:**
```json
{
  "status": "ok",
  "service": "chatbot-api"
}
```

### Test 2: API Documentation

Open browser: http://localhost:8000/docs

You should see FastAPI's interactive API documentation (Swagger UI).

### Test 3: Chat Interface

Open browser: http://localhost:3000/chatbot-python

---

## 💬 Example Conversations

### 1. Create a Task

**You:** "Create a task to finish the project report by November 25th with high priority"

**AI Response:**
```
🔧 Using create_task...
✅ Done

Task created successfully! I've added "Finish the project report" 
as a high-priority task due on November 25th, 2025.

Task Details:
- Priority: High
- Status: Pending
- Due Date: 2025-11-25
```

### 2. List Tasks

**You:** "Show me all my tasks"

**AI Response:**
```
🔧 Using get_tasks...
✅ Done

You have 3 tasks:

1. Finish the project report
   - Priority: High
   - Status: Pending
   - Due: November 25, 2025

2. Review code changes
   - Priority: Medium
   - Status: In Progress
   - Due: November 20, 2025

3. Update documentation
   - Priority: Low
   - Status: Pending
   - Due: November 22, 2025
```

### 3. Filter by Priority

**You:** "Show me only high priority tasks"

**AI Response:**
```
🔧 Using get_tasks...
✅ Done

You have 1 high-priority task:

1. Finish the project report
   - Status: Pending
   - Due: November 25, 2025
```

### 4. Update a Task

**You:** "Mark the project report task as in progress"

**AI Response:**
```
🔧 Using get_tasks...
🔧 Using update_task...
✅ Done

Perfect! I've updated "Finish the project report" to In Progress status.
```

### 5. Search Tasks

**You:** "Find tasks about documentation"

**AI Response:**
```
🔧 Using get_tasks...
✅ Done

Found 1 task matching "documentation":

1. Update documentation
   - Priority: Low
   - Status: Pending
   - Due: November 22, 2025
```

### 6. Delete a Task

**You:** "Delete the documentation task"

**AI Response:**
```
🔧 Using get_tasks...
🔧 Using delete_task...
✅ Done

Task "Update documentation" has been deleted successfully.
```

### 7. Use Calculator

**You:** "What's 25 times 8?"

**AI Response:**
```
🔧 Using calculator...
✅ Done

25 × 8 = 200
```

### 8. Check Stock Price

**You:** "What's the current price of AAPL stock?"

**AI Response:**
```
🔧 Using get_stock_price...
✅ Done

Apple Inc. (AAPL) current price: $182.45
Change: +1.23 (+0.67%)
```

---

## 🔍 Verification Checklist

- [ ] ✅ Python server running on port 8000
- [ ] ✅ Next.js running on port 3000
- [ ] ✅ MongoDB connected and accessible
- [ ] ✅ Health check returns `{"status": "ok"}`
- [ ] ✅ API docs accessible at `/docs`
- [ ] ✅ Chatbot page loads without errors
- [ ] ✅ Can send messages and receive responses
- [ ] ✅ Task creation works
- [ ] ✅ Task listing works
- [ ] ✅ Task update works
- [ ] ✅ Task deletion works
- [ ] ✅ Tools show activity indicators

---

## 🐛 Troubleshooting

### Issue: "Module 'fastapi' not found"

**Solution:**
```bash
pip install fastapi uvicorn
```

### Issue: "User not authenticated"

**Solution:**
1. Check `DEFAULT_USER_ID` in `.env`
2. Verify the ID exists in MongoDB:
```bash
mongosh
use task_scheduler
db.users.findOne({_id: ObjectId("YOUR_USER_ID")})
```

### Issue: "Failed to connect to MongoDB"

**Solution:**
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Docker
docker start mongodb
```

### Issue: "Invalid API key" (Gemini)

**Solution:**
1. Get new API key: https://aistudio.google.com/app/apikey
2. Update `.env` file
3. Restart Python server

### Issue: "CORS error" in browser

**Solution:**
The server is configured for CORS. Ensure you're accessing from `http://localhost:3000`.

### Issue: Tools not executing

**Solution:**
1. Check Python server logs
2. Verify tools are loaded:
```bash
python -c "from main_backend import tools; print(f'Loaded {len(tools)} tools')"
```
Expected: `Loaded 6 tools`

### Issue: "Connection refused" on port 8000

**Solution:**
1. Check if Python server is running
2. Try different port:
```bash
CHATBOT_PORT=8001 python chatbot_server.py
```
3. Update `.env.local`:
```bash
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8001
```

---

## 📊 Monitoring & Debugging

### View Python Server Logs

The server outputs detailed logs:

```
INFO:     127.0.0.1:54321 - "POST /api/chatbot/stream HTTP/1.1" 200 OK
INFO:     Tool called: create_task
INFO:     Task created: 673a2b8e9f1c2d4e5a6b7c8d
```

### Test API Endpoints Directly

Using curl or browser:

```bash
# Health check
curl http://localhost:8000/health

# Test chatbot
curl -X POST http://localhost:8000/api/chatbot/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "userId": "YOUR_USER_ID"}'
```

### Check MongoDB Data

```javascript
// View all tasks
db.tasks.find().pretty()

// Count tasks
db.tasks.countDocuments()

// Recent tasks
db.tasks.find().sort({createdAt: -1}).limit(5).pretty()
```

---

## 🚀 Production Deployment

### Option 1: Docker Deployment

Create `Chatbot/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8000
EXPOSE 8000

CMD ["python", "chatbot_server.py"]
```

Build and run:
```bash
docker build -t task-chatbot .
docker run -p 8000:8000 --env-file .env task-chatbot
```

### Option 2: Cloud Run (Google Cloud)

```bash
gcloud run deploy task-chatbot \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 3: Railway/Render

1. Connect GitHub repo
2. Select `Chatbot` directory
3. Add environment variables
4. Deploy

---

## 📈 Performance Tips

### 1. Enable Response Caching

Add to `chatbot_server.py`:

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def cached_get_tasks(user_id, status, priority):
    # Cache recent task queries
    pass
```

### 2. Database Indexing

```javascript
// In MongoDB shell
db.tasks.createIndex({ userId: 1, createdAt: -1 })
db.tasks.createIndex({ userId: 1, status: 1 })
db.tasks.createIndex({ userId: 1, priority: 1 })
```

### 3. Connection Pooling

Update `main_backend.py`:

```python
mongo_client = MongoClient(
    MONGODB_URI,
    maxPoolSize=50,
    minPoolSize=10
)
```

---

## 📝 Next Steps

1. ✅ **Test all task operations**
2. ⬜ **Add user authentication integration**
3. ⬜ **Set up logging and monitoring**
4. ⬜ **Deploy to production**
5. ⬜ **Add more tools (calendar, reminders, etc.)**
6. ⬜ **Implement rate limiting**
7. ⬜ **Add unit tests**

---

## 🎯 Key Features Working

✅ **Natural Language Task Creation**
- "Create a task to X by Y with Z priority"

✅ **Smart Task Search**
- "Show me tasks about X"
- "Find high priority tasks"

✅ **Flexible Updates**
- "Mark X as completed"
- "Change priority of X to high"

✅ **Easy Deletion**
- "Delete the X task"
- "Remove task about Y"

✅ **Context Awareness**
- AI remembers conversation context
- Can reference previous messages

---

**Status:** ✅ Ready for Testing!

**Support:** Check ARCHITECTURE.md for system details

**Enjoy your AI-powered task management! 🎉**
