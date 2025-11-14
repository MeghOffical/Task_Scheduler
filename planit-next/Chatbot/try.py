import streamlit as st
from langgraph_database_backend import chatbot, retrive_all_thread
from generate_title import structured_model
from pydantic import BaseModel, Field
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage
import uuid
import sqlite3
import os
import time
import traceback

# ----------------- Local SQLite persistence (frontend-only) -----------------
DB_PATH = "thread_titles.db"

def init_db(path=DB_PATH):
    conn = sqlite3.connect(path, check_same_thread=False)
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS thread_titles (
            thread_id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    return conn

_db_conn = init_db()

def save_title_to_db(thread_id: str, title: str):
    cur = _db_conn.cursor()
    cur.execute(
        "INSERT OR REPLACE INTO thread_titles (thread_id, title) VALUES (?, ?)",
        (str(thread_id), title),
    )
    _db_conn.commit()

def get_title_from_db(thread_id: str):
    cur = _db_conn.cursor()
    cur.execute("SELECT title FROM thread_titles WHERE thread_id = ?", (str(thread_id),))
    r = cur.fetchone()
    return r[0] if r else None

def load_all_titles_from_db():
    cur = _db_conn.cursor()
    cur.execute("SELECT thread_id, title FROM thread_titles")
    return {row[0]: row[1] for row in cur.fetchall()}

# ----------------- Utility functions -----------------

def generate_thread_id():
    # return string form of uuid for convenience
    return str(uuid.uuid4())

def reset_chat():
    thread_id = generate_thread_id()
    st.session_state['thread_id'] = thread_id
    add_thread(thread_id)
    # initialize (empty) message history for new thread
    st.session_state['message_history'] = []
    # ensure mapping exists in session; DB will supply later if present
    st.session_state['thread_titles'].setdefault(thread_id, None)

def add_thread(thread_id):
    thread_id = str(thread_id)
    if thread_id not in st.session_state['chat_threads']:
        st.session_state['chat_threads'].append(thread_id)
        # ensure there's an entry in titles map; pull from DB if available
        db_title = get_title_from_db(thread_id)
        st.session_state['thread_titles'].setdefault(thread_id, db_title)

def load_conversation(thread_id):
    state = chatbot.get_state(config={'configurable': {'thread_id': thread_id}})
    # `state.values` can be a dict-like; stay defensive
    return state.values.get('messages', [])

def safe_invoke_generate_title(first_message_text: str) -> str:
    """
    Use your structured_model.invoke exactly as provided in generate_title.py.
    Returns a cleaned title; falls back to a truncated message on error.
    """
    try:
        out = structured_model.invoke(first_message_text)
        title = getattr(out, "title", None)
        if not title or not title.strip():
            raise ValueError("Empty title returned by model")
        return title.strip()
    except Exception as e:
        # keep a debug log in session_state for quick inspection
        st.session_state.setdefault('_debug_logs', []).append(
            f"[{time.strftime('%H:%M:%S')}] Title generation failed: {e}\n{traceback.format_exc()}"
        )
        short = first_message_text.strip()
        return (short[:40] + ("..." if len(short) > 40 else "")) if short else None

def ensure_title_for_thread(thread_id, first_message_text: str):
    """
    If thread has no title, generate using structured_model and persist to DB.
    """
    existing = st.session_state['thread_titles'].get(thread_id) or get_title_from_db(thread_id)
    if existing:
        # make sure session has it
        st.session_state['thread_titles'][thread_id] = existing
        return

    title = safe_invoke_generate_title(first_message_text)
    if not title:
        title = f"Chat {thread_id[:8]}"

    # store in session and DB
    st.session_state['thread_titles'][thread_id] = title
    try:
        save_title_to_db(thread_id, title)
    except Exception:
        # log but don't fail the chat
        st.session_state.setdefault('_debug_logs', []).append(
            f"[{time.strftime('%H:%M:%S')}] Failed saving title to DB for {thread_id}."
        )

# ----------------- Session Setup -----------------

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

# thread_titles map: thread_id -> title (load DB titles)
if 'thread_titles' not in st.session_state:
    db_titles = load_all_titles_from_db()
    # initialize map with DB-provided titles where available
    st.session_state['thread_titles'] = {tid: db_titles.get(tid) for tid in st.session_state['chat_threads']}

add_thread(st.session_state['thread_id'])  # ensure current thread is present

# ----------------- Sidebar UI -----------------

st.sidebar.title("LangGraph Chatbot")

if st.sidebar.button('New Chat'):
    reset_chat()

st.sidebar.header("Chats")

# show newest first
for thread_id in reversed(st.session_state['chat_threads']):
    # prefer session title, else DB, else placeholder uuid
    title = st.session_state['thread_titles'].get(thread_id) or get_title_from_db(thread_id)
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

# ----------------- Main UI -----------------

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
    if not (st.session_state['thread_titles'].get(current_thread) or get_title_from_db(current_thread)):
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

