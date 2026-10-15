import React, { useState } from 'react';
import { Play, FolderOpen, FileCode } from 'lucide-react';

const ScanTrigger = ({ onScanStart }) => {
  const [path, setPath] = useState('');

  return (
    <div className="glass-panel p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
        <Play size={18} className="text-electric-blue" /> 
        Initiate Verification Scan
      </h3>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <FolderOpen size={18} />
          </div>
          <input 
            type="text" 
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/home/user/project/src"
            className="w-full bg-midnight-darkest border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-electric-blue transition-colors text-white"
          />
        </div>
        <button 
          onClick={() => onScanStart(path)}
          className="bg-electric-blue text-midnight-darkest px-6 py-2 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-neon-blue"
        >
          <FileCode size={18} />
          Start Verification
        </button>
      </div>
    </div>
  );
};

export default ScanTrigger;
