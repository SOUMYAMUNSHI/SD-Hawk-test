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
   - **Camera Type**: Select Webcam, IP, or CCTV.
   - **Source (ID or URL)**: This is the most important field. See below for what to put here depending on your camera.
4. Click **Save Camera**.

### Sourcing Different Camera Types:

#### A. Webcams (USB or Built-in)
For webcams directly connected to the computer running the SD-Hawk software, the source is a numeric ID.
- **Source**: `0` (This targets the default/primary webcam on the system).
- If you have multiple webcams plugged in, try `1`, `2`, etc., until you find the right one.
- *Tip for testing:* You can add multiple cameras with source `0` to test the multi-camera dashboard layout!

#### B. IP Cameras & Wi-Fi Cameras
Most modern IP cameras provide an RTSP (Real Time Streaming Protocol) URL. You can usually find this in your camera's mobile app or web interface, or by searching for your camera model online.
- **Source**: `rtsp://username:password@camera_ip_address:554/stream1`
- Example: `rtsp://admin:admin1234@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0`

#### C. CCTV / NVR / DVR Systems (e.g., CP Plus, Dahua, Hikvision)
If you have a hardwired CCTV system connected to a central NVR/DVR box, you connect to the *box* itself, specifying which camera channel you want to view.
- **CP Plus Example**: `rtsp://admin:password@192.168.1.108:554/cam/realmonitor?channel=1&subtype=0` 
  - Change `channel=1` to `channel=2` for the second camera, etc.
- **Hikvision Example**: `rtsp://admin:password@192.168.1.108:554/Streaming/Channels/101`
  - Change `101` to `201` for the second camera.

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
4. **Custom AI Prompt**: Type exactly what you want the AI to look for in plain English.
   - *Example 1:* "Is the person in this image looking down at their phone instead of paying attention?"
   - *Example 2:* "Did this customer walk past the register without paying?"
   - *Example 3:* "Is there a weapon visible in this frame?"
5. **Draw Zone**: Click the **Draw Zone on Camera** button and draw a box over the area of interest (e.g., the checkout counter). 
6. Click **Save Rule**.

### How Advanced Rules Work Behind the Scenes:
1. The local software watches the Virtual Zone you drew.
2. When *anything* enters that specific zone, it acts as a tripwire.
3. The software instantly takes a high-resolution snapshot and sends it to the Groq Cloud AI along with your custom English prompt.
4. Groq looks at the image, reads your question, and decides if it should trigger an alert. If yes, you get an email with the image and Groq's reasoning!
