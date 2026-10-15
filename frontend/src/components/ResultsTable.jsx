import React from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, ExternalLink } from 'lucide-react';

const ResultsTable = ({ results, onSelectRow }) => {
  const severityColors = {
    CRITICAL: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    HIGH: 'text-electric-red bg-electric-red/10 border-electric-red/20',
    MEDIUM: 'text-electric-yellow bg-electric-yellow/10 border-electric-yellow/20',
    LOW: 'text-electric-blue bg-electric-blue/10 border-electric-blue/20',
    INFO: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  };

  const severityIcons = {
    CRITICAL: <ShieldAlert size={14} />,
    HIGH: <AlertTriangle size={14} />,
    MEDIUM: <Info size={14} />,
    LOW: <CheckCircle size={14} />,
    INFO: <Info size={14} />,
  };

  return (
    <div className="glass-panel overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-gray-400 uppercase text-[11px] font-bold tracking-wider">
          <tr>
            <th className="px-6 py-4">Severity</th>
            <th className="px-6 py-4">Issue</th>
            <th className="px-6 py-4">Location</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Confidence</th>
            <th className="px-6 py-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {(!results || results.length === 0) ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                No issues detected or scan not started yet.
              </td>
            </tr>
          ) : (
            results.map((row, idx) => {
              const sevKey = (row.severity || 'MEDIUM').toUpperCase();
              const sevStyle = severityColors[sevKey] || severityColors.MEDIUM;
              const sevIcon = severityIcons[sevKey] || severityIcons.MEDIUM;
              const issueTitle = row.issue || row.title || row.message || 'Issue Detected';
              const locationText = row.location || (row.file ? `${row.file}:${row.line || 0}` : 'Unknown');
              const categoryText = (row.category || 'STATIC').toUpperCase();
              const confidence = row.confidence ?? 80;

              return (
                <tr 
                  key={idx} 
                  onClick={() => onSelectRow(row)}
                  className="hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold w-fit ${sevStyle}`}>
                      {sevIcon}
                      {sevKey}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-200 line-clamp-1">{issueTitle}</div>
                    {row.id && <span className="text-[10px] text-gray-500 font-mono">{row.id}</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                    {locationText}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold tracking-wider bg-white/5 text-gray-300 border border-white/10 uppercase">
                      {categoryText}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            confidence >= 90 ? 'bg-emerald-400' : confidence >= 70 ? 'bg-electric-blue' : 'bg-electric-yellow'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, confidence))}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-gray-400">{confidence}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ExternalLink size={14} className="text-gray-600 group-hover:text-electric-blue transition-colors inline" />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;
