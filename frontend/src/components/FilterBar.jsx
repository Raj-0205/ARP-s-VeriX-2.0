import React from 'react';
import { Search, X, Filter, ArrowUpDown, Download, FileText } from 'lucide-react';

const FilterBar = ({
  searchQuery,
  onSearchChange,
  selectedSeverity,
  onSeverityChange,
  selectedCategory,
  onCategoryChange,
  selectedScope = 'ALL',
  onScopeChange,
  sortBy,
  onSortChange,
  totalResults,
  filteredCount,
  onDownloadReport,
  onDemandReport,
  hasResults
}) => {
  const severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const categories = ['ALL', 'SECURITY', 'STATIC', 'PERFORMANCE'];
  const scopes = [
    { id: 'ALL', label: 'All Files' },
    { id: 'SOURCE', label: 'Source Only' },
    { id: 'TESTS', label: 'Tests Only' }
  ];

  const sevColors = {
    ALL: 'hover:border-white/20 text-gray-300',
    CRITICAL: 'hover:border-rose-500/40 text-rose-400',
    HIGH: 'hover:border-electric-red/40 text-electric-red',
    MEDIUM: 'hover:border-electric-yellow/40 text-electric-yellow',
    LOW: 'hover:border-electric-blue/40 text-electric-blue',
  };

  return (
    <div className="glass-panel p-5 space-y-4 mb-6 border border-white/10 shadow-lg">
      {/* Top Row: Live Search Input + Quick Actions */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search anomalies by title, file path, line number, or keyword..."
            className="w-full bg-midnight-darkest border border-white/10 rounded-lg py-2.5 pl-11 pr-10 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-electric-blue transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1 rounded transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onDownloadReport}
            disabled={!hasResults}
            title={hasResults ? "Download current scan report as JSON" : "Run a scan to export report"}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={15} className="text-electric-blue" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onDemandReport}
            disabled={!hasResults}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-electric-blue/10 hover:bg-electric-blue/20 border border-electric-blue/30 text-electric-blue transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-neon-blue/20"
          >
            <FileText size={15} />
            <span>Demand Full Report</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Multi-Facet Filters & Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/5 text-xs">
        {/* Severity Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-gray-500 font-semibold uppercase text-[10px] tracking-wider mr-1 flex items-center gap-1">
            <Filter size={12} /> Severity:
          </span>
          {severities.map((sev) => {
            const isActive = selectedSeverity === sev;
            return (
              <button
                key={sev}
                onClick={() => onSeverityChange(sev)}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] border transition-all ${
                  isActive
                    ? 'bg-white/15 border-white/30 text-white shadow-sm'
                    : `bg-midnight-darkest border-white/5 ${sevColors[sev] || 'text-gray-400'}`
                }`}
              >
                {sev}
              </button>
            );
          })}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-gray-500 font-semibold uppercase text-[10px] tracking-wider mr-1">
            Category:
          </span>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] border transition-all ${
                  isActive
                    ? 'bg-electric-blue/20 border-electric-blue/40 text-electric-blue'
                    : 'bg-midnight-darkest border-white/5 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Scope Pills (Source vs Tests) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-gray-500 font-semibold uppercase text-[10px] tracking-wider mr-1">
            Scope:
          </span>
          {scopes.map((scope) => {
            const isActive = selectedScope === scope.id;
            return (
              <button
                key={scope.id}
                onClick={() => onScopeChange && onScopeChange(scope.id)}
                className={`px-2.5 py-1 rounded-md font-bold text-[11px] border transition-all ${
                  isActive
                    ? 'bg-purple-500/25 border-purple-500/50 text-purple-300 shadow-sm'
                    : 'bg-midnight-darkest border-white/5 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                {scope.label}
              </button>
            );
          })}
        </div>

        {/* Sorting Dropdown & Match Counter */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5 text-gray-400">
            <ArrowUpDown size={13} className="text-gray-500" />
            <span className="text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-midnight-darkest border border-white/10 rounded-md py-1 px-2 text-[11px] text-gray-200 focus:outline-none focus:border-electric-blue"
            >
              <option value="priority">Priority (Impact)</option>
              <option value="confidence">Confidence (High to Low)</option>
              <option value="severity">Severity (Critical First)</option>
              <option value="location">File Location</option>
            </select>
          </div>

          <div className="text-[11px] font-mono text-gray-400 bg-white/5 px-2.5 py-1 rounded border border-white/10">
            Showing <span className="text-electric-blue font-bold">{filteredCount}</span> of {totalResults}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
