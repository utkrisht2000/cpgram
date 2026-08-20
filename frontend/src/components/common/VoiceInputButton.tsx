import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../locales/i18n';
import { IconVoiceMic } from '../../assets/icons/Icons';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript, className = '' }) => {
  const { language, t } = useI18n();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          onTranscript(transcript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('[SuGam Voice Input] Recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, onTranscript]);

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) {
      alert(language === 'hi' ? 'आपके ब्राउज़र में वॉयस इनपुट समर्थित नहीं है। कृपया टाइप करें।' : 'Voice input is not supported in this browser. Please type your grievance.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'} ${className}`}
      style={{
        position: 'relative',
        transition: 'all 0.2s ease',
        ...(isListening ? { animation: 'pulse 1.5s infinite' } : {}),
      }}
      title={isListening ? t('grievance.stopVoice') : t('grievance.voiceInput')}
    >
      <IconVoiceMic size={20} />
      <span>{isListening ? t('grievance.listening') : t('grievance.voiceInput')}</span>
      {isListening && (
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            display: 'inline-block',
            marginLeft: '4px',
          }}
        />
      )}
    </button>
  );
};
