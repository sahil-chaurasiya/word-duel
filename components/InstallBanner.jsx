'use client';

import { useState, useEffect } from 'react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if (isStandalone) return;
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    function onBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setShow(false);
    setDeferredPrompt(null);
  }

  function dismiss() {
    setShow(false);
    localStorage.setItem('pwa-banner-dismissed', String(Date.now()));
  }

  if (!show) return null;

  return (
    <div className="install-banner">
      <span style={{ fontSize: '1.5rem' }}>⚔️</span>
      <div className="install-banner-text">
        Install Word Duel
        <div className="install-banner-sub">Play offline & get faster load times</div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={install}>Install</button>
      <button className="btn btn-ghost btn-sm" onClick={dismiss} style={{ padding: '8px 10px' }}>✕</button>
    </div>
  );
}
