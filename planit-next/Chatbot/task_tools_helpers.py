"""
Task Management Tools Helper Functions
This module provides helper utilities for the chatbot's task management tools.
"""

import os
from typing import Optional
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId


class TaskToolsContext:
    """
    Context manager for task tools that handles user authentication
    and MongoDB connection management.
    """
    
    def __init__(self, mongodb_uri: Optional[str] = None):
        """
        Initialize the task tools context.
        
        Args:
            mongodb_uri: MongoDB connection URI (defaults to env variable)
        """
        self.mongodb_uri = mongodb_uri or os.getenv('MONGODB_URI', 'mongodb://localhost:27017/task_scheduler')
        self.client = None
        self.db = None
        self.current_user_id = None
    
    def connect(self):
        """Establish MongoDB connection."""
        if not self.client:
            self.client = MongoClient(self.mongodb_uri)
            self.db = self.client.get_database()
        return self.db
    
    def set_user_id(self, user_id: str):
        """Set the current user ID for task operations."""
        self.current_user_id = user_id
    
    def get_user_id(self) -> Optional[str]:
        """Get the current user ID."""
        return self.current_user_id or os.getenv('DEFAULT_USER_ID')
    
    def close(self):
        """Close MongoDB connection."""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None


# Global context instance (you can initialize this in your app startup)
task_context = TaskToolsContext()


def validate_task_data(
    title: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    due_date: Optional[str] = None
) -> dict:
    """
    Validate task data before database operations.
    
    Returns:
        dict: Validation result with 'valid' boolean and 'errors' list
    """
    errors = []
    
    if title is not None and len(title.strip()) == 0:
        errors.append("Title cannot be empty")
    
    if priority is not None and priority not in ['low', 'medium', 'high']:
        errors.append(f"Invalid priority: {priority}. Must be 'low', 'medium', or 'high'")
    
    if status is not None and status not in ['pending', 'in-progress', 'completed', 'overdue']:
        errors.append(f"Invalid status: {status}. Must be 'pending', 'in-progress', 'completed', or 'overdue'")
    
    if due_date is not None:
        try:
            datetime.fromisoformat(due_date)
        except (ValueError, TypeError):
            errors.append(f"Invalid due_date format: {due_date}. Use ISO format (YYYY-MM-DD)")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }


def format_task_response(task_doc: dict) -> dict:
    """
    Format a MongoDB task document for API response.
    
    Args:
        task_doc: Raw MongoDB document
    
    Returns:
        dict: Formatted task data
    """
    return {
        "id": str(task_doc["_id"]),
        "title": task_doc.get("title", ""),
        "description": task_doc.get("description", ""),
        "priority": task_doc.get("priority", "medium"),
        "status": task_doc.get("status", "pending"),
        "dueDate": task_doc.get("dueDate").isoformat() if task_doc.get("dueDate") else None,
        "startTime": task_doc.get("startTime"),
        "endTime": task_doc.get("endTime"),
        "createdAt": task_doc.get("createdAt").isoformat() if task_doc.get("createdAt") else None,
        "userId": str(task_doc.get("userId"))
    }


def get_task_statistics(user_id: str, db) -> dict:
    """
    Calculate task statistics for a user.
    
    Args:
        user_id: User ID
        db: MongoDB database instance
    
    Returns:
        dict: Task statistics
    """
    try:
        tasks_collection = db['tasks']
        
        # Count by status
        total = tasks_collection.count_documents({"userId": ObjectId(user_id)})
        pending = tasks_collection.count_documents({"userId": ObjectId(user_id), "status": "pending"})
        in_progress = tasks_collection.count_documents({"userId": ObjectId(user_id), "status": "in-progress"})
        completed = tasks_collection.count_documents({"userId": ObjectId(user_id), "status": "completed"})
        overdue = tasks_collection.count_documents({"userId": ObjectId(user_id), "status": "overdue"})
        
        # Count by priority
        high_priority = tasks_collection.count_documents({"userId": ObjectId(user_id), "priority": "high"})
        medium_priority = tasks_collection.count_documents({"userId": ObjectId(user_id), "priority": "medium"})
        low_priority = tasks_collection.count_documents({"userId": ObjectId(user_id), "priority": "low"})
        
        return {
            "total": total,
            "by_status": {
                "pending": pending,
                "in_progress": in_progress,
                "completed": completed,
                "overdue": overdue
            },
            "by_priority": {
                "high": high_priority,
                "medium": medium_priority,
                "low": low_priority
            }
        }
    except Exception as e:
        return {"error": f"Failed to calculate statistics: {str(e)}"}


def suggest_task_priorities(user_id: str, db) -> dict:
    """
    Suggest task priorities based on due dates and status.
    
    Args:
        user_id: User ID
        db: MongoDB database instance
    
    Returns:
        dict: Suggested priority tasks
    """
    try:
        tasks_collection = db['tasks']
        
        # Get pending and in-progress tasks with due dates
        current_time = datetime.utcnow()
        
        # High priority: overdue tasks
        overdue_tasks = list(tasks_collection.find({
            "userId": ObjectId(user_id),
            "status": {"$in": ["pending", "in-progress"]},
            "dueDate": {"$lt": current_time}
        }).sort("dueDate", 1).limit(5))
        
        # Medium priority: tasks due within 3 days
        from datetime import timedelta
        three_days_later = current_time + timedelta(days=3)
        upcoming_tasks = list(tasks_collection.find({
            "userId": ObjectId(user_id),
            "status": {"$in": ["pending", "in-progress"]},
            "dueDate": {"$gte": current_time, "$lte": three_days_later}
        }).sort("dueDate", 1).limit(5))
        
        # High priority tasks not started
        high_priority_pending = list(tasks_collection.find({
            "userId": ObjectId(user_id),
            "status": "pending",
            "priority": "high"
        }).sort("createdAt", 1).limit(5))
        
        return {
            "suggestions": {
                "overdue": [format_task_response(t) for t in overdue_tasks],
                "due_soon": [format_task_response(t) for t in upcoming_tasks],
                "high_priority_pending": [format_task_response(t) for t in high_priority_pending]
            },
            "message": "Focus on overdue tasks first, then tasks due soon, and high priority pending tasks."
        }
    except Exception as e:
        return {"error": f"Failed to suggest priorities: {str(e)}"}
