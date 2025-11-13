# AI Task Assistant Setup

## Overview
The Home page now features an AI-powered chat interface that allows you to manage tasks using natural language commands.

## Features
- **Create Tasks**: Ask the AI to create tasks with specific details
- **Delete Tasks**: Tell the AI which tasks to remove
- **List Tasks**: View your current tasks
- **Natural Language Processing**: Communicate naturally without rigid commands

## Setup Instructions

### 1. Get Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select a Google Cloud project (or create a new one)
5. Copy the API key

### 2. Add API Key to Environment Variables
Open the `.env` file in the `planit-next` directory and replace the placeholder:

```env
GEMINI_API_KEY=your-actual-api-key-here
```

### 3. Restart the Development Server
After adding the API key, restart your dev server:
```bash
npm run dev
```

## Usage Examples

### Creating Tasks
- "Create a task to buy groceries by tomorrow"
- "Add a high priority task to finish the report by Friday"
- "Make a new task for team meeting on Monday"
- "Create a task called 'Review code' due today"

### Deleting Tasks
- "Delete the 'buy groceries' task"
- "Remove the meeting task"
- "Delete task about the report"

### Listing Tasks
- "Show me my tasks"
- "List all my tasks"
- "What are my current tasks?"

### General Questions
- "What's my highest priority task?"
- "Do I have any tasks due today?"

## How It Works

The AI assistant:
1. **Parses your message** to understand your intent (create, delete, list, etc.)
2. **Extracts task details** like title, priority, and due date
3. **Performs the action** in your database
4. **Updates the dashboard** automatically
5. **Confirms the action** with a friendly message

## Task Priority Levels
- **High**: Mention "high priority" or "urgent"
- **Medium**: Default if no priority is specified
- **Low**: Mention "low priority"

## Date Recognition
The AI understands various date formats:
- Today, tomorrow
- Days of the week (Monday, Tuesday, etc.)
- Specific dates (2024-12-25, December 25, etc.)

## Cost Considerations
- The AI uses Google's Gemini 1.5 Flash model
- Gemini offers a generous free tier with rate limits
- Free tier: 15 requests per minute, 1 million tokens per day
- Monitor your usage at [Google AI Studio](https://aistudio.google.com/)

## Troubleshooting

### "Gemini API request failed"
- Verify your API key is correct
- Check you haven't exceeded the free tier rate limits
- Ensure there are no typos in the `.env` file

### Tasks not updating on dashboard
- Refresh the page
- Check the browser console for errors
- Verify the MongoDB connection is working

### AI not understanding commands
- Be specific with task titles (use quotes if needed)
- Include due dates explicitly
- Try rephrasing your request

## Security Note
⚠️ Never commit your `.env` file to Git. The API key should remain private.
