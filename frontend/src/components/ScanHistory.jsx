import React, { useState } from 'react';
import { 
  History, 
  Folder, 
  Clock, 
  Download, 
  Trash2, 
  ExternalLink, 
  Search, 
  ShieldCheck, 
  FileCode,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  Play
} from 'lucide-react';

const ScanHistory = ({
  history = [],
  onLoadScan,
  onDeleteScan,
  onClearHistory,
  onExportVault,
  onSwitchToScanner
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const filteredHistory = history.filter((item) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    const nameMatch = (item.project_name || '').toLowerCase().includes(q);
    const pathMatch = (item.path || '').toLowerCase().includes(q);
    return nameMatch || pathMatch;
  });

  const handleDownloadSingle = (scan) => {
    const reportData = scan.full_report || {
      scan_info: {
        timestamp: scan.timestamp,
        duration_seconds: scan.duration_seconds || 0
      },
      project: {
        project_name: scan.project_name,
        root_dir: scan.path
      },
      summary: scan.summary || { TOTAL_ISSUES: scan.total_issues || 0 },
      issues: scan.results || []
    };

    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (scan.project_name || 'project').replace(/\s+/g, '_').toLowerCase();
    a.href = url;
    a.download = `${safeName}_verix_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'Unknown Date';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Vault Management */}
      <div className="glass-panel p-6 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2 bg-electric-blue/10 rounded-lg border border-electric-blue/30">
              <History size={20} className="text-electric-blue" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Scan History & Archive</h2>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-2">
            <HardDrive size={13} className="text-emerald-400" />
            Local-First Zero-Knowledge Vault: Reports are preserved directly in your browser.
          </p>
        </div>

        {/* Global Vault Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onExportVault}
            disabled={history.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download size={14} className="text-electric-blue" />
            <span>Export Full Vault</span>
          </button>

          <button
            onClick={onClearHistory}
            disabled={history.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter / Search within History */}
      {history.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search historical scans by project name or path..."
              className="w-full bg-midnight-darkest border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-electric-blue"
            />
          </div>
          <div className="text-xs text-gray-500 font-mono">
            {filteredHistory.length} of {history.length} archived scans
          </div>
        </div>
      )}

      {/* History Items Grid */}
      {filteredHistory.length === 0 ? (
        <div className="glass-panel p-16 text-center border border-white/10 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-white/5 rounded-full border border-white/10 text-gray-500">
            <FileCode size={36} className="text-electric-blue/60" />
          </div>
          <h3 className="text-lg font-bold text-white">No Scan Records Found</h3>
          <p className="text-sm text-gray-400 max-w-md leading-relaxed">
            {history.length === 0
              ? "Your local vault is currently empty. Run your first verification scan from the dashboard to automatically archive results here."
              : "No archived scans match your search query."}
          </p>
          {history.length === 0 && (
            <button
              onClick={onSwitchToScanner}
              className="bg-electric-blue text-midnight-darkest px-6 py-2.5 rounded-lg font-bold text-xs hover:bg-opacity-90 transition-all shadow-neon-blue flex items-center gap-2 mt-2"
            >
              <Play size={14} />
              <span>Start Verification Scan</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredHistory.map((scan) => {
            const summary = scan.summary || {};
            const bySev = summary.by_severity || {};
            const total = scan.total_issues ?? scan.results?.length ?? 0;
            const isConfirming = confirmDeleteId === scan.id;

            return (
              <div
                key={scan.id}
                className="glass-panel p-5 border border-white/10 hover:border-white/20 transition-all rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                {/* Left: Project & Timestamp */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <Folder size={18} className="text-electric-blue shrink-0" />
                    <h3 className="text-base font-bold text-white truncate tracking-wide">
                      {scan.project_name || 'Unnamed Project'}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                      ID: {scan.id ? scan.id.slice(0, 8) : 'N/A'}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-gray-400 truncate pl-7">
                    {scan.path || 'Unknown directory'}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-gray-500 pl-7 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatTimestamp(scan.timestamp)}
                    </span>
                    {scan.duration_seconds !== undefined && (
                      <span className="font-mono">
                        Duration: {scan.duration_seconds}s
                      </span>
                    )}
                  </div>
                </div>

                {/* Center: Issue Metrics */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-xs text-gray-400">Total:</span>
                    <span className="text-sm font-bold text-white font-mono">{total}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    {(bySev.CRITICAL > 0 || bySev.HIGH > 0) && (
                      <span className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {bySev.CRITICAL || 0} Crit / {bySev.HIGH || 0} High
                      </span>
                    )}
                    <span className="px-2 py-1 rounded bg-electric-yellow/10 text-electric-yellow border border-electric-yellow/20">
                      {bySev.MEDIUM || 0} Med
                    </span>
                    <span className="px-2 py-1 rounded bg-electric-blue/10 text-electric-blue border border-electric-blue/20">
                      {bySev.LOW || 0} Low
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-white/5">
                  <button
                    onClick={() => onLoadScan(scan)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-electric-blue text-midnight-darkest hover:bg-opacity-90 transition-all shadow-neon-blue/30 active:scale-95"
                  >
                    <ExternalLink size={13} />
                    <span>Inspect</span>
                  </button>

                  <button
                    onClick={() => handleDownloadSingle(scan)}
                    title="Download Report JSON"
                    className="p-2 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    <Download size={15} />
                  </button>

                  {isConfirming ? (
                    <div className="flex items-center gap-1 bg-red-500/10 p-1 rounded-lg border border-red-500/20">
                      <button
                        onClick={() => {
                          onDeleteScan(scan.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2 py-1 text-[10px] font-bold text-red-400 hover:text-white transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1 text-[10px] text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(scan.id)}
                      title="Delete from Vault"
                      className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScanHistory;
