# SD-Hawk

SD-Hawk is a monorepo AI-powered surveillance system featuring a Next.js dashboard, a Node.js Express backend, and a Python (FastAPI + YOLOv8) vision service. It monitors camera feeds in real-time, processes them using computer vision, and sends intelligent alerts via Groq AI and Nodemailer.

## Prerequisites
- **Node.js**: v18+
- **Python**: 3.10+ (Tested on 3.13)
- **MongoDB**: A running MongoDB instance (local or Atlas)

## Documentation
- [User Guide (Camera Setup & AI Rules)](USER_GUIDE.md)
- [System Architecture & Documentation](DOCUMENTATION.md)

## Global Setup (Recommended)
This project uses Turborepo to manage the monorepo. You can install all dependencies and run the entire stack (Frontend, Backend, and Vision Service) concurrently with just two commands from the root folder!

```bash
# 1. Install Node.js dependencies across all workspaces
npm install

# 2. IMPORTANT: You must manually setup Python for the Vision Service first!
cd vision-service
python -m venv .venv
.venv\Scripts\activate     # (On Mac/Linux use: source .venv/bin/activate)
pip install -r requirements.txt
cd ..

# 3. Start the entire stack concurrently
npm run dev
# (Note: The VERY FIRST time you run this, it will download the YOLOv8 AI model, which may take 1-3 minutes depending on your internet speed).
```

---

## Local Setup (Running Services Individually)

If you prefer to run or debug the services individually, follow these steps:

### 1. Vision Service (Python AI)
The Vision service runs FastAPI and YOLOv8. It requires a Python virtual environment.

```bash
cd vision-service

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server on port 8000
npm run dev
# OR manually: uvicorn main:app --reload --port 8000
```

### 2. Backend (Node.js API & Logic Engine)
The backend handles database CRUD, WebSockets, Groq AI logic, and Emails.

```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
# Create a .env file in the backend folder:
# MONGO_URI=mongodb+srv://...
# JWT_SECRET=your_secret
# GROQ_API_KEY=your_groq_api_key
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password

# Run the server on port 5000
npm run dev
```

### 3. Frontend (Next.js Dashboard)
The Next.js app provides the UI for the system.

```bash
cd frontend

# Install dependencies
npm install

# Run the frontend on port 3000
npm run dev
```

## Architecture
- **Frontend (`:3000`)**: Next.js app with TailwindCSS and Framer Motion.
- **Backend (`:5000`)**: Express + MongoDB + Socket.IO. Handles rules, auth, and AI alerting logic.
- **Vision Service (`:8000`)**: FastAPI + OpenCV + YOLOv8. Captures camera frames, detects objects, and streams MJPEG video back to the frontend.
