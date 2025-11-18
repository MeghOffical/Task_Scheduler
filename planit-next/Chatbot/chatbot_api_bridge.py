"""
Chatbot API Bridge for Next.js Integration
This module provides a Flask/FastAPI-compatible interface for the chatbot backend
that can be called from Next.js API routes.
"""

from typing import Dict, Any, Optional, List
import json
import os
from datetime import datetime
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from main_backend import chatbot, retrieve_all_threads, llm
from task_tools_helpers import task_context


class ChatbotAPIBridge:
    """
    Bridge class to expose chatbot functionality as callable Python functions
    that can be integrated with Next.js API routes via Python child processes or microservices.
    """
    
    def __init__(self):
        self.chatbot = chatbot
    
    def set_user_context(self, user_id: str):
        """
        Set the current user context for task operations.
        
        Args:
            user_id: MongoDB user ID
        """
        task_context.set_user_id(user_id)
    
    def send_message(
        self, 
        message: str, 
        thread_id: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send a message to the chatbot and get a response.
        
        Args:
            message: User message
            thread_id: Conversation thread ID
            user_id: User ID for task operations (optional)
        
        Returns:
            dict: Response containing AI message and tool calls
        """
        try:
            if user_id:
                self.set_user_context(user_id)
            
            config = {
                "configurable": {"thread_id": thread_id},
                "metadata": {"thread_id": thread_id},
                "run_name": "chat_turn",
            }
            
            # Invoke chatbot
            result = self.chatbot.invoke(
                {"messages": [HumanMessage(content=message)]},
                config=config
            )
            
            # Extract response
            messages = result.get("messages", [])
            if not messages:
                return {"error": "No response from chatbot"}
            
            # Get the last AI message
            ai_response = None
            tool_calls = []
            
            for msg in reversed(messages):
                if isinstance(msg, AIMessage):
                    ai_response = msg.content
                    # Check for tool calls
                    if hasattr(msg, 'tool_calls') and msg.tool_calls:
                        tool_calls = [
                            {
                                "name": tc.get("name"),
                                "args": tc.get("args"),
                                "id": tc.get("id")
                            }
                            for tc in msg.tool_calls
                        ]
                    break
            
            return {
                "response": ai_response or "I'm processing your request...",
                "tool_calls": tool_calls,
                "thread_id": thread_id
            }
            
        except Exception as e:
            return {"error": f"Failed to process message: {str(e)}"}
    
    def stream_message(
        self, 
        message: str, 
        thread_id: str,
        user_id: Optional[str] = None
    ):
        """
        Stream a response from the chatbot (generator function).
        
        Args:
            message: User message
            thread_id: Conversation thread ID
            user_id: User ID for task operations (optional)
        
        Yields:
            dict: Streaming chunks with type and content
        """
        try:
            if user_id:
                self.set_user_context(user_id)
            
            config = {
                "configurable": {"thread_id": thread_id},
                "metadata": {"thread_id": thread_id},
                "run_name": "chat_turn",
            }
            
            for message_chunk, metadata in self.chatbot.stream(
                {"messages": [HumanMessage(content=message)]},
                config=config,
                stream_mode="messages",
            ):
                if isinstance(message_chunk, ToolMessage):
                    yield {
                        "type": "tool",
                        "name": getattr(message_chunk, "name", "tool"),
                        "content": message_chunk.content
                    }
                elif isinstance(message_chunk, AIMessage):
                    yield {
                        "type": "text",
                        "content": message_chunk.content
                    }
            
            yield {"type": "done"}
            
        except Exception as e:
            yield {"type": "error", "content": str(e)}
    
    def get_thread_messages(self, thread_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve all messages from a conversation thread.
        
        Args:
            thread_id: Thread ID
        
        Returns:
            list: List of messages
        """
        try:
            state = self.chatbot.get_state(config={"configurable": {"thread_id": thread_id}})
            messages = state.values.get("messages", [])
            
            formatted_messages = []
            for msg in messages:
                if isinstance(msg, HumanMessage):
                    formatted_messages.append({
                        "role": "user",
                        "content": msg.content
                    })
                elif isinstance(msg, AIMessage):
                    formatted_messages.append({
                        "role": "assistant",
                        "content": msg.content
                    })
            
            return formatted_messages
            
        except Exception as e:
            return []
    
    def list_threads(self) -> List[str]:
        """
        List all conversation threads.
        
        Returns:
            list: List of thread IDs
        """
        try:
            return retrieve_all_threads()
        except Exception as e:
            return []
    
    def clear_thread(self, thread_id: str) -> Dict[str, Any]:
        """
        Clear a conversation thread.
        
        Args:
            thread_id: Thread ID to clear
        
        Returns:
            dict: Success message
        """
        try:
            # This will create a new empty state for the thread
            config = {"configurable": {"thread_id": thread_id}}
            self.chatbot.update_state(config, {"messages": []})
            
            return {"message": "Thread cleared successfully", "thread_id": thread_id}
        except Exception as e:
            return {"error": f"Failed to clear thread: {str(e)}"}


# Global bridge instance
chatbot_bridge = ChatbotAPIBridge()


# CLI interface for testing
if __name__ == "__main__":
    import sys
    import uuid
    
    if len(sys.argv) < 2:
        print("Usage: python chatbot_api_bridge.py <command> [args]")
        print("Commands:")
        print("  chat <message> [thread_id] [user_id]")
        print("  threads")
        print("  history <thread_id>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "chat":
        message = sys.argv[2] if len(sys.argv) > 2 else "Hello"
        thread_id = sys.argv[3] if len(sys.argv) > 3 else str(uuid.uuid4())
        user_id = sys.argv[4] if len(sys.argv) > 4 else None
        
        response = chatbot_bridge.send_message(message, thread_id, user_id)
        print(json.dumps(response, indent=2))
    
    elif command == "threads":
        threads = chatbot_bridge.list_threads()
        print(json.dumps({"threads": threads}, indent=2))
    
    elif command == "history":
        if len(sys.argv) < 3:
            print("Error: thread_id required")
            sys.exit(1)
        
        thread_id = sys.argv[2]
        messages = chatbot_bridge.get_thread_messages(thread_id)
        print(json.dumps({"messages": messages}, indent=2))
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
