import React, { useState, useRef } from 'react';
import { StoryState } from '../types';
import { fileToBase64, decodeAudioData, audioBufferToWavBlob } from '../utils';
import { generateStoryFromImage, generateSpeech } from '../services/geminiService';
import { ArrowUpTrayIcon, SparklesIcon, SpeakerWaveIcon, StopIcon } from '@heroicons/react/24/solid';

const StoryMode: React.FC = () => {
  const [state, setState] = useState<StoryState>({
    image: null,
    generatedStory: null,
    isGeneratingStory: false,
    isGeneratingAudio: false,
    audioBlobUrl: null,
    error: null,
  });

  const [promptInput, setPromptInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setState(prev => ({ 
        ...prev, 
        image: base64, 
        generatedStory: null, 
        audioBlobUrl: null, 
        error: null 
      }));
    } catch (err) {
      setState(prev => ({ ...prev, error: "Failed to process image." }));
    }
  };

  const handleGenerateStory = async () => {
    if (!state.image) return;

    setState(prev => ({ ...prev, isGeneratingStory: true, error: null, generatedStory: null, audioBlobUrl: null }));
    try {
      const story = await generateStoryFromImage(state.image, 'image/jpeg', promptInput.trim() || undefined);
      setState(prev => ({ ...prev, generatedStory: story, isGeneratingStory: false }));
    } catch (err) {
      setState(prev => ({ ...prev, isGeneratingStory: false, error: "Failed to generate story. Please try again." }));
    }
  };

  const handleGenerateAudio = async () => {
    if (!state.generatedStory) return;

    setState(prev => ({ ...prev, isGeneratingAudio: true, error: null }));
    try {
      const base64Audio = await generateSpeech(state.generatedStory);
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      const audioBuffer = await decodeAudioData(base64Audio, audioContext);
      const wavBlob = audioBufferToWavBlob(audioBuffer);
      const audioUrl = URL.createObjectURL(wavBlob);

      setState(prev => ({ ...prev, isGeneratingAudio: false, audioBlobUrl: audioUrl }));
      
      // Auto-play
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play();
        }
      }, 100);

    } catch (err) {
      setState(prev => ({ ...prev, isGeneratingAudio: false, error: "Failed to generate audio." }));
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors duration-200">
      {/* Left Panel: Image & Controls */}
      <div className="md:w-1/2 bg-slate-50 dark:bg-slate-900/50 p-6 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Visual Prompt</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Upload an image to inspire the AI storyteller.</p>

        <div 
          className={`flex-grow border-2 border-dashed rounded-xl flex items-center justify-center relative min-h-[300px] transition-colors ${
            state.image 
              ? 'border-slate-300 dark:border-slate-600 bg-black' 
              : 'border-indigo-200 dark:border-slate-700 bg-indigo-50 dark:bg-slate-800/50 hover:bg-indigo-100 dark:hover:bg-slate-800 cursor-pointer'
          }`}
          onClick={() => !state.image && fileInputRef.current?.click()}
        >
            {state.image ? (
              <>
                <img 
                  src={`data:image/jpeg;base64,${state.image}`} 
                  alt="Uploaded" 
                  className="max-h-full max-w-full object-contain"
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); setState(prev => ({...prev, image: null})); }}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </>
            ) : (
              <div className="text-center p-6">
                <ArrowUpTrayIcon className="w-12 h-12 text-indigo-400 dark:text-slate-500 mx-auto mb-2" />
                <p className="text-indigo-600 dark:text-slate-300 font-medium">Click to upload photo</p>
                <p className="text-indigo-400 dark:text-slate-500 text-xs mt-1">Supports JPG, PNG</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg" 
              onChange={handleImageUpload} 
            />
        </div>

        <div className="mt-6 space-y-4">
           <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
               Story Instructions (Optional)
             </label>
             <textarea 
               value={promptInput}
               onChange={(e) => setPromptInput(e.target.value)}
               placeholder="E.g., Write a scary ghost story about this place..."
               className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
               rows={2}
             />
           </div>

           <button
            onClick={handleGenerateStory}
            disabled={!state.image || state.isGeneratingStory}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-semibold text-white transition-all shadow-lg ${
              !state.image || state.isGeneratingStory
                ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed shadow-none text-slate-500 dark:text-slate-500'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 dark:hover:shadow-none'
            }`}
          >
            {state.isGeneratingStory ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Dreaming up a story...
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                Write Story
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right Panel: Story & Audio */}
      <div className="md:w-1/2 p-8 flex flex-col relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] dark:bg-none dark:bg-slate-900 transition-colors duration-200">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 font-serif">The Story</h2>
        
        {state.generatedStory ? (
          <div className="flex-grow overflow-y-auto mb-20 pr-2">
            <p className="text-lg leading-loose text-slate-800 dark:text-slate-300 serif whitespace-pre-line animate-fade-in">
              {state.generatedStory}
            </p>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-400 dark:text-slate-500 italic serif text-center px-8">
            "Every picture tells a story. Upload one to hear it."
          </div>
        )}

        {/* Audio Player Sticky Footer */}
        {state.generatedStory && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 flex items-center justify-between transition-transform">
            {state.audioBlobUrl ? (
              <div className="w-full flex items-center gap-4">
                <audio ref={audioRef} controls src={state.audioBlobUrl} className="w-full h-10 accent-indigo-600" />
              </div>
            ) : (
               <button
                onClick={handleGenerateAudio}
                disabled={state.isGeneratingAudio}
                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-medium border transition-colors ${
                  state.isGeneratingAudio 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900 text-indigo-400' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {state.isGeneratingAudio ? (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                    Synthesizing Voice...
                  </>
                ) : (
                  <>
                    <SpeakerWaveIcon className="w-5 h-5" />
                    Read Aloud
                  </>
                )}
              </button>
            )}
          </div>
        )}
        
        {state.error && (
            <div className="absolute top-4 left-4 right-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200 p-3 rounded-lg text-sm flex justify-between items-center shadow-md">
                <span>{state.error}</span>
                <button onClick={() => setState(s => ({...s, error: null}))} className="text-red-800 dark:text-red-100 hover:text-red-900 font-bold">&times;</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default StoryMode;