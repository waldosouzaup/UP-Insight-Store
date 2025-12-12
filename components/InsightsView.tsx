import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { StoreData, ChatMessage } from '../types';
import { generateStoreInsight } from '../services/geminiService';

interface InsightsViewProps {
  data: StoreData;
}

const InsightsView: React.FC<InsightsViewProps> = ({ data }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Olá! Sou seu analista de inteligência UP InsightStore. Analisei seus dados de vendas e estoque. Como posso ajudar hoje? \n\n*Exemplos:*\n- Quais produtos tiveram maior margem este mês?\n- Qual a previsão de vendas para a próxima semana?\n- Quais itens precisam de reposição urgente?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    // Call Gemini Service with full history objects
    const aiResponseText = await generateStoreInsight(
      userMsg.text, 
      data, 
      messages // Pass full ChatMessage objects
    );

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: aiResponseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-xl shadow-lg border backdrop-blur-sm overflow-hidden"
         style={{ 
           backgroundColor: 'rgba(255, 255, 255, 0.05)', 
           borderColor: 'rgba(255, 255, 255, 0.1)' 
         }}>
      
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between"
           style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(73, 255, 189, 0.2)' }}>
            <Sparkles className="w-5 h-5" style={{ color: '#49FFBD' }} />
          </div>
          <div>
            <h2 className="font-semibold text-white">Analista UP InsightStore</h2>
            <p className="text-xs text-slate-400 flex items-center">
              <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: '#49FFBD' }}></span>
              Conectado ao Supabase
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Avatar */}
              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mx-2 ${
                msg.role === 'user' ? 'bg-white/20' : 'bg-[#49FFBD]/20'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-5 h-5 text-slate-300" />
                ) : (
                  <Bot className="w-5 h-5 text-[#49FFBD]" />
                )}
              </div>

              {/* Bubble */}
              <div className={`p-4 rounded-2xl text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'text-[#002D39] rounded-tr-none font-medium' 
                  : 'text-slate-100 rounded-tl-none border'
              }`}
              style={
                  msg.role === 'user' 
                  ? { backgroundColor: '#49FFBD' } 
                  : { backgroundColor: 'rgba(0, 0, 0, 0.3)', borderColor: 'rgba(255, 255, 255, 0.1)' }
              }>
                {msg.role === 'model' ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown 
                        components={{
                            strong: ({node, ...props}) => <span className="font-bold text-[#49FFBD]" {...props} />,
                            a: ({node, ...props}) => <a className="text-[#49FFBD] underline" {...props} />
                        }}
                    >
                        {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
                <div className={`text-[10px] mt-2 opacity-70 text-right ${msg.role === 'user' ? 'text-[#00232d]' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
             <div className="flex flex-row items-center ml-12 space-x-2 p-3 rounded-2xl border"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#49FFBD', animationDelay: '0s' }}></div>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#49FFBD', animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#49FFBD', animationDelay: '0.4s' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="relative flex items-center">
          <input
            type="text"
            className="w-full pl-4 pr-12 py-3 rounded-xl outline-none transition-all placeholder:text-slate-500 text-white focus:ring-1 focus:ring-[#49FFBD]"
            style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            placeholder="Pergunte sobre vendas, estoque ou peça uma projeção..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="absolute right-2 p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
            style={{ backgroundColor: '#49FFBD', color: '#002D39' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center mt-2">
            <p className="text-[10px] text-slate-500">A IA pode cometer erros. Verifique informações críticas nos Dashboards.</p>
        </div>
      </div>
    </div>
  );
};

export default InsightsView;