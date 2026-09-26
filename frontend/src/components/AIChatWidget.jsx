import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, X, CornerDownLeft, RefreshCw, MessageSquare } from 'lucide-react';
import api from '../services/api';

export default function AIChatWidget({ eventId, eventName, embedded = false }) {
  const [isOpen, setIsOpen] = useState(embedded);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: eventName
        ? `Hello! I am your AI Event Assistant for **${eventName}**. I have live access to your budget allocations, attendee headcount, tasks, and risk profile. How can I assist your planning today?`
        : 'Hello! I am your AI Event Assistant. Ask me anything about budgeting, vendor management, crowd logistics, or timeline structuring.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const samplePrompts = [
    'How much food/catering should I arrange?',
    'What are the major operational risks?',
    'Is my current budget allocation safe?',
    'How many volunteers and check-in desks do I need?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        eventId,
        message: query,
        history: messages.slice(-6)
      });

      if (response.data.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: response.data.data.response }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ I encountered an error connecting to the AI service. Please try again or check your query.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const chatBody = (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 p-4 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
            <Sparkles className="w-5 h-5 text-indigo-200 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight flex items-center">
              AI Event Assistant
              <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                Context-Aware
              </span>
            </h4>
            <p className="text-[11px] text-indigo-200">
              {eventName ? `Active Event: ${eventName}` : 'Global Event Strategy Assistant'}
            </p>
          </div>
        </div>

        {!embedded && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60 min-h-[320px] max-h-[480px]">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-200'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none shadow-xs'
              }`}
            >
              <div className="whitespace-pre-line prose-xs">
                {m.content}
              </div>
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-indigo-600 flex items-center space-x-2 shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="font-medium animate-pulse">Analyzing event database & calculating recommendations...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="px-4 py-2 bg-slate-100/70 border-t border-slate-200/60 flex items-center space-x-2 overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">
          Quick:
        </span>
        {samplePrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            className="text-[11px] bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors flex-shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={eventName ? `Ask AI about ${eventName}...` : 'Type your planning question...'}
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-200 transition-all active:scale-95 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return chatBody;
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl hover:scale-105 transition-all flex items-center space-x-2 active:scale-95 group"
      >
        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-bold pr-1">AI Assistant</span>
      </button>

      {/* Floating Modal Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[540px] animate-in fade-in slide-in-from-bottom-5">
          {chatBody}
        </div>
      )}
    </>
  );
}
