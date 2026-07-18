'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldCheck, Cctv, ServerCrash } from 'lucide-react';
import { socket } from '../lib/socket';

export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState({ loading: true, data: null, error: null });
  const [latestDetection, setLatestDetection] = useState(null);

  const [camera, setCamera] = useState(null);
  const [cameras, setCameras] = useState([]);

  const [selectedCamera, setSelectedCamera] = useState(null);

  useEffect(() => {
    // 1. Fetch Backend HTTP Health
    const fetchHealth = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/health');
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        setApiStatus({ loading: false, data, error: null });
      } catch (error) {
        setApiStatus({ loading: false, data: null, error: error.message });
      }
    };
    fetchHealth();

    // 1.5 Fetch Camera to get display settings
    const fetchCamera = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/cameras');
        const data = await res.json();
        if (Array.isArray(data)) {
          setCameras(data);
          if (data.length > 0) setCamera(data[0]);
        } else {
          setCameras([]);
        }
      } catch (e) {
        console.error('Failed to fetch cameras');
      }
    };
    fetchCamera();

    // 2. Connect to WebSockets for live AI updates
    socket.connect();
    
    socket.on('new_detection', (data) => {
      // Data contains { timestamp, objects: [{type, confidence, box}] }
      setLatestDetection(data);
      
      // Auto-clear the flash after 2 seconds
      setTimeout(() => {
        setLatestDetection(null);
      }, 2000);
    });

    return () => {
      socket.disconnect();
      socket.off('new_detection');
    };
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">System Overview</h1>
        <p className="text-neutral-400 mt-1">Monitor your connected cameras and AI detections in real-time.</p>
      </header>

      {/* Top Status Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            {apiStatus.error ? <ServerCrash size={100} /> : <Activity size={100} />}
          </div>
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className={`p-3 rounded-xl ${apiStatus.error ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
              <Activity size={24} />
            </div>
            <h2 className="text-lg font-semibold">Backend Connection</h2>
          </div>
          
          <div className="relative z-10">
            {apiStatus.loading ? (
              <div className="flex items-center gap-2 text-neutral-400">
                <div className="w-2 h-2 rounded-full bg-neutral-500 animate-pulse"></div>
                Checking status...
              </div>
            ) : apiStatus.error ? (
              <div>
                <div className="text-2xl font-bold text-red-500 mb-1">Offline</div>
                <div className="text-sm text-neutral-400">Failed to connect to port 5000</div>
              </div>
            ) : (
              <div>
                <div className="text-2xl font-bold text-emerald-500 mb-1">Online</div>
                <div className="text-sm text-neutral-400">{apiStatus.data.message}</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI Watchguard Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, backgroundColor: latestDetection ? '#4c1d95' : '#171717' }}
          transition={{ duration: 0.4, backgroundColor: { duration: 0.2 } }}
          className="border border-neutral-800 rounded-2xl p-6 relative overflow-hidden transition-colors"
        >
          <div className={`absolute top-0 right-0 p-4 opacity-10 ${latestDetection ? 'text-white' : 'text-purple-500'}`}>
            <ShieldCheck size={100} />
          </div>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className={`p-3 rounded-xl ${latestDetection ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-500'}`}>
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-lg font-semibold">AI Watchguard</h2>
          </div>
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {latestDetection ? (
                <motion.div
                  key="alert"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-2xl font-bold mb-1">Detected: {latestDetection.objects[0]?.type}</div>
                  <div className="text-sm text-purple-200">
                    Confidence: {latestDetection.objects[0]?.confidence}%
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="standby"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="text-2xl font-bold mb-1">Scanning...</div>
                  <div className="text-sm text-neutral-400">Monitoring feeds</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <h2 className="text-2xl font-bold text-white mt-8 mb-4">Live Camera Feeds ({cameras.length})</h2>
      
      {/* Cameras Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((cam, index) => (
          <motion.div 
            key={cam._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden relative group"
          >
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
                  <Cctv size={20} />
                </div>
                <h2 className="font-semibold">{cam.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${cam.status === 'Online' ? 'bg-red-500 animate-pulse' : 'bg-neutral-500'}`}></div>
                <span className="text-xs text-neutral-400 font-medium">LIVE</span>
              </div>
            </div>
            
            <div className="aspect-video bg-black relative">
              <img 
                src={`http://127.0.0.1:8000/video_feed?camera_id=${cam._id}&boxes=${cam.showBoundingBoxes ? '1' : '0'}`} 
                alt={`Feed for ${cam.name}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="absolute inset-0 hidden items-center justify-center text-neutral-600 flex-col gap-2">
                <Cctv size={48} />
                <p className="text-sm">Camera Offline</p>
              </div>
              
              {/* Expand Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button 
                  onClick={() => setSelectedCamera(cam)}
                  className="px-4 py-2 bg-white text-black font-semibold rounded-lg shadow-lg hover:scale-105 transition-transform"
                >
                  Expand View
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {cameras.length === 0 && !apiStatus.loading && (
          <div className="col-span-full p-8 border border-dashed border-neutral-800 rounded-2xl text-center text-neutral-500">
            No cameras found. Add one in the Camera Manager.
          </div>
        )}
      </div>

      {/* Fullscreen Camera Modal */}
      <AnimatePresence>
        {selectedCamera && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 lg:p-12"
          >
            <div className="w-full max-w-7xl bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col relative h-[80vh]">
              <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900">
                <div className="flex items-center gap-3">
                  <Cctv className="text-emerald-500" />
                  <h2 className="font-bold text-xl">{selectedCamera.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedCamera(null)}
                  className="p-2 bg-neutral-800 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Close View
                </button>
              </div>
              <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                <img 
                  src={`http://127.0.0.1:8000/video_feed?camera_id=${selectedCamera._id}&boxes=${selectedCamera.showBoundingBoxes ? '1' : '0'}`} 
                  alt="Expanded Feed"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 hidden items-center justify-center text-neutral-600 flex-col gap-2">
                  <Cctv size={64} />
                  <p className="text-lg">Camera Offline or Disconnected</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
