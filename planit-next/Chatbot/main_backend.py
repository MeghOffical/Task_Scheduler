from langgraph.graph import StateGraph, START, END
from typing import TypedDict, Annotated, Optional
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
# from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import tool
from dotenv import load_dotenv
import sqlite3
import requests
import os
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId


load_dotenv()

# -------------------
# MongoDB Connection
# -------------------
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/task_scheduler')
mongo_client = MongoClient(MONGODB_URI)
db = mongo_client.get_database()

# Collections
tasks_collection = db['tasks']
users_collection = db['users']

# -------------------
# 1. LLM
# -------------------

llm=ChatGoogleGenerativeAI(model='gemini-2.5-flash')


# -------------------
# 2. Tools
# -------------------

# Helper function to get user context (you can modify this based on your auth)
def get_current_user_id():
    """
    Get current user ID from context. 
    In production, this should be passed from the session/request context.
    For now, you can set a default user or pass it as a parameter.
    """
    # TODO: Replace with actual user context from session
    # This is a placeholder - integrate with your Next.js auth
    return os.getenv('DEFAULT_USER_ID', None)

# Task Management Tools
@tool
def create_task(
    title: str, 
    description: str = "", 
    priority: str = "medium", 
    status: str = "pending",
    due_date: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    user_id: Optional[str] = None
) -> dict:
    """
    Create a new task in the task scheduler.
    
    Args:
        title: Task title (required)
        description: Task description
        priority: Task priority - 'low', 'medium', or 'high' (default: medium)
        status: Task status - 'pending', 'in-progress', or 'completed' (default: pending)
        due_date: Due date in ISO format (e.g., '2025-11-20')
        start_time: Start time in HH:mm format (e.g., '14:30')
        end_time: End time in HH:mm format (e.g., '16:00')
        user_id: User ID (optional, will use current user if not provided)
    
    Returns:
        dict: Created task details or error message
    """
    try:
        # Get user ID
        uid = user_id or get_current_user_id()
        if not uid:
            return {"error": "User not authenticated"}
        
        # Validate priority and status
        if priority not in ['low', 'medium', 'high']:
            priority = 'medium'
        if status not in ['pending', 'in-progress', 'completed']:
            status = 'pending'
        
        # Prepare task document
        task_doc = {
            "userId": ObjectId(uid),
            "title": title,
            "description": description,
            "priority": priority,
            "status": status,
            "dueDate": datetime.fromisoformat(due_date) if due_date else None,
            "startTime": start_time,
            "endTime": end_time,
            "createdAt": datetime.utcnow()
        }
        
        # Insert into MongoDB
        result = tasks_collection.insert_one(task_doc)
        
        # Return created task
        created_task = {
            "id": str(result.inserted_id),
            "title": title,
            "description": description,
            "priority": priority,
            "status": status,
            "dueDate": due_date,
            "startTime": start_time,
            "endTime": end_time,
            "message": "Task created successfully"
        }
        
        return created_task
        
    except Exception as e:
        return {"error": f"Failed to create task: {str(e)}"}


@tool
def update_task(
    task_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    due_date: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    user_id: Optional[str] = None
) -> dict:
    """
    Update an existing task.
    
    Args:
        task_id: ID of the task to update (required)
        title: New task title
        description: New task description
        priority: New priority - 'low', 'medium', or 'high'
        status: New status - 'pending', 'in-progress', or 'completed'
        due_date: New due date in ISO format
        start_time: New start time in HH:mm format
        end_time: New end time in HH:mm format
        user_id: User ID (optional)
    
    Returns:
        dict: Updated task details or error message
    """
    try:
        # Get user ID
        uid = user_id or get_current_user_id()
        if not uid:
            return {"error": "User not authenticated"}
        
        # Build update document (only include provided fields)
        update_doc = {}
        if title is not None:
            update_doc["title"] = title
        if description is not None:
            update_doc["description"] = description
        if priority is not None and priority in ['low', 'medium', 'high']:
            update_doc["priority"] = priority
        if status is not None and status in ['pending', 'in-progress', 'completed']:
            update_doc["status"] = status
        if due_date is not None:
            update_doc["dueDate"] = datetime.fromisoformat(due_date)
        if start_time is not None:
            update_doc["startTime"] = start_time
        if end_time is not None:
            update_doc["endTime"] = end_time
        
        if not update_doc:
            return {"error": "No fields to update"}
        
        # Update task in MongoDB (ensure it belongs to user)
        result = tasks_collection.update_one(
            {"_id": ObjectId(task_id), "userId": ObjectId(uid)},
            {"$set": update_doc}
        )
        
        if result.matched_count == 0:
            return {"error": "Task not found or unauthorized"}
        
        # Fetch updated task
        updated_task = tasks_collection.find_one({"_id": ObjectId(task_id)})
        
        return {
            "id": str(updated_task["_id"]),
            "title": updated_task.get("title"),
            "description": updated_task.get("description"),
            "priority": updated_task.get("priority"),
            "status": updated_task.get("status"),
            "dueDate": updated_task.get("dueDate").isoformat() if updated_task.get("dueDate") else None,
            "startTime": updated_task.get("startTime"),
            "endTime": updated_task.get("endTime"),
            "message": "Task updated successfully"
        }
        
    except Exception as e:
        return {"error": f"Failed to update task: {str(e)}"}


