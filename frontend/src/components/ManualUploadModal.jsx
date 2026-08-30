import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { api } from '../api';

export default function ManualUploadModal({ isOpen, onClose, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [busId, setBusId] = useState('BUS-104');
  const [routeId, setRouteId] = useState('Route 115');
  const [locationName, setLocationName] = useState('Custom Inspection Site');
  const [latitude, setLatitude] = useState(18.5558);
  const [longitude, setLongitude] = useState(73.9064);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an image file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('bus_id', busId);
      formData.append('route_id', routeId);
      formData.append('location_name', locationName);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('speed_kmh', 32.0);

      const res = await api.ingestImage(formData);
      setResult(res);
      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process image through AI pipeline.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Edge-AI On-Demand Frame Ingestion</h2>
              <p className="text-xs text-slate-500 font-mono">Test YOLOv8 & Pothole Models Live</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleUpload} className="p-5 space-y-4">
          
          {/* File Dropzone */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
            {previewUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-200 max-h-48 bg-slate-950">
                <img src={previewUrl} alt="Preview" className="w-full h-48 object-contain" />
                <button
                  type="button"
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                  className="absolute top-2 right-2 bg-slate-900/80 text-white p-1 rounded-md text-xs hover:bg-slate-900"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block py-4">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-semibold text-blue-600 hover:underline">
                  Click to select a road/dashcam frame
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">PNG, JPG, JPEG up to 10MB</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Metadata Parameters */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Bus Node ID</label>
              <input
                type="text"
                value={busId}
                onChange={(e) => setBusId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Route Corridor</label>
              <input
                type="text"
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 font-medium mb-1 text-xs">Location Name</label>
            <input
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-blue-600"
            />
          </div>

          {/* Results preview if finished */}
          {result && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-900">
              <div className="font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Frame Processed Successfully!</span>
              </div>
              <div className="text-[11px] text-emerald-800 font-mono">
                Vehicles: {result.detection.total_vehicles} ({result.detection.density_level}) · Potholes: {result.detection.pothole_count} ({result.detection.highest_severity})
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !selectedFile}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
            >
              {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isProcessing ? 'Running YOLOv8...' : 'Process Frame'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
