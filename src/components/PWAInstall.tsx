import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle2, WifiOff } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-700 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>You are currently offline — Viewing your saved bills. Reconnect to send new M-Pesa requests.</span>
    </div>
  );
};

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'hero';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'android' | 'ios' | 'desktop'>(
    isIOS ? 'ios' : 'android'
  );

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>Get Mobile App</span>
          </span>
          <Download className="w-3.5 h-3.5 shrink-0" />
        </button>
      ) : variant === 'hero' ? (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-700" />
          <span>Install on Android or iPhone</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Get App</span>
        </button>
      )}

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  S
                </div>
                <div>
                  <h3 id="pwa-install-title" className="text-sm font-bold text-slate-900">
                    Install SplitPesa on Your Phone or Computer
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Fast home screen access on Android, iPhone & Desktop
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close install dialog"
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {isInstallable && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                  <div className="text-xs text-emerald-900">
                    <div className="font-bold">One-Click Install Ready</div>
                    <div>Add SplitPesa directly to your home screen now.</div>
                  </div>
                  <button
                    type="button"
                    onClick={install}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg whitespace-nowrap cursor-pointer"
                  >
                    Install Now
                  </button>
                </div>
              )}

              {/* Device Selector Tabs */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveDeviceTab('android')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeDeviceTab === 'android'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDeviceTab('ios')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeDeviceTab === 'ios'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  iPhone / iPad
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDeviceTab('desktop')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeDeviceTab === 'desktop'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Computer
                </button>
              </div>

              {activeDeviceTab === 'android' && (
                <div className="space-y-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="font-bold text-slate-900">
                    How to install on Android (Chrome):
                  </div>
                  <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                    <li>
                      Open SplitPesa in <strong>Google Chrome</strong> on your Android phone.
                    </li>
                    <li>
                      Tap the <strong>three dots menu (⋮)</strong> in the top-right corner.
                    </li>
                    <li>
                      Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </li>
                  </ol>
                </div>
              )}

              {activeDeviceTab === 'ios' && (
                <div className="space-y-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="font-bold text-slate-900">
                    How to install on iPhone or iPad (Safari):
                  </div>
                  <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                    <li className="flex items-center gap-1.5 flex-wrap">
                      <span>1. Tap the</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-semibold">
                        <Share className="w-3 h-3 text-emerald-700" /> Share
                      </span>
                      <span>button at the bottom of Safari.</span>
                    </li>
                    <li className="flex items-center gap-1.5 flex-wrap">
                      <span>2. Scroll down and tap</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-semibold">
                        <PlusSquare className="w-3 h-3 text-emerald-700" /> Add to Home Screen
                      </span>
                      <span>.</span>
                    </li>
                    <li>
                      3. Tap <strong>Add</strong> in the top-right corner to finish.
                    </li>
                  </ol>
                </div>
              )}

              {activeDeviceTab === 'desktop' && (
                <div className="space-y-3 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="font-bold text-slate-900">
                    How to install on Windows or Mac (Chrome / Edge):
                  </div>
                  <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                    <li>
                      Look at the right side of your browser’s address bar for the{' '}
                      <strong>Install icon</strong>.
                    </li>
                    <li>
                      Click <strong>Install</strong> to launch SplitPesa in its own clean window.
                    </li>
                  </ol>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Works full-screen just like a native app</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
