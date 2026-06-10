import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import api from '../lib/axios';

const SmartAssistant = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "SYSTEM INITIALIZED. I am your operational assistant. Query me regarding member status, revenue analytics, or daily attendance.", data: null },
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const { data: suggestions } = useQuery({
    queryKey: ['assistantSuggestions'],
    queryFn: async () => { const { data } = await api.get('/assistant/suggestions'); return data.data; },
  });

  const queryMutation = useMutation({
    mutationFn: async (query) => {
      const { data } = await api.post('/assistant/query', { query });
      return data.data;
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer, data: data.data }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: 'assistant', content: "ERROR: Unable to process query. Please retry." }]);
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (query = input.trim()) => {
    if (!query) return;
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setInput('');
    queryMutation.mutate(query);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-6 px-2 no-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 border border-border ${
                msg.role === 'user' ? 'bg-bg-raised' : 'bg-[#0F0F16]'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-text-muted" strokeWidth={2} /> : <Bot className="w-4 h-4 text-accent-primary" strokeWidth={2} />}
              </div>
              <div className={`px-5 py-3.5 shadow-xl ${
                msg.role === 'user'
                  ? 'bg-accent-primary text-black rounded-2xl rounded-br-sm'
                  : 'iron-card rounded-2xl rounded-bl-sm'}`}>
                <p className={`text-sm font-body leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'font-bold' : 'text-text-secondary'}`}>{msg.content}</p>
              </div>
            </div>
          </div>
        ))}

        {queryMutation.isPending && (
          <div className="flex justify-start">
            <div className="flex items-end gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded bg-[#0F0F16] border border-border flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-accent-primary" strokeWidth={2} />
              </div>
              <div className="iron-card px-5 py-4 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1.5 items-center h-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse delay-75" />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse delay-150" />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 px-2 no-scrollbar">
        {suggestions?.map((suggestion, i) => (
          <button key={i} onClick={() => handleSend(suggestion)}
            className="flex-shrink-0 bg-transparent border border-border px-4 py-2 text-[10px] font-body font-bold text-text-secondary hover:text-white hover:border-accent-primary hover:bg-accent-primary/5 uppercase tracking-widest transition-colors rounded-full">
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="iron-card p-2 flex items-center gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ENTER COMMAND OR QUERY..."
          className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-white placeholder-text-muted px-4 py-2 uppercase tracking-wider"
          disabled={queryMutation.isPending}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || queryMutation.isPending}
          className="w-10 h-10 rounded bg-accent-primary text-black flex items-center justify-center disabled:opacity-30 disabled:bg-bg-raised disabled:text-text-muted transition-colors hover:brightness-110"
        >
          <Send className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default SmartAssistant;
