import React, { useState, useEffect } from 'react';
import StoryMode from './components/StoryMode';
import ChatMode from './components/ChatMode';
import { AppMode } from './types';
import { BookOpenIcon, ChatBubbleLeftRightIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.STORYTELLER);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('muse_theme');
    if (saved) {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('muse_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('muse_theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row transition-colors duration-200">
      {/* Sidebar Navigation */}
      <nav className="md:w-20 lg:w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col justify-between flex-shrink-0 z-20 transition-colors duration-200">
        <div>
          <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-100 dark:border-slate-700">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200 dark:shadow-none">
              M
            </div>
            <span className="ml-3 font-bold text-slate-800 dark:text-slate-100 hidden lg:block tracking-tight">Muse AI</span>
          </div>

          <div className="p-2 md:p-4 space-y-2">
            <button
              onClick={() => setMode(AppMode.STORYTELLER)}
              className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${
                mode === AppMode.STORYTELLER
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookOpenIcon className="w-6 h-6" />
              <span className="hidden lg:block">Storyteller</span>
            </button>

            <button
              onClick={() => setMode(AppMode.CHAT)}
              className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${
                mode === AppMode.CHAT
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
              <span className="hidden lg:block">Chat</span>
            </button>
          </div>
        </div>

        <div className="p-2 md:p-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? (
              <>
                <SunIcon className="w-6 h-6" />
                <span className="hidden lg:block">Light Mode</span>
              </>
            ) : (
              <>
                <MoonIcon className="w-6 h-6" />
                <span className="hidden lg:block">Dark Mode</span>
              </>
            )}
          </button>
          <div className="mt-2 text-center hidden lg:block">
             <div className="text-xs text-slate-400 dark:text-slate-600">Powered by Gemini</div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow h-[calc(100vh-4rem)] md:h-screen p-4 md:p-6 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
           {mode === AppMode.STORYTELLER ? <StoryMode /> : <ChatMode />}
        </div>
      </main>

      {/* Mobile Nav (Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-around z-50 transition-colors duration-200">
          <button onClick={() => setMode(AppMode.STORYTELLER)} className={`flex flex-col items-center ${mode === AppMode.STORYTELLER ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <BookOpenIcon className="w-6 h-6" />
            <span className="text-[10px] mt-1">Story</span>
          </button>
          <button onClick={() => setMode(AppMode.CHAT)} className={`flex flex-col items-center ${mode === AppMode.CHAT ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <span className="text-[10px] mt-1">Chat</span>
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="flex flex-col items-center text-slate-400">
            {darkMode ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            <span className="text-[10px] mt-1">Theme</span>
          </button>
      </div>
    </div>
  );
};

export default App;