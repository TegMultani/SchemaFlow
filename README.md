# SchemaFlow 🚀

A modern, collaborative database diagram modeling tool. Build your database schemas with a clean, dark-mode interface and sync them in real-time.

## Features

- **Visual Modeling**: Drag-and-drop tables, groups, and relationships.
- **Real-time Collaboration**: Projects are synced via Firebase Realtime Database using 6-digit access codes.
- **Smart Sidebar**: Collapsible directory view of all your tables and columns.
- **Export/Import**: Save your diagrams as JSON files locally.
- **Interactive Minimap**: Easily navigate large schemas.

## Tech Stack

- **Frontend**: React + Vite
- **Diagramming**: [XYFlow (React Flow)](https://reactflow.dev/)
- **Icons**: Lucide React
- **Persistence**: Firebase Realtime Database (via REST API)
- **Styling**: Vanilla CSS (Modern design system)

## Environment Setup

To get the Firebase persistence working, you need to create a `.env.local` file in the root directory (this file is git-ignored):

```env
VITE_FIREBASE_DB_URL=https://your-project-id-default-rtdb.firebaseio.com
```

### Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Realtime Database**.
3. Set your **Rules** to public for prototyping (or add auth later):
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
4. Copy your Database URL into the `.env` file.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

## Deployment

This app is ready to be deployed to **Vercel** or **Netlify**. Ensure you add `VITE_FIREBASE_DB_URL` to your deployment's environment variables.
