import React from 'react';
import { X, Bot, Cpu, ShieldCheck, Activity, Zap, CheckCircle2 } from 'lucide-react';

export default function AIAgentsDrawer({ onClose }) {
  const agents = [
    {
      id: 'road-defect',
      name: 'Road Defect Detection Agent',
      code: 'AGENT-PTH-01',
      model: 'YOLOv8 + RDD2022 Pretrained Weights',
      status: 'ONLINE',
      fps: '32 FPS',
      confidence: '94.2%',
      latency: '4.2ms',
      hardware: 'NVIDIA CUDA RTX 3050',
      description: 'Continuously processes bus windshield video feed to detect surface cavities, potholes, and road fractures. Computes geometric depth and area estimates.'
    },
    {
      id: 'vehicle-counter',
      name: 'Vehicle Counting & Density Agent',
      code: 'AGENT-TRF-02',
      model: 'YOLOv8n (COCO Multiclass: Car, Bus, Truck, Bike)',
      status: 'ONLINE',
      fps: '48 FPS',
      confidence: '96.8%',
      latency: '3.1ms',
      hardware: 'NVIDIA CUDA RTX 3050',
      description: 'Calculates real-time vehicular flow per frame, identifies transit choke points, and flags High Vehicle Density events along bus corridors.'
    },
    {
      id: 'geo-spatial',
      name: 'Geo-Spatial Telemetry Agent',
      code: 'AGENT-GEO-03',
      model: 'Transit Corridor Map-Matching Engine',
      status: 'ONLINE',
      fps: '60 Hz',
      confidence: '99.4%',
      latency: '1.2ms',
      hardware: 'Edge GPS/IMU Fusion',
      description: 'Interpolates bus route waypoints, matches frame timestamps to exact road coordinates, and eliminates duplicate defect reports through spatial clustering.'
    },
    {
      id: 'incident-router',
      name: 'Municipal Priority Dispatch Agent',
      code: 'AGENT-DSP-04',
      model: 'Rule-based Severity & Hazard Classifier',
      status: 'ONLINE',
      fps: 'Async',
      confidence: '98.0%',
      latency: '5.0ms',
      hardware: 'Central Cloud Server',
      description: 'Evaluates defect severity, assigns priority ratings (LOW, MEDIUM, HIGH, CRITICAL), and queues work orders for city road maintenance crews.'
    }
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-200 sticky top-0 bg-white z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">AI Agent Network Architecture</h2>
            <p className="text-xs text-slate-500 font-mono">4 Edge & Central Micro-Agents Active</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Agents List */}
      <div className="p-5 space-y-4">
        {agents.map((agent) => (
          <div key={agent.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 hover:bg-white hover:border-blue-300 transition-all space-y-3 shadow-2xs">
            
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-xs">{agent.name}</span>
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {agent.code}
                  </span>
                </div>
                <div className="text-[11px] text-blue-700 font-mono mt-0.5">{agent.model}</div>
              </div>
              <span className="text-[10px] font-bold font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{agent.status}</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {agent.description}
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-[11px] font-mono">
              <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                <span className="text-slate-400 block text-[9px]">THROUGHPUT</span>
                <span className="font-bold text-slate-900">{agent.fps}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                <span className="text-slate-400 block text-[9px]">CONFIDENCE</span>
                <span className="font-bold text-blue-700">{agent.confidence}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                <span className="text-slate-400 block text-[9px]">INFERENCE</span>
                <span className="font-bold text-emerald-700">{agent.latency}</span>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-center justify-between font-mono">
        <span>Framework: FastAPI + PyTorch + CUDA</span>
        <span className="text-blue-700 font-bold">100% Edge Autonomous</span>
      </div>

    </div>
  );
}
