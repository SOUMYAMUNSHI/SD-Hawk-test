import cv2

class CameraManager:
    def __init__(self):
        self.capture = None
        self.is_running = False

    def start(self, source=0):
        if self.is_running:
            return False
        
        # If the source is a numeric string (like "0"), convert it to an integer for webcams
        if isinstance(source, str) and source.isdigit():
            source = int(source)

        # Open the webcam or RTSP stream
        self.capture = cv2.VideoCapture(source)
        if not self.capture.isOpened():
            print(f"Failed to open camera source: {source}")
            return False
            
        self.is_running = True
        return True

    def stop(self):
        self.is_running = False
        if self.capture:
            self.capture.release()
            self.capture = None

    def read_frame(self):
        if not self.is_running or not self.capture:
            return None
        
        ret, frame = self.capture.read()
        if not ret:
            return None
            
        return frame

camera_manager = CameraManager()
