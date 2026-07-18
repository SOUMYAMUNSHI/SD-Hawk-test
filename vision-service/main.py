from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from camera import camera_manager
from detector import detector
import cv2

import time

app = FastAPI(title="SD-Hawk Vision Service")

@app.on_event("shutdown")
def shutdown_event():
    camera_manager.stop_all()

class CameraSyncRequest(BaseModel):
    cameras: list[dict] # list of {"id": str, "source": str}

@app.get("/health")
def health_check():
    return {"status": "success", "message": "Vision Service is running"}

@app.post("/sync_cameras")
def sync_cameras(req: CameraSyncRequest):
    # Stop cameras that are not in the list
    new_ids = [c["id"] for c in req.cameras]
    for cid in camera_manager.get_all_camera_ids():
        if cid not in new_ids:
            camera_manager.stop(cid)
            
    # Start new cameras
    for c in req.cameras:
        if c["id"] not in camera_manager.get_all_camera_ids():
            camera_manager.start(c["id"], c["source"])
            
    return {"status": "success", "message": "Cameras synchronized", "active": camera_manager.get_all_camera_ids()}

@app.get("/detect")
def get_detections():
    # Detect objects on ALL active cameras and return {camera_id: [objects]}
    results = {}
    for cid in camera_manager.get_all_camera_ids():
        frame = camera_manager.read_frame(cid)
        if frame is not None:
            results[cid] = detector.detect(frame)["objects"]
        else:
            results[cid] = []
    return {"status": "success", "data": results}

def generate_frames(camera_id: str, boxes: int = 1):
    import numpy as np
    # Create a dummy "Loading" frame
    loading_frame = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.putText(loading_frame, "Initializing or Blocked by Windows Privacy...", (20, 240), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    ret_dummy, buffer_dummy = cv2.imencode('.jpg', loading_frame)
    dummy_bytes = buffer_dummy.tobytes()

    while True:
        frame = camera_manager.read_frame(camera_id)
        if frame is None:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + dummy_bytes + b'\r\n')
            time.sleep(0.5)
            continue
            
        if boxes == 1:
            try:
                detections = detector.detect(frame)["objects"]
                for obj in detections:
                    x1, y1, x2, y2 = obj["box"]
                    label = f'{obj["type"]} {obj["confidence"]}'
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 255), 2)
                    cv2.rectangle(frame, (x1, y1 - 20), (x1 + len(label)*10, y1), (255, 0, 255), -1)
                    cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
            except Exception as e:
                print("Detection error:", e)
            
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            time.sleep(0.1)
            continue
            
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.033) # roughly 30fps

@app.get("/video_feed")
def video_feed(camera_id: str, boxes: int = 1):
    if camera_id not in camera_manager.get_all_camera_ids():
        raise HTTPException(status_code=404, detail="Camera not found or not active")
    return StreamingResponse(generate_frames(camera_id, boxes), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/snapshot")
def get_snapshot(camera_id: str, boxes: int = 1):
    frame = camera_manager.read_frame(camera_id)
    if frame is None:
        raise HTTPException(status_code=400, detail="No frame available for this camera")
        
    if boxes == 1:
        detections = detector.detect(frame)["objects"]
        for obj in detections:
            x1, y1, x2, y2 = obj["box"]
            label = f'{obj["type"]} {obj["confidence"]}'
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 0, 255), 2)
            cv2.rectangle(frame, (x1, y1 - 20), (x1 + len(label)*10, y1), (255, 0, 255), -1)
            cv2.putText(frame, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
    ret, buffer = cv2.imencode('.jpg', frame)
    if not ret:
        raise HTTPException(status_code=500, detail="Failed to encode image")
        
    return Response(content=buffer.tobytes(), media_type="image/jpeg")
