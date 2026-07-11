from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from camera import camera_manager
from detector import detector
import cv2

app = FastAPI(title="SD-Hawk Vision Service")

# Auto-start camera 0 on boot
@app.on_event("startup")
def startup_event():
    print("Auto-starting camera 0 for live testing...")
    camera_manager.start(0)

@app.on_event("shutdown")
def shutdown_event():
    camera_manager.stop()

class CameraSourceRequest(BaseModel):
    source: str | int = 0

@app.get("/health")
def health_check():
    return {"status": "success", "message": "Vision Service is running"}

@app.post("/camera/start")
def start_camera(req: CameraSourceRequest):
    success = camera_manager.start(req.source)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to start camera")
    return {"status": "success", "message": f"Started capturing from {req.source}"}

@app.post("/camera/stop")
def stop_camera():
    camera_manager.stop()
    return {"status": "success", "message": "Camera stopped"}

@app.get("/detect")
def get_detections():
    frame = camera_manager.read_frame()
    
    if frame is None:
        return {"status": "error", "message": "No frame available. Is the camera started?"}
        
    detections = detector.detect(frame)
    return {"status": "success", "data": detections}

def generate_frames():
    while True:
        frame = camera_manager.read_frame()
        if frame is None:
            continue
            
        # Run detection to get boxes
        detections = detector.detect(frame)["objects"]
        
        # Draw bounding boxes on the frame
        for obj in detections:
            x1, y1, x2, y2 = obj["box"]
            label = f'{obj["type"]} {obj["confidence"]}'
            
            # Draw rectangle
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 255), 2)
            # Draw label background
            cv2.rectangle(frame, (x1, y1 - 20), (x1 + len(label)*10, y1), (255, 0, 255), -1)
            # Draw text
            cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
            
        # Encode frame to JPEG
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
            
        frame_bytes = buffer.tobytes()
        
        # Yield in multipart format for MJPEG stream
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")
