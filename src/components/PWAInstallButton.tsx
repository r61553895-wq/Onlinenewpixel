import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // If already running inside standalone PWA, hide install button
  if (isInstalled) {
    return null;
  }

  // Native beforeinstallprompt flow (Android Chrome, Edge, Desktop Chrome)
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#FF3B30] hover:bg-[#E03126] text-white text-xs font-medium shadow-sm transition-colors cursor-pointer"
        title="Установить приложение на телефон или ПК"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Установить</span>
        <span className="sm:hidden">App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#202227] hover:bg-[#2A2D34] text-neutral-200 border border-neutral-700/60 text-xs font-medium transition-colors cursor-pointer"
          title="Инструкция по установке на iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#00C7BE]" />
          <span className="hidden sm:inline">Установить</span>
          <span className="sm:hidden">App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 pointer-events-auto">
            <div className="w-full max-w-sm rounded-xl bg-[#17181B] border border-[#272A30] p-5 shadow-2xl text-neutral-200 font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-[#272A30]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-[#FF3B30] rounded-xs" />
                  <h3 className="text-sm font-bold text-white tracking-wide">УСТАНОВКА НА IPHONE / IPAD</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded hover:bg-[#252830] text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-neutral-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#242830] text-white flex items-center justify-center font-mono text-[11px] shrink-0">1</span>
                  <span>Нажмите кнопку <strong>«Поделиться» (Share)</strong> в нижней панели Safari.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#242830] text-white flex items-center justify-center font-mono text-[11px] shrink-0">2</span>
                  <span>Пролистайте вниз и выберите <strong>«На экран "Домой"» (Add to Home Screen)</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#242830] text-white flex items-center justify-center font-mono text-[11px] shrink-0">3</span>
                  <span>Нажмите <strong>«Добавить»</strong> в верхнем правом углу.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#242830] hover:bg-[#2D323C] py-2 text-xs font-medium text-white transition-colors"
              >
                Понятно
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback: general install guide button for other browsers / Android Chrome if prompt didn't fire yet
  return (
    <>
      <button
        id="pwa-install-guide-btn"
        onClick={() => setShowAndroidGuide(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#202227] hover:bg-[#2A2D34] text-neutral-200 border border-neutral-700/60 text-xs font-medium transition-colors cursor-pointer"
        title="Как установить как приложение"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#00C7BE]" />
        <span className="hidden sm:inline">Установить</span>
        <span className="sm:hidden">App</span>
      </button>

      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 pointer-events-auto">
          <div className="w-full max-w-sm rounded-xl bg-[#17181B] border border-[#272A30] p-5 shadow-2xl text-neutral-200 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-[#272A30]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#FF3B30] rounded-xs" />
                <h3 className="text-sm font-bold text-white tracking-wide">УСТАНОВКА ПРИЛОЖЕНИЯ</h3>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="p-1 rounded hover:bg-[#252830] text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-neutral-300">
              <p>Игра поддерживает режим <strong>PWA (Progressive Web App)</strong> и может запускаться как настоящее мобильное или десктопное приложение во весь экран:</p>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#242830] text-white flex items-center justify-center font-mono text-[11px] shrink-0">1</span>
                <span>В браузере (Chrome / Я.Браузер / Edge) нажмите на меню <strong>⋮ (три точки)</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#242830] text-white flex items-center justify-center font-mono text-[11px] shrink-0">2</span>
                <span>Выберите пункт <strong>«Установить приложение»</strong> или <strong>«Добавить на главный экран»</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#242830] text-white flex items-center justify-center font-mono text-[11px] shrink-0">3</span>
                <span>На главном экране появится иконка <strong>PIXEL WORLD</strong>, открывающая игру без рамок браузера!</span>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidGuide(false)}
              className="mt-5 w-full rounded-lg bg-[#242830] hover:bg-[#2D323C] py-2 text-xs font-medium text-white transition-colors"
            >
              Понятно
            </button>
          </div>
        </div>
      )}
    </>
  );
};
