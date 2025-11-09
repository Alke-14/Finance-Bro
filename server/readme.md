# Finance-Bro Server

Minimal instructions to run the Node server.

## Prerequisites
- Node.js (16+ recommended)
- npm or yarn
- A Google Gemini API key
- A MongoDB connection URI

## Environment variables
Create a `.env` file in the project root (same level as `app.js`) with at least:

```
GOOGLE_GEMINI_API_KEY=your_google_gemini_key_here
MONGO_URI=mongodb+srv://user:password@cluster0.mongodb.net/dbname?retryWrites=true&w=majority
PORT=3000
```

Adjust variable names to match what the app expects if different.

## Install
From the project root (where `app.js` lives), run:

```
npm install
```

## Run
Make sure you run the application from the project root. Start the server with:

```
node app.js
```

Or add a script in `package.json` and run `npm start` if preferred.

## Troubleshooting
- Ensure `GOOGLE_GEMINI_API_KEY` is valid and has required permissions.
- Ensure `MONGO_URI` allows connections from your IP and credentials are correct.
- Check console logs for startup errors and missing env variables.
