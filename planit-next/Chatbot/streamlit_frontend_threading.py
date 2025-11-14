import streamlit as st
from langgraph_backend import chatbot
from generate_title import structured_model
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
import uuid


#! *************************  utility function   *************************   

def generate_thread_id():
    thread_id = uuid.uuid4()
    return thread_id


def reset_chat():
    thread_id = generate_thread_id()
    st.session_state['thread_id'] = thread_id
    add_thread(st.session_state['thread_id'])
    st.session_state['message_history'] = []
    # ✅ Ensure a blank title is created immediately
    st.session_state['chat_titles'][str(thread_id)] = "New Chat"


def add_thread(thread_id):
    if thread_id not in st.session_state['chat_threads']:
        st.session_state['chat_threads'].append(thread_id)


def load_conversation(thread_id):
    state = chatbot.get_state(config={'configurable': {'thread_id': thread_id}})
    return state.values.get('messages', [])


def generate_chat_title(first_user_message: str) -> str:
    try:
        result = structured_model.invoke(first_user_message)
        return result.title.strip()
    except Exception:
        return "New Chat"


#! *************************  Session Setup  *************************  

if 'message_history' not in st.session_state:
    st.session_state['message_history'] = []

if 'thread_id' not in st.session_state:
    st.session_state['thread_id'] = generate_thread_id()

if 'chat_threads' not in st.session_state:
    st.session_state['chat_threads'] = []

if 'chat_titles' not in st.session_state:
    st.session_state['chat_titles'] = {}

add_thread(st.session_state['thread_id'])  # first time when we load a page


#! *************************  Sidebar UI  *************************    

st.sidebar.title("LangGraph Chatbot")

if st.sidebar.button('New Chat'):
    reset_chat()

st.sidebar.header("Chats")

for thread_id in reversed(st.session_state['chat_threads']):
    sid = str(thread_id)
    title = st.session_state['chat_titles'].get(sid, "New Chat")
    if st.sidebar.button(title, key=sid):
        st.session_state['thread_id'] = thread_id
        messages = load_conversation(thread_id)

        temp_messages = []
        for msg in messages:
            role = 'user' if isinstance(msg, HumanMessage) else 'assistant'
            temp_messages.append({'role': role, 'content': msg.content})

        st.session_state['message_history'] = temp_messages


#! *************************   Main UI   *************************  

# load the previous history 
for message in st.session_state['message_history']:
    with st.chat_message(message['role']):
        st.text(message['content'])

# set the config and thread for chat 
config = {'configurable': {'thread_id': st.session_state['thread_id']}}

# taking user input 
user_input = st.chat_input('Type here ')

if user_input:
    sid = str(st.session_state['thread_id'])

    #  Update title only if it's still "New Chat"
    if st.session_state['chat_titles'].get(sid, "New Chat") == "New Chat":
        st.session_state['chat_titles'][sid] = generate_chat_title(user_input)

    # append user input
    st.session_state['message_history'].append({'role': 'user', 'content': user_input})
    with st.chat_message('user'):
        st.text(user_input)


    # append assistant response
    with st.chat_message('assistant'):
        ai_response = st.write_stream(
            (message_chunk.content for message_chunk, metadata in chatbot.stream(
                {'messages': [HumanMessage(content=user_input)]},
                config=config,
                stream_mode='messages')
             )
        )

    st.session_state['message_history'].append({'role': 'assistant', 'content': ai_response})
