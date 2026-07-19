# SD-Hawk User Guide

Welcome to SD-Hawk! This guide explains how to connect your cameras (webcams, IP cameras, and CCTV systems) and how to configure powerful AI rules to protect your premises.

---

## 1. Adding Cameras

SD-Hawk supports almost any type of camera feed, powered by OpenCV in the backend. 

### How to add a camera:
1. Navigate to the **Camera Manager** page using the sidebar.
2. Click the **+ Add Camera** button in the top right.
3. Fill out the form:
   - **Camera Name**: A recognizable name (e.g., "Front Door", "Cash Register").
   - **Camera Type**: Select Webcam, IP, or CCTV. *(Note: This is purely for visual organization on the dashboard. The backend will automatically handle the stream based entirely on the source).*
   - **Source (ID or URL)**: This is the most important field. See below for what to put here depending on your camera.
4. Click **Save Camera**.

### Sourcing Different Camera Types:

#### A. Webcams (USB or Built-in)
For webcams directly connected to the computer running the SD-Hawk software, the source is a numeric ID.
- **Source**: `0` (This targets the default/primary webcam on the system).
- If you have multiple webcams plugged in, try `1`, `2`, etc., until you find the right one.
- *Tip for testing:* You can add multiple cameras with source `0` to test the multi-camera dashboard layout!

#### B. IP Cameras & Wi-Fi Cameras (Standalone)
For standalone IP or Wi-Fi cameras (e.g., Reolink, Tapo, Amcrest) that connect directly to your router, you will use their individual RTSP URLs. 
- **Example format**: `rtsp://username:password@camera_ip_address:554/stream1`
- **Example**: `rtsp://admin:admin%40123@192.168.1.50:554/stream1`

> [!IMPORTANT]  
> If your camera password contains special characters like `@` or `#`, you **MUST** URL-encode them in the link. For example, if your password is `admin@123`, you must write it as `admin%40123` in the RTSP link. Failing to do so will cause the connection to fail!

#### C. CCTV / NVR / DVR Systems (e.g., CP Plus, Dahua, Hikvision)
If you have a hardwired CCTV system connected to a central NVR/DVR box, you connect to the *box* itself. You must replace the IP address in the link with the actual local IP address of your DVR box (e.g., `192.168.0.100`).

**How to add multiple cameras (e.g., 5 cameras from one DVR):**
You will add 5 separate cameras in the SD-Hawk Camera Manager. Every camera will use the exact same IP address, username, and password in the RTSP link. The *only* thing you change is the **channel number** at the end of the link!

- **CP Plus / Dahua Example**:
  - Camera 1: `rtsp://admin:admin%40123@192.168.0.100:554/cam/realmonitor?channel=1&subtype=0`
  - Camera 2: `rtsp://admin:admin%40123@192.168.0.100:554/cam/realmonitor?channel=2&subtype=0`
  - Camera 3: `rtsp://admin:admin%40123@192.168.0.100:554/cam/realmonitor?channel=3&subtype=0`
  - *(And so on...)*

- **Hikvision Example**:
  - Camera 1: `rtsp://admin:admin%40123@192.168.0.100:554/Streaming/Channels/101`
  - Camera 2: `rtsp://admin:admin%40123@192.168.0.100:554/Streaming/Channels/201`
  - Camera 3: `rtsp://admin:admin%40123@192.168.0.100:554/Streaming/Channels/301`
  - *(And so on...)*

*Note: Ensure your SD-Hawk computer is on the same local Wi-Fi/Ethernet network as your CCTV box!*

---

## 2. Setting Up AI Rules

Once your camera is running, you can configure AI guard rules on the **Rules Engine** page.

### Creating a Basic Rule
A Basic Rule uses local math and the YOLOv8 model to detect general objects incredibly fast.
1. Click **+ Create New Rule**.
2. Select your Target Camera.
3. Select **Basic** as the Rule Type.
4. Choose an **Object Type** to look for (e.g., "person", "cell phone", "car").
5. Choose the **Trigger Condition**:
   - `Include`: Alert me if this object IS seen.
   - `Exclude`: Alert me if ANY object OTHER than this is seen.
6. **(Crucial) Draw Zone**: Click the **Draw Zone on Camera** button. Click and drag a box over the specific area you want to monitor (e.g., just the doorway). The AI will ignore the rest of the frame.
7. Click **Save Rule**.

### Creating an Advanced (AI Custom) Rule
An Advanced Rule combines the local Virtual Zone with the cloud-based **Groq Vision LLM** to understand complex context (e.g., "Is someone stealing?").
1. Click **+ Create New Rule**.
2. Select your Target Camera.
3. Select **Advanced: AI Custom Prompt** as the Rule Type.
4. **Custom AI Prompt**: Type exactly what you want the AI to look for in plain English. (See the Real-World Scenarios section below for perfect examples!)
5. **Draw Zone**: Click the **Draw Zone on Camera** button and draw a box over the area of interest (e.g., the checkout counter). 
6. Click **Save Rule**.

### How Advanced Rules Work Behind the Scenes:
1. The local software watches the Virtual Zone you drew.
2. When the *Target Object* enters that specific zone, it acts as a tripwire.
3. The software instantly takes a high-resolution snapshot and sends it to the Groq Cloud AI along with your custom English prompt.
4. Groq looks at the image, reads your question, and decides if it should trigger an alert. If yes, you get an email with the image and Groq's reasoning!

---

## 3. Real-World AI Custom Rule Scenarios

To get the most out of SD-Hawk, you need to use the Dropdown (Target Object) as the Tripwire, and the Custom Prompt as the Filter.

### Scenario 1: The Retail Store Checkout
**Goal:** You want to know if a customer walks behind the employee checkout counter. However, you don't want an alert when your cashier is standing there.
- **Target Object (Tripwire):** `person`
- **Virtual Zone:** Draw a rectangle *only* over the floor space behind the cash register.
- **Custom AI Prompt:** *"Is this person wearing the green employee uniform? If they are wearing the green uniform, return false. If they are wearing regular clothes, they are an unauthorized customer, so return true."*

### Scenario 2: The Smart Home Driveway
**Goal:** You want to be alerted if a strange car pulls into your driveway, but you don't want alerts when *your* red Honda Civic parks there.
- **Target Object (Tripwire):** `car`
- **Virtual Zone:** Draw a large rectangle over your driveway.
- **Custom AI Prompt:** *"Look closely at the car in this image. Is it a Red Honda Civic? If it is a Red Honda Civic, return false because that is my car. If it is any other color or brand of vehicle, return true to alert me of an unknown visitor."*

### Scenario 3: The Classroom Exam Monitor
**Goal:** You want an alert if a student pulls out their phone during an exam.
- **Target Object (Tripwire):** `cell phone`
- **Virtual Zone:** Draw a large rectangle covering all the student desks.
- **Custom AI Prompt:** *"Is someone holding this cell phone? If the cell phone is just sitting flat on a desk, return false. If a student is actively holding it in their hand or looking at it, return true because they are cheating."*
