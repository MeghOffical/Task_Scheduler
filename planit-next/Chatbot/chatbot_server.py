"""
Python Chatbot API Server
FastAPI server that exposes the LangGraph chatbot with task management tools
Run this alongside your Next.js app: python chatbot_server.py
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import os
from dotenv import load_dotenv

# Import chatbot components
from main_backend import chatbot, retrieve_all_threads, get_current_user_id
from chatbot_api_bridge import chatbot_bridge
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

load_dotenv()

app = FastAPI(title="Task Assistant Chatbot API")

# Configure CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("NEXTAUTH_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class ChatMessage(BaseModel):
    role: str
    content: str
    name: Optional[str] = None
    createdAt: Optional[str] = None


class StreamRequest(BaseModel):
    message: str
    threadId: Optional[str] = None
    userId: str


class ChatRequest(BaseModel):
    message: str
    threadId: str
    userId: str


class ThreadsResponse(BaseModel):
    threads: List[str]


class MessagesResponse(BaseModel):
    messages: List[ChatMessage]


# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "chatbot-api"}


# Stream chat response (SSE)
@app.post("/api/chatbot/stream")
async def stream_chat(request: StreamRequest):
    """Stream chat response with Server-Sent Events"""
    
    async def event_generator():
        try:
            # Set user context
            chatbot_bridge.set_user_context(request.userId)
            
            # Generate thread ID if not provided
            thread_id = request.threadId or f"thread-{os.urandom(8).hex()}"
            
            # Stream messages
            for chunk in chatbot_bridge.stream_message(
                request.message, 
                thread_id, 
                request.userId
            ):
                if chunk.get("type") == "error":
                    yield f"data: {json.dumps({'type': 'error', 'message': chunk.get('content')})}\n\n"
                    break
                    
                yield f"data: {json.dumps(chunk)}\n\n"
            
        except Exception as e:
            error_chunk = {"type": "error", "message": str(e)}
            yield f"data: {json.dumps(error_chunk)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )


# Send message (non-streaming)
@app.post("/api/chatbot/message")
async def send_message(request: ChatRequest):
    """Send a message and get complete response"""
    try:
        response = chatbot_bridge.send_message(
            request.message,
            request.threadId,
            request.userId
        )
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Get thread messages
@app.get("/api/chatbot/threads/{thread_id}")
async def get_thread_messages(thread_id: str, user_id: str):
    """Get all messages from a thread"""
    try:
        messages = chatbot_bridge.get_thread_messages(thread_id)
        return {"messages": messages}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# List all threads
@app.get("/api/chatbot/threads")
async def list_threads():
    """List all conversation threads"""
    try:
        threads = chatbot_bridge.list_threads()
        return {"threads": threads}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Clear thread
@app.delete("/api/chatbot/threads/{thread_id}")
async def clear_thread(thread_id: str):
    """Clear a conversation thread"""
    try:
        result = chatbot_bridge.clear_thread(thread_id)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Test endpoint
@app.post("/api/chatbot/test")
async def test_chatbot(request: dict):
    """Test the chatbot with a simple message"""
    try:
        message = request.get("message", "Hello")
        user_id = request.get("userId", os.getenv("DEFAULT_USER_ID"))
        
        if not user_id:
            raise HTTPException(status_code=400, detail="User ID required")
        
        response = chatbot_bridge.send_message(
            message,
            "test-thread",
            user_id
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("CHATBOT_PORT", "8000"))
    
    print(f"""
    ╔══════════════════════════════════════════════════════════╗
    ║  🤖 Task Assistant Chatbot API Server                   ║
    ╚══════════════════════════════════════════════════════════╝
    
    Server running on: http://localhost:{port}
    API Docs: http://localhost:{port}/docs
    Health: http://localhost:{port}/health
    
    Available Tools:
    ✅ create_task    - Create new tasks
    ✅ update_task    - Update existing tasks
    ✅ delete_task    - Delete tasks
    ✅ get_tasks      - Search and filter tasks
    ✅ calculator     - Math operations
    ✅ get_stock_price - Stock market data
    
    Press CTRL+C to stop
    """)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=port,
        log_level="info"
    )
