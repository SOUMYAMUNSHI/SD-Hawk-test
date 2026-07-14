import cv2
import threading
import time

class CameraStream:
    def __init__(self, camera_id, source):
        self.camera_id = camera_id
        self.source = source
        self.capture = None
        self.is_running = False
        self.current_frame = None
        self.thread = None
        self.lock = threading.Lock()
        self.ref_count = 0

    def start(self):
        source = self.source
        if isinstance(source, str) and source.isdigit():
            source = int(source)

        self.capture = cv2.VideoCapture(source)
        if not self.capture.isOpened():
            print(f"Failed to open camera: {self.source}")
            return False

        self.is_running = True
        self.thread = threading.Thread(target=self._update, daemon=True)
        self.thread.start()
        return True

    def _update(self):
        while self.is_running:
            if not self.capture or not self.capture.isOpened():
                break
                
            ret, frame = self.capture.read()
            if ret:
                with self.lock:
                    self.current_frame = frame
            else:
                time.sleep(0.1) # Prevent tight loop on failure

    def read(self):
        with self.lock:
            if self.current_frame is not None:
                return self.current_frame.copy()
            return None

    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join(timeout=1.0)
        if self.capture:
            self.capture.release()

class CameraManager:
    def __init__(self):
        self.streams = {} # source (str/int) -> CameraStream
        self.camera_to_source = {} # camera_id (str) -> source

    def start(self, camera_id, source):
        if camera_id in self.camera_to_source:
            self.stop(camera_id)
            
        # Convert source to int if it's a digit string
        if isinstance(source, str) and source.isdigit():
            source = int(source)
            
        self.camera_to_source[camera_id] = source
        
        # If stream for this source already exists, just reuse it!
        if source in self.streams:
            self.streams[source].ref_count += 1
            return True
            
        stream = CameraStream(camera_id, source)
        stream.ref_count = 1
        if stream.start():
            self.streams[source] = stream
            return True
            
        del self.camera_to_source[camera_id]
        return False

    def stop(self, camera_id):
        if camera_id in self.camera_to_source:
            source = self.camera_to_source[camera_id]
            del self.camera_to_source[camera_id]
            
            if source in self.streams:
                self.streams[source].ref_count -= 1
                if self.streams[source].ref_count <= 0:
                    self.streams[source].stop()
                    del self.streams[source]

    def stop_all(self):
        for cid in list(self.camera_to_source.keys()):
            self.stop(cid)

    def get_all_camera_ids(self):
        return list(self.camera_to_source.keys())

    def read_frame(self, camera_id):
        if camera_id in self.camera_to_source:
            source = self.camera_to_source[camera_id]
            if source in self.streams:
                return self.streams[source].read()
        return None

camera_manager = CameraManager()
