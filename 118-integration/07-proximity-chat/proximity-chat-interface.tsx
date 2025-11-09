import { useState, useRef, useEffect, memo } from 'react';
import { Input } from '@/components/ui/input';

interface ChatMessage {
  id: string;
  walletAddress: string;
  displayName: string;
  message: string;
  timestamp: number;
}

interface ProximityChatInterfaceProps {
  messages: ChatMessage[];
  nearbyPlayers: string[]; // Wallet addresses of nearby players
  onSendMessage: (message: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isRateLimited?: boolean;
  visible: boolean; // Show/hide based on nearby players
}

export const ProximityChatInterface = memo(function ProximityChatInterface({ 
  messages, 
  nearbyPlayers,
  onSendMessage, 
  onFocus, 
  onBlur, 
  isRateLimited = false,
  visible = false 
}: ProximityChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = inputValue.trim();
    if (message) {
      onSendMessage(message);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      inputRef.current?.blur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  return (
    <>
      <div className="proximity-chat-container absolute bottom-4 left-96 w-80 h-48 bg-yellow-900 border-2 border-yellow-500 shadow-lg">
        <div className="h-full flex flex-col">
          {/* Proximity Chat header */}
          <div className="bg-yellow-500 text-black px-2 py-1 text-xs font-bold font-mono flex items-center justify-between">
            <span>PROXIMITY CHAT</span>
            <span className="text-[10px]">
              [{nearbyPlayers.length} NEARBY]
            </span>
          </div>
          
          {/* Chat messages */}
          <div 
            className="flex-1 overflow-y-auto p-2 text-xs leading-relaxed" 
            data-testid="container-proximity-chat-messages"
          >
            {messages.length === 0 ? (
              <div className="text-yellow-300 font-mono italic opacity-70">
                Say something to nearby players...
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="mb-1">
                  <span className="text-yellow-300 font-mono">
                    {message.displayName}
                  </span>
                  <span className="text-yellow-500 font-mono">:</span>
                  <span className="text-yellow-100 font-mono"> {message.message}</span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Chat input */}
          <div className="border-t border-yellow-500 p-2">
            <form onSubmit={handleSubmit}>
              <Input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="WHISPER TO NEARBY... (ENTER TO SEND)"
                maxLength={100}
                className="w-full bg-yellow-900 border border-yellow-500 text-yellow-100 text-xs p-1 focus:outline-none focus:ring-1 focus:ring-yellow-400 font-mono placeholder-yellow-400"
                data-testid="input-proximity-chat-message"
                disabled={isRateLimited}
              />
            </form>
          </div>
        </div>
      </div>

      {/* Rate limit warning for proximity chat */}
      {isRateLimited && (
        <div className="absolute bottom-56 left-4 md:left-96 right-4 md:right-auto md:w-auto bg-red-900 border border-red-500 text-red-300 px-2 py-1 text-xs font-mono text-center md:text-left">
          <span className="md:hidden">RATE LIMITED</span>
          <span className="hidden md:inline">Rate limited - slow down!</span>
        </div>
      )}
    </>
  );
});