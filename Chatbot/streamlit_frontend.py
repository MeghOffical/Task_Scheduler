# import streamlit as st
# from langgraph_backend import chatbot
# from pydantic import BaseModel,Field
# from langchain_core.messages import HumanMessage,SystemMessage,BaseMessage

# #! st.session_state -> dict only but not load when we press enter 

# if 'message_history' not in st.session_state:
#     st.session_state['message_history']=[]

# # message_history=[] # for storing previous message we need to keep the history
    
    
# # load the previous message
# for message in st.session_state['message_history']:
#     with st.chat_message(message['role']):
#         st.text(message['content'])
        
        
# config={'configurable': {'thread_id':"1"}}

   
# user_input=st.chat_input("Type here ") 
    
# if user_input:
    
#     # first add the message to history
#     st.session_state['message_history'].append({'role':'user','content':user_input})
    
#     with st.chat_message('user'):
#         st.text(user_input)
        
    
#     response=chatbot.invoke({'messages':[HumanMessage(content=user_input)]},config=config)
#     ai_message=response['messages'][-1].content
#     st.session_state['message_history'].append({'role':'AI','content':ai_message})    
        
#     with st.chat_message('AI'):
#         st.text(ai_message)


import streamlit as st
from langgraph_backend import chatbot
from pydantic import BaseModel,Field
from langchain_core.messages import HumanMessage,SystemMessage,BaseMessage


if 'message_history' not in st.session_state:
    st.session_state['message_history']=[]
    
    
config={'configurable': {'thread_id':"1"}}


for message in st.session_state['message_history']:
    with st.chat_message(message['role']):
         st.text(message['content']) 

user_input=st.chat_input('Type here ')

if user_input:
    
    st.session_state['message_history'].append({'role':'user','content':user_input})
    with st.chat_message('user'):
        st.text(user_input)
        
        
    response=chatbot.invoke({'messages':[HumanMessage(content=user_input)]},config=config)
    ai_response=response['messages'][-1].content    
    st.session_state['message_history'].append({'role':'AI','content':ai_response})
    with st.chat_message('AI'):
        st.text(ai_response)
    
    