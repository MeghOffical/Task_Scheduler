import streamlit as st
from langgraph_database_backend import chatbot, retrive_all_thread
from generate_title import structured_model
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
import uuid

#! *************************  utility function   *************************   

def generate_thread_id():
    # return string form of uuid for convenience
    return str(uuid.uuid4())

def reset_chat():
    thread_id = generate_thread_id()
    st.session_state['thread_id'] = thread_id
    add_thread(thread_id)
    # initialize (empty) message history for new thread
    st.session_state['message_history'] = []
    # no title yet — it will be created on first user message
    st.session_state['thread_titles'].setdefault(thread_id, None)

def add_thread(thread_id):
    thread_id = str(thread_id)
    if thread_id not in st.session_state['chat_threads']:
        st.session_state['chat_threads'].append(thread_id)
        # ensure there's an entry in titles map
        st.session_state['thread_titles'].setdefault(thread_id, None)

def load_conversation(thread_id):
    state = chatbot.get_state(config={'configurable': {'thread_id': thread_id}})
    # `state.values` can be a dict-like; stay defensive
    return state.values.get('messages', [])

def ensure_title_for_thread(thread_id, first_message_text: str):
    """
    If the thread has no title yet, generate one using structured_model
    using the first_message_text. Save into session_state mapping.
    """
    if st.session_state['thread_titles'].get(thread_id):
        return  # already set

    try:
        out = structured_model.invoke(first_message_text)
        # structured_model returns pydantic model per your setup
        title = out.title.strip()
        if not title:
            raise ValueError("Empty title returned")
    except Exception as e:
        # fallback: short truncated user message
        short = first_message_text.strip()
        title = (short[:40] + ("..." if len(short) > 40 else "")) if short else f"Chat {thread_id[:8]}"
    st.session_state['thread_titles'][thread_id] = title

#! *************************  Session Setup  *************************  

if 'message_history' not in st.session_state:
    st.session_state['message_history'] = []

if 'thread_id' not in st.session_state:
    st.session_state['thread_id'] = generate_thread_id()

# chat_threads from backend (converted to strings)
if 'chat_threads' not in st.session_state:
    try:
        backend_threads = retrive_all_thread() or []
        st.session_state['chat_threads'] = [str(t) for t in backend_threads]
    except Exception:
        # on any failure, make empty list
        st.session_state['chat_threads'] = []

# thread_titles map: thread_id -> title (None until first message)
if 'thread_titles' not in st.session_state:
    # try to keep keys for all known threads
    st.session_state['thread_titles'] = {tid: None for tid in st.session_state['chat_threads']}

add_thread(st.session_state['thread_id'])  # ensure current thread is present

#! *************************  Sidebar UI  *************************    

st.sidebar.title("LangGraph Chatbot")

if st.sidebar.button('New Chat'):
    reset_chat()

st.sidebar.header("Chats")

# show newest first
for thread_id in reversed(st.session_state['chat_threads']):
    title = st.session_state['thread_titles'].get(thread_id)
    # if no title yet, show shortened uuid as placeholder
    label = title if title else f"Untitled — {thread_id[:8]}"
    # use a unique key per button to avoid duplicate widget keys
    if st.sidebar.button(label, key=f"thread_btn_{thread_id}"):
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
    current_thread = st.session_state['thread_id']

    # If this thread doesn't have a title yet, create one from this first message
    if not st.session_state['thread_titles'].get(current_thread):
        ensure_title_for_thread(current_thread, user_input)

    # append user input locally for display
    st.session_state['message_history'].append({'role': 'user', 'content': user_input})
    with st.chat_message('user'):
        st.text(user_input)

    # append assistant response (stream)
    with st.chat_message('assistant'):
        # stream generator from your chatbot
        ai_response = st.write_stream(
            (message_chunk.content for message_chunk, metadata in chatbot.stream(
                {'messages': [HumanMessage(content=user_input)]},
                config=config,
                stream_mode='messages')
            )
        )

    st.session_state['message_history'].append({'role': 'assistant', 'content': ai_response})

    # ensure thread is listed (in case it was newly created)
    add_thread(current_thread)
