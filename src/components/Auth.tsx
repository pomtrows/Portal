import { useState } from 'react';
import { supabase } from '../utils/supabase';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Vérifiez vos emails pour confirmer votre compte !');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-[var(--color-text-strong)] mb-6 text-center">
          {isSignUp ? 'Créer un compte' : 'Se connecter'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/10 border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/10 border border-[var(--color-border)] rounded-lg px-4 py-2 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--color-primary)] text-white py-2 rounded-lg font-medium hover:bg-[var(--color-primary)]/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Chargement...' : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            {isSignUp ? 'Déjà un compte ? Connectez-vous' : 'Pas de compte ? Créez-en un'}
          </button>
        </div>
      </div>
    </div>
  );
};
