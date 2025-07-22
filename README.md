 help developers run your full-stack app easily:

markdown
Copy
Edit
# 🍳 Cache_and_Cook — Full Stack React App

This is a full-stack web application built with:

- **Frontend**: React (inside `src/`)
- **Backend**: Node.js & Express (inside `backend/`)

---

## 🔧 Prerequisites

Before running the project, make sure the following are installed:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

---

## 🗂️ Project Structure

Cache_and_Cook/
├── backend/ # Express/Node backend
│ ├── server.js # Main backend entry point
│ └── ... # Backend files/routes/controllers
├── src/ # React frontend
│ ├── public/
│ ├── src/
│ │ ├── components/
│ │ ├── App.js
│ │ └── index.js
│ ├── package.json # Frontend package config
│ └── ...
├── README.md
└── package.json # Optional: Root-level scripts

yaml
Copy
Edit

---

## 🚀 Running the App Locally

### 🖥️ Step 1: Start the Backend

In your terminal:

```bash
cd backend
npm install       # Install backend dependencies
node server.js    # Start the Express backend on http://localhost:5000
Note: Make sure server.js listens on port 5000 or update it accordingly.

🌐 Step 2: Start the Frontend (React App)
Open a new terminal tab/window and run:

bash
Copy
Edit
cd src
npm install       # Install frontend dependencies
npm start         # Runs frontend at http://localhost:3000
🔗 Connect Frontend to Backend
To forward API requests from frontend to backend during development, add this line in src/package.json:

json
Copy
Edit
"proxy": "http://localhost:5000"
This allows API calls like /api/recipes to automatically forward to http://localhost:5000/api/recipes.

🏗️ Building for Production
To create an optimized build of the frontend:

bash
Copy
Edit
cd src
npm run build
You can then serve the React build folder from your backend:

js
Copy
Edit
// In backend/server.js (Express)
const path = require('path');
app.use(express.static(path.join(__dirname, '../src/build')));
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../src', 'build', 'index.html'));
});



📄 License
This project is licensed under the MIT License. 
