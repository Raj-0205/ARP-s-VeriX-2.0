import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import StatsCard from './components/StatsCard';
import ScanTrigger from './components/ScanTrigger';
import ResultsTable from './components/ResultsTable';
import DetailPanel from './components/DetailPanel';
import FilterBar from './components/FilterBar';
import ScanHistory from './components/ScanHistory';
import Login from './components/Login';
import { scanProject, getGlobalStats, getReportMetadata, login } from './api/client';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [globalScans, setGlobalScans] = useState(() => Number(localStorage.getItem('verix_total_scans')) || 0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentScanId, setCurrentScanId] = useState(null);
  const [activeProject, setActiveProject] = useState({ name: 'VeriX Platform', path: '' });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedScope, setSelectedScope] = useState('ALL'); // 'ALL' | 'SOURCE' | 'TESTS'
  const [sortBy, setSortBy] = useState('priority');
  const [currentFullReport, setCurrentFullReport] = useState(null);

  // Local-First Zero-Database Vault (Scan History)
  const [scanHistory, setScanHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('verix_scan_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check for existing token on load
  useEffect(() => {
    const token = localStorage.getItem('verix_token');
    if (token) {
      setIsAuthenticated(true);
      fetchGlobalStats();
    }
    setIsLoadingAuth(false);
  }, []);

  const fetchGlobalStats = async () => {
    try {
      const stats = await getGlobalStats();
      if (stats && typeof stats.total_scans === 'number') {
        setGlobalScans(stats.total_scans);
        localStorage.setItem('verix_total_scans', stats.total_scans);
      }
    } catch (err) {
      console.error("Stats error:", err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const data = await login(username, password);
      localStorage.setItem('verix_token', data.access_token);
      setIsAuthenticated(true);
      fetchGlobalStats();
      return data;
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('verix_token');
    setIsAuthenticated(false);
    setResults([]);
  };

  const handleRowSelect = (row) => {
    setSelectedIssue(row);
    setIsPanelOpen(true);
  };

  const handleScan = async (path) => {
    if (!path) {
      setError("Please provide a path to scan");
      return;
    }

    setIsScanning(true);
    setError(null);
    setResults([]);

    try {
      const response = await scanProject(path);
      if (response.status === 'completed') {
        const foundResults = response.results || [];
        setResults(foundResults);
        setCurrentScanId(response.scan_id || (response.report && response.report.report_id));
        setCurrentFullReport(response.report || null);
        fetchGlobalStats();

        const projName = path.split('/').filter(Boolean).pop() || 'Project';
        setActiveProject({ name: projName, path: projName });

        // Save into local-first scan history
        const newRecord = {
          id: response.scan_id || (response.report && response.report.report_id) || Date.now().toString(),
          project_name: projName,
          path: projName,
          timestamp: new Date().toISOString(),
          duration_seconds: (response.report && response.report.scan_info && response.report.scan_info.duration_seconds) || 0,
          total_issues: foundResults.length,
          summary: {
            by_severity: {
              CRITICAL: foundResults.filter(i => (i.severity || '').toUpperCase() === 'CRITICAL').length,
              HIGH: foundResults.filter(i => (i.severity || '').toUpperCase() === 'HIGH').length,
              MEDIUM: foundResults.filter(i => (i.severity || '').toUpperCase() === 'MEDIUM').length,
              LOW: foundResults.filter(i => (i.severity || '').toUpperCase() === 'LOW').length,
            }
          },
          results: foundResults,
          full_report: response.report || null
        };

        setScanHistory(prev => {
          const updated = [newRecord, ...prev.filter(s => s.id !== newRecord.id)].slice(0, 50);
          try {
            localStorage.setItem('verix_scan_history', JSON.stringify(updated));
          } catch (e) {
            console.warn("Storage full, could not persist scan history", e);
          }
          return updated;
        });
      } else {
        setError("Scan started but not completed immediately.");
      }
      setIsScanning(false);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
      setError("Backend API not reachable or scan failed. Please verify server is running on port 8000.");
      setIsScanning(false);
    }
  };

  // Live Filtering & Sorting
  const filteredResults = useMemo(() => {
    let list = [...results];

    // 1. Live Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => {
        const title = (item.issue || item.title || item.message || '').toLowerCase();
        const file = (item.file || item.file_path || '').toLowerCase();
        const loc = (item.location || '').toLowerCase();
        const id = (item.id || item.issue_id || '').toLowerCase();
        return title.includes(q) || file.includes(q) || loc.includes(q) || id.includes(q);
      });
    }

    // 2. Severity Filter
    if (selectedSeverity !== 'ALL') {
      list = list.filter(item => (item.severity || '').toUpperCase() === selectedSeverity);
    }

    // 3. Category Filter
    if (selectedCategory !== 'ALL') {
      list = list.filter(item => (item.category || '').toUpperCase() === selectedCategory);
    }

    // 4. Scope Filter (Source Code vs Unit Tests)
    if (selectedScope === 'SOURCE') {
      list = list.filter(item => {
        const path = (item.file || item.file_path || '').toLowerCase();
        return !path.includes('/test') && !path.includes('test_') && !path.includes('_test.');
      });
    } else if (selectedScope === 'TESTS') {
      list = list.filter(item => {
        const path = (item.file || item.file_path || '').toLowerCase();
        return path.includes('/test') || path.includes('test_') || path.includes('_test.');
      });
    }

    // 5. Sorting
    list.sort((a, b) => {
      if (sortBy === 'priority') {
        return (b.priority_score || 0) - (a.priority_score || 0);
      }
      if (sortBy === 'confidence') {
        return (b.confidence || 0) - (a.confidence || 0);
      }
      if (sortBy === 'severity') {
        const order = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1 };
        return (order[(b.severity || '').toUpperCase()] || 0) - (order[(a.severity || '').toUpperCase()] || 0);
      }
      if (sortBy === 'location') {
        return (a.location || '').localeCompare(b.location || '');
      }
      return 0;
    });

    return list;
  }, [results, searchQuery, selectedSeverity, selectedCategory, selectedScope, sortBy]);

  // History Actions
  const handleLoadScanFromHistory = (scan) => {
    setResults(scan.results || []);
    setCurrentScanId(scan.id);
    setCurrentFullReport(scan.full_report || null);
    setActiveProject({
      name: scan.project_name || 'Archived Project',
      path: scan.path || ''
    });
    setCurrentView('dashboard');
  };

  const handleDeleteScan = (scanId) => {
    setScanHistory(prev => {
      const updated = prev.filter(s => s.id !== scanId);
      localStorage.setItem('verix_scan_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your local scan history? This action cannot be undone.")) {
      setScanHistory([]);
      localStorage.removeItem('verix_scan_history');
    }
  };

  const handleExportVault = () => {
    const jsonStr = JSON.stringify(scanHistory, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verix_vault_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCurrentReport = () => {
    if (results.length === 0) return;
    const reportData = currentFullReport || {
      report_id: currentScanId || `VXR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      scan_info: {
        report_id: currentScanId,
        scan_id: currentScanId,
        timestamp: new Date().toISOString()
      },
      device_info: {
        os: "Linux",
        python_version: "3.x"
      },
      project: {
        name: activeProject.name,
        root_dir: activeProject.name,
        path: activeProject.name
      },
      summary: {
        TOTAL_ISSUES: results.length,
        by_severity: {
          CRITICAL: results.filter(i => (i.severity || '').toUpperCase() === 'CRITICAL').length,
          HIGH: results.filter(i => (i.severity || '').toUpperCase() === 'HIGH').length,
          MEDIUM: results.filter(i => (i.severity || '').toUpperCase() === 'MEDIUM').length,
          LOW: results.filter(i => (i.severity || '').toUpperCase() === 'LOW').length,
        }
      },
      issues: results
    };

    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (activeProject.name || 'scan').replace(/\s+/g, '_').toLowerCase();
    a.href = url;
    a.download = `${safeName}_verix_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = {
    total: results.length,
    high: results.filter(i => ['CRITICAL', 'HIGH'].includes((i.severity || '').toUpperCase())).length,
    medLow: results.filter(i => ['MEDIUM', 'LOW', 'INFO'].includes((i.severity || '').toUpperCase())).length,
  };

  if (isLoadingAuth) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-midnight-darkest">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-electric-blue"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-midnight-darkest text-gray-200 overflow-hidden">
      <Sidebar 
        currentView={currentView}
        onSelectView={setCurrentView}
        historyCount={scanHistory.length}
        onLogout={handleLogout} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-lg mb-4 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* VIEW 1: DASHBOARD / LIVE SCANNER */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard title="Total Database Scans" value={globalScans} colorClass="bg-gray-600" label="all time" />
                <StatsCard title="Current Issues" value={stats.total} colorClass="bg-electric-blue" label="detected" />
                <StatsCard title="Critical & High" value={stats.high} colorClass="bg-electric-red" label="high impact" />
                <StatsCard title="Medium & Low" value={stats.medLow} colorClass="bg-electric-yellow" label="advisories" />
              </div>

              <ScanTrigger onScanStart={handleScan} />

              {/* Filter Bar (Search, Filters, Sort, Export) */}
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedSeverity={selectedSeverity}
                onSeverityChange={setSelectedSeverity}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedScope={selectedScope}
                onScopeChange={setSelectedScope}
                sortBy={sortBy}
                onSortChange={setSortBy}
                totalResults={results.length}
                filteredCount={filteredResults.length}
                onDownloadReport={handleDownloadCurrentReport}
                onDemandReport={() => {
                  if (!currentScanId) {
                    setError("Please run or load a scan first to demand a full report.");
                    return;
                  }
                  setShowPaymentModal(true);
                }}
                hasResults={results.length > 0}
              />

              {/* Results Table Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white tracking-tight">Verification Findings</h2>
                  <span className="text-xs text-gray-500 font-mono">
                    {isScanning ? 'Scanning in progress...' : `Showing ${filteredResults.length} anomalies`}
                  </span>
                </div>

                {isScanning ? (
                  <div className="glass-panel p-16 flex flex-col items-center justify-center space-y-4 border border-white/10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-electric-blue"></div>
                    <p className="text-electric-blue animate-pulse font-medium text-sm">Orchestrating Multi-Pass Verification...</p>
                  </div>
                ) : (
                  <ResultsTable results={filteredResults} onSelectRow={handleRowSelect} />
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: SCAN HISTORY & ARCHIVE */}
          {currentView === 'history' && (
            <ScanHistory
              history={scanHistory}
              onLoadScan={handleLoadScanFromHistory}
              onDeleteScan={handleDeleteScan}
              onClearHistory={handleClearHistory}
              onExportVault={handleExportVault}
              onSwitchToScanner={() => setCurrentView('dashboard')}
            />
          )}
        </main>
      </div>

      {/* Slide-over Detail Drawer */}
      <DetailPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        data={selectedIssue} 
      />

      {/* Demand Enterprise Report Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-electric-blue/30 animate-fade-in shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Detailed Report Request</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              To generate a full enterprise report, our team will perform a manual code review. 
              <br/><br/>
              <span className="text-electric-blue font-bold">Notice:</span> If the project size is &ge; 1GB, a processing fee of <span className="text-white font-bold">$1 USD</span> is required.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    const meta = await getReportMetadata(currentScanId);
                    const baseUrl = "https://arpgroup.ai.studio/contact";
                    const params = new URLSearchParams({
                      topic: "Other",
                      message: `Report Request: ${meta.project_name}\nTime: ${meta.timestamp}\nDetails: ${meta.request_details}`
                    });
                    window.open(`${baseUrl}?${params.toString()}`, '_blank');
                    setShowPaymentModal(false);
                  } catch (e) {
                    setError("Failed to fetch report metadata.");
                  }
                }}
                className="flex-1 bg-electric-blue text-midnight-darkest py-2 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-all shadow-neon-blue"
              >
                Confirm & Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
