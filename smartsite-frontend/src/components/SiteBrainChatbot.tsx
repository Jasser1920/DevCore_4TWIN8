import  { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { exportUsersToPDF, exportCompaniesToPDF } from '../lib/pdfExport';
import { onAuthStateChanged } from '../lib/auth';
import './SiteBrainChatbot.css';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

const INITIAL_MESSAGE: ChatMessage = { role: 'bot', content: 'Hello! I am SiteBrain, your SmartSite AI Assistant. How can I help you today?' };

export default function SiteBrainChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = sessionStorage.getItem('sitebrain_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    return [INITIAL_MESSAGE];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    sessionStorage.setItem('sitebrain_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(() => {
      setMessages([INITIAL_MESSAGE]);
      setIsOpen(false); // Optional: close the chat window on logout
    });
    return unsubscribe;
  }, []);

  const triggerUsersPdfExport = async () => {
    try {
      const response = await apiFetch<{ message: string; users: any[] }>('/users/list');
      if (response && response.users) {
        exportUsersToPDF(response.users);
      }
    } catch (err) {
      console.error('Failed to fetch users for PDF export:', err);
    }
  };

  const triggerCompaniesPdfExport = async () => {
    try {
      const data = await apiFetch<any>('/companies');
      let companiesList = [];
      if (Array.isArray(data)) {
        companiesList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        companiesList = data.data;
      } else if (data?.companies && Array.isArray(data.companies)) {
        companiesList = data.companies;
      }
      
      if (companiesList.length > 0) {
        exportCompaniesToPDF(companiesList);
      }
    } catch (err) {
      console.error('Failed to fetch companies for PDF export:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiFetch<{ success: boolean; response: string; error?: string }>('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (response.success && response.response) {
        let responseText = response.response;
        
        // Intercept magic string for Users
        if (responseText.includes('[ACTION:EXPORT_USERS_PDF]')) {
          responseText = responseText.replace('[ACTION:EXPORT_USERS_PDF]', '').trim();
          if (!responseText) {
            responseText = "I am downloading the Users list as a PDF for you right now!";
          }
          triggerUsersPdfExport();
        }

        // Intercept magic string for Companies
        if (responseText.includes('[ACTION:EXPORT_COMPANIES_PDF]')) {
          responseText = responseText.replace('[ACTION:EXPORT_COMPANIES_PDF]', '').trim();
          if (!responseText) {
            responseText = "I am downloading the Companies list as a PDF for you right now!";
          }
          triggerCompaniesPdfExport();
        }

        setMessages(prev => [...prev, { role: 'bot', content: responseText }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: response.error || 'Sorry, I encountered an error.' }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'bot', content: 'Failed to connect to the server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sitebrain-chatbot-container">
      {!isOpen && (
        <button className="sitebrain-fab" onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
        </button>
      )}

      <div className={`sitebrain-window ${isOpen ? 'open' : 'closed'}`}>
        <div className="sitebrain-header">
          <div className="sitebrain-header-title">
            <Bot size={20} />
            <span>SiteBrain Assistant</span>
          </div>
          <button className="sitebrain-close-btn" onClick={() => setIsOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="sitebrain-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`sitebrain-message-row ${msg.role}`}>
              <div className={`sitebrain-bubble ${msg.role}`}>
                {msg.role === 'bot' && (
                  <div className={`sitebrain-author ${msg.role}`}>
                    <Bot size={12} /> SiteBrain
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className={`sitebrain-author ${msg.role}`}>
                    You <User size={12} />
                  </div>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="sitebrain-message-row bot">
              <div className="sitebrain-bubble bot">
                <div className="sitebrain-loader">
                  <Loader2 size={16} className="animate-spin" /> Thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="sitebrain-input-area">
          <input
            type="text"
            className="sitebrain-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your site..."
            disabled={isLoading}
          />
          <button
            className="sitebrain-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
