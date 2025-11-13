# Quick Start: Adding Your Gemini API Key

## Step 1: Get Your API Key
Visit: https://aistudio.google.com/app/apikey

## Step 2: Update .env File
Open: `planit-next/.env`

Replace this line:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

With your actual key:
```
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## Step 3: Restart Server
Stop the current server (Ctrl+C in terminal) and run:
```bash
npm run dev
```

## Step 4: Access Home Page
Navigate to: http://localhost:3000/home

## Try These Commands:
- "Create a task to prepare presentation by Friday"
- "Add a high priority task for client meeting tomorrow"
- "List my tasks"
- "Delete the presentation task"

That's it! 🎉