@tool
def delete_task(task_id: str, user_id: Optional[str] = None) -> dict:
    """
    Delete a task from the task scheduler.
    
    Args:
        task_id: ID of the task to delete (required)
        user_id: User ID (optional)
    
    Returns:
        dict: Success message or error
    """
    try:
        # Get user ID
        uid = user_id or get_current_user_id()
        if not uid:
            return {"error": "User not authenticated"}
        
        # Delete task (ensure it belongs to user)
        result = tasks_collection.delete_one(
            {"_id": ObjectId(task_id), "userId": ObjectId(uid)}
        )
        
        if result.deleted_count == 0:
            return {"error": "Task not found or unauthorized"}
        
        return {
            "message": "Task deleted successfully",
            "task_id": task_id
        }
        
    except Exception as e:
        return {"error": f"Failed to delete task: {str(e)}"}


@tool
def get_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search_query: Optional[str] = None,
    user_id: Optional[str] = None
) -> dict:
    """
    Retrieve tasks with optional filtering.
    
    Args:
        status: Filter by status - 'pending', 'in-progress', or 'completed'
        priority: Filter by priority - 'low', 'medium', or 'high'
        search_query: Search in title or description
        user_id: User ID (optional)
    
    Returns:
        dict: List of tasks matching filters
    """
    try:
        # Get user ID
        uid = user_id or get_current_user_id()
        if not uid:
            return {"error": "User not authenticated"}
        
        # Build query filter
        query_filter = {"userId": ObjectId(uid)}
        
        if status and status in ['pending', 'in-progress', 'completed']:
            query_filter["status"] = status
        
        if priority and priority in ['low', 'medium', 'high']:
            query_filter["priority"] = priority
        
        if search_query:
            query_filter["$or"] = [
                {"title": {"$regex": search_query, "$options": "i"}},
                {"description": {"$regex": search_query, "$options": "i"}}
            ]
        
        # Fetch tasks
        tasks_cursor = tasks_collection.find(query_filter).sort("createdAt", -1).limit(50)
        
        tasks_list = []
        for task in tasks_cursor:
            tasks_list.append({
                "id": str(task["_id"]),
                "title": task.get("title"),
                "description": task.get("description"),
                "priority": task.get("priority"),
                "status": task.get("status"),
                "dueDate": task.get("dueDate").isoformat() if task.get("dueDate") else None,
                "startTime": task.get("startTime"),
                "endTime": task.get("endTime"),
                "createdAt": task.get("createdAt").isoformat() if task.get("createdAt") else None
            })
        
        return {
            "count": len(tasks_list),
            "tasks": tasks_list
        }
        
    except Exception as e:
        return {"error": f"Failed to fetch tasks: {str(e)}"}


# Original Tools
# search_tool = DuckDuckGoSearchRun(region="us-en")

@tool
def calculator(first_num: float, second_num: float, operation: str) -> dict:
    """
    Perform a basic arithmetic operation on two numbers.
    Supported operations: add, sub, mul, div
    """
    try:
        if operation == "add":
            result = first_num + second_num
        elif operation == "sub":
            result = first_num - second_num
        elif operation == "mul":
            result = first_num * second_num
        elif operation == "div":
            if second_num == 0:
                return {"error": "Division by zero is not allowed"}
            result = first_num / second_num
        else:
            return {"error": f"Unsupported operation '{operation}'"}
        
        return {"first_num": first_num, "second_num": second_num, "operation": operation, "result": result}
    except Exception as e:
        return {"error": str(e)}




@tool
def get_stock_price(symbol: str) -> dict:
    """
    Fetch latest stock price for a given symbol (e.g. 'AAPL', 'TSLA') 
    using Alpha Vantage with API key in the URL.
    """
    url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey=C9PE94QUEW9VWGFM"
    r = requests.get(url)
    return r.json()



tools = [get_tasks, create_task, update_task, delete_task, get_stock_price, calculator]
llm_with_tools = llm.bind_tools(tools)

# -------------------
# 3. State
# -------------------
class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

# -------------------
# 4. Nodes
# -------------------

def chat_node(state: ChatState):
    """LLM node that may answer or request a tool call."""
    messages = state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

tool_node = ToolNode(tools)

# -------------------
# 5. Checkpointer
# -------------------
conn = sqlite3.connect(database="chatbot.db", check_same_thread=False)
checkpointer = SqliteSaver(conn=conn)

# -------------------
# 6. Graph
# -------------------
graph = StateGraph(ChatState)
graph.add_node("chat_node", chat_node)
graph.add_node("tools", tool_node)

graph.add_edge(START, "chat_node")

graph.add_conditional_edges("chat_node",tools_condition)
graph.add_edge('tools', 'chat_node')

chatbot = graph.compile(checkpointer=checkpointer)

# -------------------
# 7. Helper
# -------------------
def retrieve_all_threads():
    all_threads = set()
    for checkpoint in checkpointer.list(None):
        all_threads.add(checkpoint.config["configurable"]["thread_id"])
    return list(all_threads)