import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../../locales/i18n';
import { chatApi, ChatMessageDto } from '../../api/chatApi';
import { IconMessageSquare, IconBot, IconSend, IconSparkles } from '../../assets/icons/Icons';

export const ChatbotWidget: React.FC = () => {
  const { language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageDto[]>([
    {
      role: 'assistant',
      content: language === 'hi'
        ? 'नमस्ते! मैं सुगम नागरिक सहायक हूं। आप मुझसे शिकायत दर्ज करने की प्रक्रिया, संबंधित विभाग, समय सीमा (SLA), बिना लॉगिन स्थिति ट्रैक करने या अपील संबंधी प्रश्न पूछ सकते हैं।'
        : 'Hello! I am SuGam Citizen Assistant. You can ask me how to lodge a complaint, which department handles your issue, SLA resolution timelines, tracking your case, or filing a supervisory appeal.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    language === 'hi' ? 'शिकायत कैसे दर्ज करें?' : 'How do I lodge a grievance?',
    language === 'hi' ? 'बिना लॉगिन स्थिति कैसे ट्रैक करें?' : 'How do I track status without login?',
    language === 'hi' ? 'बिजली व पानी की समय सीमा (SLA)?' : 'What is the SLA for power and water?',
    language === 'hi' ? 'समाधान के बाद अपील कैसे करें?' : 'How does the first appeal process work?',
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    const newHistory: ChatMessageDto[] = [...messages, { role: 'user', content: text }];
    setMessages(newHistory);
    setInputValue('');
    setLoading(true);

    try {
      const res = await chatApi.sendMessage(text, newHistory, language);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
      if (res.suggestedQuestions && res.suggestedQuestions.length > 0) {
        setSuggestions(res.suggestedQuestions);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: language === 'hi'
            ? 'क्षमा करें, उत्तर प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें अथवा संबंधित विभाग का चयन करें।'
            : 'Sorry, I encountered an issue processing your query. You can also explore the File Grievance and Track Status portals directly.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbot-widget-container" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="btn btn-primary"
          style={{
            borderRadius: 'var(--radius-full)',
            padding: '12px 18px',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '2px solid rgba(255, 255, 255, 0.2)',
          }}
          aria-label="Open SuGam Citizen Civic Assistant Chatbot"
        >
          <IconBot size={22} />
          <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
            {language === 'hi' ? 'सुगम नागरिक सहायक' : 'SuGam Civic Assistant'}
          </span>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div
          className="chatbot-window"
          style={{
            width: '380px',
            maxWidth: 'calc(100vw - 28px)',
            height: '520px',
            maxHeight: 'calc(100vh - 90px)',
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--color-neutral-300)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--color-primary-900)',
              color: 'var(--color-white)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconBot size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.98rem', color: 'var(--color-white)', margin: 0 }}>
                  {language === 'hi' ? 'सुगम नागरिक सहायक' : 'SuGam Civic Assistant'}
                </h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-primary-100)', display: 'block' }}>
                  AI Governance Guide • Instant Answers
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-white)',
                fontSize: '1.4rem',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '4px',
              }}
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>

          {/* Messages Area */}
          <div
            className="no-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: 'var(--color-neutral-50)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-lg)',
                    fontSize: '0.88rem',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-wrap',
                    backgroundColor: m.role === 'user' ? 'var(--color-primary-800)' : 'var(--color-white)',
                    color: m.role === 'user' ? 'var(--color-white)' : 'var(--color-neutral-900)',
                    border: m.role === 'user' ? 'none' : '1px solid var(--color-neutral-200)',
                    borderBottomRightRadius: m.role === 'user' ? '2px' : 'var(--radius-lg)',
                    borderBottomLeftRadius: m.role === 'assistant' ? '2px' : 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-neutral-500)', fontSize: '0.82rem', padding: '6px 12px' }}>
                <IconSparkles size={16} style={{ color: 'var(--color-primary-600)' }} />
                <span>Assistant is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          {suggestions.length > 0 && !loading && (
            <div
              className="no-scrollbar"
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--color-white)',
                borderTop: '1px solid var(--color-neutral-200)',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {suggestions.map((q, qIdx) => (
                <button
                  key={qIdx}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    minHeight: '28px',
                    flexShrink: 0,
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-white)',
              borderTop: '1px solid var(--color-neutral-200)',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
            }}
          >
            <textarea
              className="form-textarea no-scrollbar"
              style={{
                minHeight: '42px',
                maxHeight: '100px',
                height: '42px',
                padding: '8px 12px',
                fontSize: '0.9rem',
                resize: 'none',
                borderRadius: 'var(--radius-md)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              placeholder={language === 'hi' ? 'अपना प्रश्न यहां लिखें...' : 'Ask about filing, departments, SLAs...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || !inputValue.trim()}
              className="btn btn-primary btn-icon-only"
              style={{ width: '42px', height: '42px', minHeight: '42px', minWidth: '42px' }}
              aria-label="Send query"
            >
              <IconSend size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
