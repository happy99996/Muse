import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { streamChatMessage } from '../services/geminiService';
import { fileToBase64 } from '../utils';
import { PaperAirplaneIcon, PhotoIcon, TrashIcon } from '@heroicons/react/24/solid';

const LOCAL_STORAGE_KEY = 'muse_chat_history';

const ChatMode: React.FC = () => {
  // Initialize state from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Sanitize loaded messages to remove stuck loading states
        return parsed.map((m: ChatMessage) => ({ ...m, isLoading: false }));
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        const base64 = await fileToBase64(e.target.files[0]);
        setSelectedImage(base64);
      } catch (err) {
        console.error("Image load failed");
      }
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: selectedImage || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    // Placeholder for bot message
    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: botMsgId, role: 'model', text: '', isLoading: true }]);

    try {
      // Prepare history for API (excluding current message)
      const history = messages.map(m => ({
        role: m.role,
        text: m.text,
        image: m.image ? { data: m.image, mimeType: 'image/jpeg' } : undefined
      }));

      const stream = streamChatMessage(
        history, 
        userMsg.text, 
        userMsg.image ? { data: userMsg.image, mimeType: 'image/jpeg' } : undefined
      );

      let fullText = '';
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(m => 
          m.id === botMsgId 
            ? { ...m, text: fullText, isLoading: false } 
            : m
        ));
      }

    } catch (error) {
      setMessages(prev => prev.map(m => 
        m.id === botMsgId 
          ? { ...m, text: "Sorry, I encountered an error. Please try again.", isLoading: false } 
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Muse Chat</h2>
        <button 
            onClick={handleClearChat} 
            className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
            title="Clear Chat"
        >
            <TrashIcon className="w-3 h-3" /> Clear
        </button>
      </div>

      {/* Message List */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-white">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
             <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <PaperAirplaneIcon className="w-8 h-8 text-indigo-300" />
             </div>
             <p>Start a conversation...</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-slate-100 text-slate-800 rounded-bl-none'
              }`}
            >
              {msg.image && (
                <img 
                  src={`data:image/jpeg;base64,${msg.image}`} 
                  alt="User uploaded" 
                  className="max-w-full rounded-lg mb-2 max-h-48 object-cover"
                />
              )}
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                 {msg.text}
                 {msg.isLoading && <span className="inline-block w-2 h-2 ml-1 bg-current rounded-full animate-pulse"/>}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-white">
        {selectedImage && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 rounded-lg border border-slate-200 inline-flex">
                <span className="text-xs text-slate-500">Image attached</span>
                <button onClick={() => setSelectedImage(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
        )}
        <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Upload Image"
          >
            <PhotoIcon className="w-6 h-6" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageSelect}
          />
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your message..."
            className="flex-grow bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 resize-none py-2 max-h-32 min-h-[44px]"
            rows={1}
          />
          
          <button 
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage) || isLoading}
            className={`p-2 rounded-lg transition-all ${
              (!input.trim() && !selectedImage) || isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
            }`}
          >
            <PaperAirplaneIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMode;