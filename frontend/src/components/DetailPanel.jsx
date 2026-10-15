import React from 'react';
import { X, AlertCircle, Lightbulb, Code, ShieldCheck, MapPin } from 'lucide-react';

const DetailPanel = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  const title = data ? (data.issue || data.title || data.message || 'Issue Details') : '';
  const location = data ? (data.location || (data.file ? `${data.file}:${data.line || 0}` : 'Unknown Location')) : '';
  const tools = data && Array.isArray(data.reported_by) && data.reported_by.length > 0 ? data.reported_by : ['SVP'];
  const confidence = data ? (data.confidence ?? 80) : 80;
  const severity = data ? (data.severity || 'MEDIUM').toUpperCase() : 'MEDIUM';

  const sevColors = {
    CRITICAL: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    HIGH: 'text-electric-red bg-electric-red/10 border-electric-red/20',
    MEDIUM: 'text-electric-yellow bg-electric-yellow/10 border-electric-yellow/20',
    LOW: 'text-electric-blue bg-electric-blue/10 border-electric-blue/20',
    INFO: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl h-full bg-midnight-dark border-l border-white/10 p-8 overflow-y-auto animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-electric-red" />
            <h2 className="text-2xl font-bold text-white">Issue Details</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {data ? (
          <div className="space-y-6">
            {/* Meta tags bar */}
            <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-white/10">
              <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${sevColors[severity] || sevColors.MEDIUM}`}>
                {severity}
              </span>
              {data.id && (
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
                  {data.id}
                </span>
              )}
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                <ShieldCheck size={14} />
                Confidence: {confidence}%
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-gray-400">Engine:</span>
                <span className="px-2.5 py-0.5 rounded bg-electric-blue/10 text-electric-blue border border-electric-blue/20 text-xs font-semibold">
                  VeriX Consensus
                </span>
              </div>
            </div>

            {/* Title / Description */}
            <section>
              <h4 className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">Description</h4>
              <p className="text-base text-gray-200 leading-relaxed font-medium">{title}</p>
            </section>

            {/* Location */}
            <section className="bg-white/5 p-3 rounded-lg border border-white/10 flex items-center gap-2 text-xs font-mono text-gray-300">
              <MapPin size={16} className="text-electric-blue shrink-0" />
              <span className="truncate">{location}</span>
            </section>

            {/* Real Evidence Code Snippet */}
            <section className="glass-panel p-4 border-l-4 border-electric-red">
              <div className="flex items-center gap-2 mb-3 text-electric-red">
                <Code size={18} />
                <h4 className="text-sm font-bold uppercase tracking-tight">Verified Code Evidence</h4>
              </div>
              <pre className="bg-midnight-darkest p-4 rounded-lg font-mono text-xs text-gray-300 overflow-x-auto whitespace-pre leading-5 border border-white/5">
                {data.evidence && data.evidence.trim() !== ""
                  ? data.evidence
                  : "// No code snippet extracted for this anomaly."}
              </pre>
            </section>

            {/* Recommendation */}
            <section>
              <div className="flex items-center gap-2 mb-3 text-electric-blue">
                <Lightbulb size={18} />
                <h4 className="text-sm font-bold uppercase tracking-tight">Recommendation & Solution</h4>
              </div>
              <p className="text-gray-300 leading-relaxed bg-electric-blue/5 p-4 rounded-lg border border-electric-blue/20 text-sm">
                {data.recommendation || "Review this section of code and apply standard security parameterization or refactoring."}
              </p>
            </section>
          </div>
        ) : (
          <p className="text-gray-500">No data selected.</p>
        )}
      </div>
    </div>
  );
};

export default DetailPanel;
