# SD-Hawk Documentation

This document outlines the architectural flow, component interaction, and design decisions of the SD-Hawk Hybrid Surveillance System.

## 1. System Architecture

SD-Hawk uses a **Hybrid Microservices Architecture**, separating the heavy computational AI work (Computer Vision) from the business logic, orchestration, and frontend interface.

### The Three Pillars
1. **Frontend (Next.js - Port 3000):** A sleek, dark-themed React application using TailwindCSS and Framer Motion. It communicates with the Node.js backend via REST for CRUD operations and WebSockets (`Socket.IO`) for real-time AI detection streams.
2. **Backend (Node.js/Express - Port 5000):** The core orchestrator. It manages MongoDB storage, authenticates users (JWT), evaluates business logic (Zones, Schedules), sends alert emails (Nodemailer), and queries the Cloud LLM (Groq Vision).
3. **Vision Service (Python/FastAPI - Port 8000):** A highly concurrent, multi-threaded video processing engine. It loads `YOLOv8n` via PyTorch and ultralytics, grabs frames from `cv2.VideoCapture`, and provides MJPEG streams to the frontend while simultaneously serving bounding box detection coordinates to the Node.js backend.

---

## 2. Multi-Camera Concurrency

To support multiple video feeds without dropping frames or blocking the Python event loop, the Vision Service uses a **Multi-Threaded Architecture**.

- **Camera Manager (`vision-service/camera.py`)**: 
  - Maintains a dictionary mapping source hardware/URLs to dedicated threads.
  - When a camera is registered via `/sync_cameras`, it spins up a `threading.Thread` dedicated exclusively to fetching `cv2.VideoCapture` frames.
  - This thread continuously reads the latest frame and stores it behind a `threading.Lock()` to prevent race conditions.
  - **Multiplexing:** If multiple cameras in the database use the exact same source (e.g., both use `0` for the same USB webcam), the `CameraManager` elegantly shares the underlying hardware stream across multiple UI references using a reference counter, preventing driver lockups.

---

## 3. The Hybrid "Math + LLM" Surveillance Model

SD-Hawk minimizes API costs and maximizes contextual awareness by using a two-stage hybrid approach.

### Stage 1: The Math Path (Local Tracking & Virtual Zones)
Instead of sending every frame to a cloud API, all baseline detection runs 100% locally using the YOLOv8 model on the Python server.
- The user draws a **Virtual Zone** on the frontend, saving `x, y, width, height` coordinates to MongoDB.
- Every second, Node.js polls the Python `/detect` endpoint.
- Node.js computes an AABB (Axis-Aligned Bounding Box) mathematical intersection between the YOLOv8 object coordinates and the user's Virtual Zone.
- If an object crosses the Virtual Zone, Stage 2 triggers.

### Stage 2: The Genius Path (Groq Vision LLM)
If the crossed rule was configured as an **"AI Custom Prompt"**:
1. Node.js checks its **Concurrency Lock** to ensure the specific camera rule isn't already actively waiting for an AI response.
2. Node.js instantly fetches a high-resolution snapshot from Python (`/snapshot?camera_id=...`).
3. Node.js sends the snapshot (base64) along with the user's custom English prompt to Groq (utilizing advanced reasoning models like `qwen-2.5-vl-72b`).
4. Because reasoning models output raw thoughts before their final answer, Node.js runs a strict Regex to completely nuke any `<think>...</think>` blocks, ensuring the parser cleanly extracts the JSON payload.
5. Node.js evaluates the clean `{"alert": true}` response, logs the AI summary to the database, and dispatches the alert pipeline.

---

## 5. Notification Pipeline & Rate Limiting

To ensure the system is effective in real-world scenarios without becoming a spam vector, SD-Hawk utilizes a robust alert pipeline:

- **Multi-Channel Alerts:** When a rule violation is confirmed (either mathematically or via AI), the system dispatches both a rich HTML Email (via Nodemailer) and an instant SMS text message (via Twilio).
- **60-Second Cooldowns:** To prevent alert storms (e.g., 30 emails sent while a person is continuously standing in a restricted zone), the system implements a strict 60-second debounce per rule. This cooldown timer *only* starts if an alert is successfully fired. If the AI determines there is no violation, the system continues to check every second without penalty until the violation actually occurs.

---

## 4. Boot-up Orchestration & Race Conditions

Because Turborepo starts both Node.js and Python concurrently on `npm run dev`, Python (loading PyTorch) will always boot slower than Node.js. 

To prevent Node.js from attempting to sync database cameras before Python is ready, `initVisionService` in `vision.service.js` employs a graceful retry loop. It pings the Python API every 2 seconds. Once Python returns a `200 OK`, Node.js transmits the camera payload, seamlessly synchronizing the state.
