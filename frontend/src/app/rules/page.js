'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ListChecks, Trash2, Clock, Plus, Target, Camera, Edit2 } from 'lucide-react';

const COCO_CLASSES = [
  "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
  "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
  "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
  "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
  "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
  "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
  "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
  "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote",
  "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator", "book",
  "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
];

export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);

  const [newRule, setNewRule] = useState({
    name: '',
    camera: '',
    objectType: 'person',
    ruleType: 'Include',
    timeRange: { start: '00:00', end: '23:59' },
    includeSnapshot: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, camsRes] = await Promise.all([
        fetch('http://localhost:5000/api/rules'),
        fetch('http://localhost:5000/api/cameras')
      ]);
      const rulesData = await rulesRes.json();
      const camsData = await camsRes.json();
      setRules(rulesData);
      setCameras(camsData);
      
      if (camsData.length > 0 && !newRule.camera) {
        setNewRule(prev => ({ ...prev, camera: camsData[0]._id }));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await fetch(`http://localhost:5000/api/rules/${id}`, { method: 'DELETE' });
      setRules(rules.filter(r => r._id !== id));
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingRuleId ? `http://localhost:5000/api/rules/${editingRuleId}` : 'http://localhost:5000/api/rules';
      const method = editingRuleId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRule)
      });
      
      if (res.ok) {
        fetchData();
        closeForm();
      } else {
        alert('Failed to save rule');
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingRuleId(null);
    setNewRule({
      name: '',
      camera: cameras.length > 0 ? cameras[0]._id : '',
      objectType: 'person',
      ruleType: 'Include',
      timeRange: { start: '00:00', end: '23:59' },
      includeSnapshot: true
    });
  };

  const openEditForm = (rule) => {
    setNewRule({
      name: rule.name,
      camera: rule.camera?._id || rule.camera,
      objectType: rule.objectType,
      ruleType: rule.ruleType,
      timeRange: { start: rule.timeRange?.start || '00:00', end: rule.timeRange?.end || '23:59' },
      includeSnapshot: rule.includeSnapshot
    });
    setEditingRuleId(rule._id);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <ListChecks className="text-emerald-500" /> Rule Builder
          </h1>
          <p className="text-neutral-400 mt-1">Configure advanced logic for your cameras.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-semibold rounded-lg transition-colors"
        >
          {isAdding ? 'Cancel' : <><Plus size={20} /> New Rule</>}
        </button>
      </header>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl"
        >
          <h2 className="text-xl font-semibold mb-4 border-b border-neutral-800 pb-2">Create New Rule</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1">
              <label className="text-sm text-neutral-400">Rule Name</label>
              <input required type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white" 
                value={newRule.name} onChange={e => setNewRule({...newRule, name: e.target.value})} placeholder="e.g. Nighttime Watch" />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-neutral-400">Target Camera</label>
              <select className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white"
                value={newRule.camera} onChange={e => setNewRule({...newRule, camera: e.target.value})}>
                {cameras.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-neutral-400">Target Object</label>
              <input required list="coco-classes" type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white" 
                value={newRule.objectType} onChange={e => setNewRule({...newRule, objectType: e.target.value.toLowerCase()})} placeholder="e.g. person, car, dog" />
              <datalist id="coco-classes">
                {COCO_CLASSES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-neutral-400">Rule Type</label>
              <select className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white"
                value={newRule.ruleType} onChange={e => setNewRule({...newRule, ruleType: e.target.value})}>
                <option value="Include">Alert ON this object</option>
                <option value="Exclude">Alert on ANYTHING EXCEPT this object</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-neutral-400">Start Time (24h)</label>
              <input required type="time" className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white" 
                value={newRule.timeRange.start} onChange={e => setNewRule({...newRule, timeRange: {...newRule.timeRange, start: e.target.value}})} />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-neutral-400">End Time (24h)</label>
              <input required type="time" className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white" 
                value={newRule.timeRange.end} onChange={e => setNewRule({...newRule, timeRange: {...newRule.timeRange, end: e.target.value}})} />
            </div>

            <div className="md:col-span-2 pt-4">
              <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold rounded-lg transition-colors">
                Save Rule
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="text-neutral-400">Loading rules...</div>
      ) : rules.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl text-center text-neutral-400">
          No active rules. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule, i) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              key={rule._id} 
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 relative"
            >
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => openEditForm(rule)} className="p-2 text-neutral-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(rule._id)} className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>

              <h2 className="text-xl font-bold text-white mb-1 pr-16">{rule.name}</h2>
              <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4">
                <Camera size={14} /> 
                {/* Fallback to 'Unknown' if populate failed or camera was deleted */}
                {rule.camera ? (rule.camera.name || rule.camera) : 'Unknown Camera'}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-neutral-950 rounded-lg p-3 border border-neutral-800/50">
                  <Target size={18} className="text-blue-500" />
                  <div>
                    <div className="text-xs text-neutral-500 uppercase font-semibold">Target Object</div>
                    <div className="text-sm font-medium">
                      {rule.ruleType === 'Exclude' ? 'Anything EXCEPT ' : ''}
                      <span className="text-emerald-400">'{rule.objectType}'</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-neutral-950 rounded-lg p-3 border border-neutral-800/50">
                  <Clock size={18} className="text-purple-500" />
                  <div>
                    <div className="text-xs text-neutral-500 uppercase font-semibold">Active Hours</div>
                    <div className="text-sm font-medium">{rule.timeRange?.start || '00:00'} - {rule.timeRange?.end || '23:59'}</div>
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
