import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  MapPin,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { AiChatMessage, AiSearchFilters } from '../types/ai';
import { Place } from '../types/place';

interface MessageUI {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  matchedPlaces?: Place[];
  filters?: AiSearchFilters | null;
  suggestedQuestions?: string[];
  timestamp: string;
}

const STARTER_PROMPTS = [
  'Find hospitals in Patna with wheelchair-accessible entrances',
  'Colleges with step-free access in Jharkhand',
  'Which places in Bangalore have accessible washrooms?',
  'Explain how the 4-state accessibility model works',
  'What should I look for when auditing an entrance ramp?',
];

export const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<MessageUI[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I am your AccessMap AI Accessibility Assistant. I can help you find accessible venues across India, explain verified accessibility profiles, or help you draft detailed community reports. How can I assist you today?",
      suggestedQuestions: [
        'Find hospitals with wheelchair access',
        'Places with elevators in Metro City',
        'How do I audit an entrance?',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    if (query.length > 1000) {
      setErrorMessage('Input exceeds maximum allowed length of 1000 characters.');
      return;
    }

    setErrorMessage(null);
    setInput('');

    const userMsg: MessageUI = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build conversation history (excluding introductory message)
      const history: AiChatMessage[] = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await aiService.chat({
        message: query,
        history,
      });

      const assistantMsg: MessageUI = {
        id: 'ast_' + Date.now(),
        role: 'assistant',
        content: response.reply,
        matchedPlaces: response.matchedPlaces,
        filters: response.structuredFilters,
        suggestedQuestions: response.suggestedQuestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : 'Unable to complete AI request.';
      setErrorMessage(errText);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content:
            "I encountered a problem processing your request. If this is a natural language search, you can also explore places directly on the Explore page.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Chat cleared. What accessibility information can I look up for you?",
        suggestedQuestions: [
          'Find hospitals with wheelchair access',
          'Places with elevators in Metro City',
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-8 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">AI Accessibility Assistant</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Grounded in DB Records
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Discover accessible locations, interpret verified profiles, and refine reports.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/explore"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-teal-600" />
              <span>Explore Map</span>
            </Link>

            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear conversation"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Conversation Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:px-6 flex flex-col justify-between overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Filter tags if search parameters were extracted */}
                {msg.filters && (msg.filters.category || msg.filters.city || (msg.filters.requiredFeatures && msg.filters.requiredFeatures.length > 0)) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {msg.filters.category && (
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        Category: {msg.filters.category}
                      </span>
                    )}
                    {msg.filters.city && (
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        City: {msg.filters.city}
                      </span>
                    )}
                    {msg.filters.requiredFeatures?.map((f) => (
                      <span key={f} className="text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md">
                        {f.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}

                {/* Matched Real Database Place Cards */}
                {msg.matchedPlaces && msg.matchedPlaces.length > 0 && (
                  <div className="mt-4 space-y-2.5">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      <span>Verified AccessMap Locations ({msg.matchedPlaces.length})</span>
                    </p>
                    <div className="grid grid-cols-1 gap-2.5">
                      {msg.matchedPlaces.map((place) => (
                        <div
                          key={place.id}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 hover:bg-slate-100/80 transition-colors"
                        >
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{place.name}</h4>
                            <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{place.address}, {place.city}</span>
                            </p>
                            <span className="inline-block mt-1 text-[10px] font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                              {place.category}
                            </span>
                          </div>
                          <Link
                            to={`/explore?placeId=${place.id}`}
                            className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg transition-colors shrink-0"
                            title="View Venue Profile"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Questions */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {msg.suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSend(q)}
                        className="text-xs text-teal-700 bg-teal-50/80 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200/80 font-medium transition-colors cursor-pointer text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-teal-100 text-right' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-2 text-slate-500 text-xs">
                <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                <span>Checking verified accessibility database records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Starters (shown when only welcome message exists) */}
        {messages.length === 1 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
              <span>Suggested Queries</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="text-xs text-slate-700 bg-white hover:bg-teal-50 hover:text-teal-800 px-3 py-1.5 rounded-xl border border-slate-200 font-medium transition-all shadow-2xs cursor-pointer text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm flex items-end gap-2 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about accessibility, search for venues, or ask how to file a report... (Press Enter to send)"
            rows={2}
            maxLength={1000}
            className="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden p-1.5"
          />

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[10px] text-slate-600 font-mono">
              {input.length}/1000
            </span>
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AiAssistantPage;
