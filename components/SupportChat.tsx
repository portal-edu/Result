
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface Message {
  id: number;
  sender: 'bot' | 'user';
  text?: string;
  isRead?: boolean;
}

const SupportChat: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, sender: 'bot', text: "Hi! 👋 I'm your School Assistant. How can I help you today?" }
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    // Hide on login/setup pages to avoid clutter
    const hiddenRoutes = ['/login', '/setup', '/register', '/principal-setup'];
    const isHidden = hiddenRoutes.some(route => location.pathname.startsWith(route));

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    if (isHidden) return null;

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;
        
        const newUserMsg: Message = { id: Date.now(), sender: 'user', text: inputValue };
        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');

        // Simulate Bot Response
        setTimeout(() => {
            let botReplyText = "I'm not sure I understood that. 🤔\n\nWould you like to raise a Support Ticket via the dashboard?";
            const lowerInput = inputValue.toLowerCase();
            
            if (lowerInput.includes('result')) {
                botReplyText = "To check results, please visit the Public Page of your school or click the 'Check Result' button on the home page.";
            } else if (lowerInput.includes('login')) {
                botReplyText = "For login issues, ensure you are using the correct credentials. If you are a student, check your Register Number and DOB.";
            } else if (lowerInput.includes('fee') || lowerInput.includes('payment')) {
                botReplyText = "You can view Fee Status in the Student Dashboard after logging in.";
            }

            const newBotMsg: Message = { id: Date.now() + 1, sender: 'bot', text: botReplyText };
            setMessages(prev => [...prev, newBotMsg]);
        }, 1000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSendMessage();
    };

    return (
        <>
            {/* Toggle Button */}
            <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up print:hidden">
                <button 
                    onClick={toggleChat}
                    className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
                >
                    {isOpen ? <X className="w-6 h-6"/> : <MessageCircle className="w-6 h-6"/>}
                </button>
            </div>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-20 right-4 z-50 w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden h-[500px] max-h-[80vh] animate-fade-in-up print:hidden">
                    
                    {/* Header */}
                    <div className="bg-blue-600 p-4 text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Bot className="w-6 h-6"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">School Assistant</h3>
                            <p className="text-[10px] opacity-80 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Online</p>
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                                    msg.sender === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                                }`}>
                                    <p className="whitespace-pre-line">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                        <input 
                            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                            placeholder="Type a message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                        <button 
                            onClick={handleSendMessage}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                        >
                            <Send className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default SupportChat;
