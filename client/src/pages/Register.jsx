import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const success = await register({ name, email, password });
    if (success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <h2 className="font-display font-extrabold text-4xl text-accent-primary uppercase tracking-wider">GALAXY FITNESS CLUB</h2>
          <p className="text-text-muted text-[10px] mt-2 font-body uppercase tracking-[0.15em]">Elite Management</p>
        </div>

        {/* Card */}
        <div className="iron-card p-8">
          <h1 className="font-body font-bold text-xl text-white text-center mb-2 uppercase tracking-wide">Register New Admin</h1>
          <p className="text-text-muted text-sm font-body text-center mb-8">Create your operator credentials</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Operator Name"
                className="input-field"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@ironcore.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Access Code</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create access code (min 6 chars)"
                  className="input-field pr-10"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white p-1 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-danger-surface border border-danger/30 rounded-md px-4 py-3 text-danger text-sm font-body">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary w-full mt-6">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
                ) : (
                  'CREATE ACCOUNT'
                )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-text-muted hover:text-accent-primary text-xs font-body transition-colors">
              Already have an account? Login here
            </Link>
          </div>
        </div>

        <p className="text-text-muted font-mono text-[10px] text-center mt-6 tracking-widest uppercase">
          SYS.VER_2.4.1 // RESTRICTED ACCESS
        </p>
      </div>
    </div>
  );
};

export default Register;
