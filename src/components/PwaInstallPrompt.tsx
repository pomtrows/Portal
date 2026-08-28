import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMacSafari, setIsMacSafari] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // 2. Detect iOS / iPadOS
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // 3. Detect Safari macOS
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isMac = /Macintosh|Mac OS X/i.test(ua);
    if (isSafari && isMac && !isIOSDevice) {
      setIsMacSafari(true);
    }

    // 4. Capture beforeinstallprompt (Chrome, Edge, Chromium, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if dismissed before
      const dismissed = localStorage.getItem('portal_pwa_dismissed');
      if (!dismissed) {
        // Show after a brief delay for a smooth first-time experience
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1800);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If on iOS or Safari macOS and not dismissed, show prompt
    const dismissed = localStorage.getItem('portal_pwa_dismissed');
    if (!dismissed && (isIOSDevice || (isSafari && isMac))) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setInstalled(true);
      setIsVisible(false);
      localStorage.setItem('portal_pwa_installed', 'true');
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsVisible(false);
          setInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA install error:', err);
      }
    } else if (isIOS || isMacSafari) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSGuide(false);
    localStorage.setItem('portal_pwa_dismissed', 'true');
  };

  if (installed || (!isVisible && !showIOSGuide)) return null;

  return (
    <>
      {/* Floating Bottom Toast Prompt */}
      {isVisible && !showIOSGuide && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="glass-panel p-4 sm:p-4.5 rounded-2xl shadow-2xl border border-[var(--color-primary)]/40 bg-[var(--color-surface)]/95 backdrop-blur-xl relative overflow-hidden flex flex-col gap-3">
            {/* Ambient background glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--color-primary)]/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-start gap-3.5">
              {/* App Icon */}
              <img
                src="/apple-touch-icon.png"
                alt="Portal Icon"
                className="w-12 h-12 rounded-xl shadow-lg border border-white/20 flex-shrink-0 object-cover"
              />

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm sm:text-base text-[var(--color-text-strong)] tracking-tight">
                    Installer l'application Portal
                  </h3>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                  Accédez à votre portail en 1 clic depuis votre écran d'accueil, avec lancement instantané et plein écran !
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-black/10 transition-colors"
                title="Ignorer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleInstallClick}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:opacity-90 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-[var(--color-primary)]/25 transition-all"
              >
                <Download size={16} />
                <span>Installer l'application</span>
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-xs font-semibold text-[var(--color-text-muted)] transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safari / iOS / macOS Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-black/10 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <img
                src="/apple-touch-icon.png"
                alt="Portal Icon"
                className="w-12 h-12 rounded-xl shadow-lg border border-white/20 flex-shrink-0"
              />
              <div>
                <h3 className="font-bold text-base text-[var(--color-text-strong)]">
                  Installer sur Safari
                </h3>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {isIOS ? 'iPhone / iPad' : 'macOS'}
                </p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 pt-2 text-xs text-[var(--color-text)]">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="p-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold">
                    1
                  </div>
                  <div>
                    Appuyez sur le bouton <strong>Partager</strong> <Share size={14} className="inline mx-1 text-[var(--color-primary)]" /> en bas de l'écran dans Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="p-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold">
                    2
                  </div>
                  <div>
                    Faites défiler et touchez <strong>Sur l'écran d'accueil</strong> <PlusSquare size={14} className="inline mx-1 text-emerald-400" />.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="p-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold">
                    3
                  </div>
                  <div>
                    Touchez <strong>Ajouter</strong> en haut à droite pour finaliser l'installation !
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2 text-xs text-[var(--color-text)]">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="p-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold">
                    1
                  </div>
                  <div>
                    Dans la barre de menu Safari en haut, cliquez sur <strong>Fichier</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                  <div className="p-1.5 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold">
                    2
                  </div>
                  <div>
                    Sélectionnez <strong>Ajouter au Dock...</strong> pour créer l'application autonome macOS.
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowIOSGuide(false);
                setIsVisible(false);
                localStorage.setItem('portal_pwa_dismissed', 'true');
              }}
              className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};
