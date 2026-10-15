import React, { useState } from 'react';
import { Lock, User, ShieldCheck } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await onLoginSuccess(username, password);
      localStorage.setItem('verix_token', data.access_token);
    } catch (err) {
      setError('Invalid username or password. Access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-midnight-darkest text-gray-200 p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-white/10 shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-electric-blue/10 rounded-full border border-electric-blue/30">
              <ShieldCheck size={48} className="text-electric-blue" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">VeriX <span className="text-electric-blue">Secure</span></h1>
          <p className="text-gray-500 text-sm mt-2">Enterprise Verification Gateway</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400 tracking-widest">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-midnight-darkest border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-electric-blue transition-colors text-white"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400 tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-midnight-darkest border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-electric-blue transition-colors text-white"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {error && <div className="text-red-400 text-xs text-center font-medium animate-pulse">{error}</div>}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-electric-blue text-midnight-darkest py-3 rounded-lg font-bold text-sm hover:bg-opacity-90 transition-all active:scale-95 shadow-neon-blue flex items-center justify-center gap-2"
          >
            {isLoading ? 'Authenticating...' : 'Authorize Access'}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest">Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
