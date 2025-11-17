from langgraph.graph import StateGraph,START,END
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import TypedDict,Annotated,Literal
from dotenv import load_dotenv
from pydantic import BaseModel,Field
from langchain_core.messages import HumanMessage,SystemMessage,BaseMessage
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph.message import add_messages


load_dotenv()
llm=ChatGoogleGenerativeAI(model='gemini-2.5-flash')

# define the state of graph
class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    
    
# build a node
def chat_node(state :ChatState):
    
    # take a query from user 
    messages=state['messages']
    
    # feed to LLm 
    response=llm.invoke(messages)
    
    # response store state 
    return {'messages':[response]}



# define the graph
graph =StateGraph(ChatState)


# adding the node in graph 
graph.add_node("chat_node",chat_node)


# adding edges in graph 
graph.add_edge(START,"chat_node")
graph.add_edge("chat_node",END)

# Persistence
checkPointer=InMemorySaver()

# compile the graph
chatbot=graph.compile(checkpointer=checkPointer)


#! stream object has main two components 
#? --> message_chunk
#? --> metadata
 
# print(type(stream))

