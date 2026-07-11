import torch
from ultralytics import YOLO
import ultralytics.nn.tasks

# Fix for PyTorch 2.6 weights_only loading security change which crashes YOLO
_original_load = torch.load
def safe_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return _original_load(*args, **kwargs)
torch.load = safe_load

class ObjectDetector:
    def __init__(self):
        # Load the nano model (fastest, lightweight)
        # It will download automatically on first run
        self.model = YOLO('yolov8n.pt') 

    def detect(self, frame):
        # Run YOLO inference
        results = self.model(frame, verbose=False)
        
        detected_objects = []
        
        # Parse results
        for r in results:
            boxes = r.boxes
            for box in boxes:
                # Class name (e.g., 'person', 'car')
                cls_id = int(box.cls[0])
                class_name = self.model.names[cls_id]
                
                # Confidence score
                confidence = float(box.conf[0])
                
                # Bounding box coordinates [x1, y1, x2, y2]
                xyxy = box.xyxy[0].tolist()
                
                detected_objects.append({
                    "type": class_name,
                    "confidence": round(confidence, 2),
                    "box": [int(coord) for coord in xyxy]
                })
                
        return {"objects": detected_objects}

detector = ObjectDetector()
