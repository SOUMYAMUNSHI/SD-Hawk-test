'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cctv, Shield, Eye, Settings, RefreshCw, EyeOff, ShieldOff } from 'lucide-react';

export default function CamerasPage() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isAdding, setIsAdding] = useState(false);
  const [newCamera, setNewCamera] = useState({ name: '', source: '0', type: 'Webcam' });
  const [host, setHost] = useState('localhost');

  useEffect(() => {
    setHost(window.location.hostname);
    fetchCameras(window.location.hostname);
  }, []);

  const fetchCameras = async (currentHost = host) => {
    try {
      const res = await fetch(`http://${currentHost}:5000/api/cameras`);
      const data = await res.json();
      setCameras(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch cameras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://${host}:5000/api/cameras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCamera)
      });
      if (res.ok) {
        fetchCameras();
        setIsAdding(false);
        setNewCamera({ name: '', source: '0', type: 'Webcam' });
      } else {
        alert('Failed to add camera');
      }
    } catch (error) {
      console.error('Create error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this camera? All attached rules will also be deleted!')) return;
    try {
      await fetch(`http://${host}:5000/api/cameras/${id}`, { method: 'DELETE' });
      setCameras(cameras.filter(c => c._id !== id));
    } catch (error) {
      console.error('Failed to delete camera:', error);
    }
  };

  const toggleSetting = async (camera, setting) => {
    try {
      const updatedValue = !camera[setting];
      
      // Optimistic UI update
      setCameras(prev => prev.map(c => 
        c._id === camera._id ? { ...c, [setting]: updatedValue } : c
      ));

      await fetch(`http://${host}:5000/api/cameras/${camera._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [setting]: updatedValue })
      });
    } catch (error) {
      console.error('Failed to update camera:', error);
      fetchCameras(); // Revert on failure
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Cctv className="text-emerald-500" /> Camera Manager
          </h1>
          <p className="text-neutral-400 mt-1">Configure your active video feeds and AI master controls.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsAdding(!isAdding)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-semibold rounded-lg transition-colors">
            {isAdding ? 'Cancel' : '+ Add Camera'}
          </button>
          <button onClick={() => fetchCameras()} className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
            <RefreshCw size={20} className={loading ? 'animate-spin text-emerald-500' : 'text-neutral-400'} />
          </button>
        </div>
      </header>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl"
        >
          <h2 className="text-xl font-semibold mb-4 border-b border-neutral-800 pb-2">Add New Camera</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1">
              <label className="text-sm text-neutral-400">Camera Name</label>
              <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white" 
                value={newCamera.name} onChange={e => setNewCamera({...newCamera, name: e.target.value})} placeholder="e.g. Backdoor Cam" />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-neutral-400">Source (ID or URL)</label>
              <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white" 
                value={newCamera.source} onChange={e => setNewCamera({...newCamera, source: e.target.value})} placeholder="e.g. 0 or rtsp://..." />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-neutral-400">Camera Type</label>
              <select className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white"
                value={newCamera.type} onChange={e => setNewCamera({...newCamera, type: e.target.value})}>
                <option value="Webcam">USB Webcam</option>
                <option value="IP">IP Camera</option>
                <option value="CCTV">CCTV Stream</option>
              </select>
            </div>

            <div className="md:col-span-3 pt-2">
              <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold rounded-lg transition-colors">
                Save Camera
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="text-neutral-400 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Loading cameras...
        </div>
      ) : cameras.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center text-neutral-400">
          No cameras found. Add one in the database.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cameras.map((camera, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={camera._id} 
              className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Cctv size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white leading-tight">{camera.name}</h2>
                    <span className="text-xs text-neutral-500 font-mono uppercase tracking-wider">{camera.type} • {camera.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-neutral-950 rounded-full border border-neutral-800">
                    <div className={`w-2 h-2 rounded-full ${camera.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-xs text-neutral-400 font-medium">LIVE</span>
                  </div>
                  <button onClick={() => handleDelete(camera._id)} className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>

              {/* Video Preview (Simulated for setup) */}
              <div className="relative aspect-video bg-neutral-950 border-b border-neutral-800 flex items-center justify-center overflow-hidden">
                 <img 
                    src={`http://${host}:8000/video_feed?camera_id=${camera._id}&boxes=${camera.showBoundingBoxes ? '1' : '0'}`}
                    alt={camera.name}
                    className="w-full h-full object-cover opacity-60"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 hidden items-center justify-center flex-col gap-2 text-neutral-700">
                    <Cctv size={48} />
                    <span className="text-sm font-medium">Camera Offline</span>
                  </div>

                  {/* Overlay Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {!camera.aiEnabled && (
                      <span className="px-2 py-1 bg-red-500/80 backdrop-blur-md text-white text-xs font-bold rounded shadow flex items-center gap-1">
                        <ShieldOff size={12}/> AI DISABLED
                      </span>
                    )}
                  </div>
              </div>

              {/* Master Controls */}
              <div className="p-5 grid grid-cols-2 gap-4">
                
                {/* AI Guard Toggle */}
                <button 
                  onClick={() => toggleSetting(camera, 'aiEnabled')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    camera.aiEnabled 
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20' 
                    : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:bg-neutral-800'
                  }`}
                >
                  {camera.aiEnabled ? <Shield size={28} className="mb-2" /> : <ShieldOff size={28} className="mb-2" />}
                  <span className="font-semibold">{camera.aiEnabled ? 'AI Guard Active' : 'AI Guard Disabled'}</span>
                  <span className="text-xs text-center mt-1 opacity-70">
                    {camera.aiEnabled ? 'Processing rules & alerts' : 'Camera ignores all rules'}
                  </span>
                </button>

                {/* Bounding Box Toggle */}
                <button 
                  onClick={() => toggleSetting(camera, 'showBoundingBoxes')}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    camera.showBoundingBoxes 
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20' 
                    : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:bg-neutral-800'
                  }`}
                >
                  {camera.showBoundingBoxes ? <Eye size={28} className="mb-2" /> : <EyeOff size={28} className="mb-2" />}
                  <span className="font-semibold">{camera.showBoundingBoxes ? 'Boxes Visible' : 'Boxes Hidden'}</span>
                  <span className="text-xs text-center mt-1 opacity-70">
                    {camera.showBoundingBoxes ? 'Showing purple outlines' : 'Clean raw video feed'}
                  </span>
                </button>

              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
