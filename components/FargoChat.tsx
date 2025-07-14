

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { FargoChatIcon, SendIcon } from '../constants';

// A simple markdown-to-html converter for bold text
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </>
    );
};


const FargoChat: React.FC = () => {
    const { isChatOpen, closeChat } = useChat();
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'model'; parts: string }>>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const initialGreetingText = "Hello! I am Fargo, your virtual assistant. How can I help you today? You can ask me about your accounts, transactions, or general banking questions.";

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage = { role: 'user' as const, parts: inputValue };

        // FIX: The history sent to the API must be complete for a stateless call.
        // It should start with the initial greeting to give the model full context.
        const fullConversation = [
            { role: 'model', parts: initialGreetingText },
            ...messages,
            userMessage
        ];

        // Map the full conversation to the format the API expects.
        const historyForApi = fullConversation.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.parts }]
        }));


        // Update UI state with the new user message AND a placeholder for the model's response.
        // This part remains correct, as it only manages the *dynamic* part of the conversation.
        setMessages(prev => [...prev, userMessage, { role: 'model', parts: '' }]);
        setInputValue('');
        setIsLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ history: historyForApi })
            });

            if (!response.ok || !response.body) {
                 const errorData = response.statusText || 'Failed to get response from server.';
                 throw new Error(errorData);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                const chunkText = decoder.decode(value);
                 setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].parts += chunkText;
                    return newMessages;
                });
            }

        } catch (error: any) {
            console.error("Chat API Error:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                // Update the last message (the placeholder) with the error
                newMessages[newMessages.length - 1].parts = `I'm sorry, I encountered an error: ${error.message}`;
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isChatOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in" onClick={closeChat}>
            <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-md h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b bg-slate-50 rounded-t-lg">
                    <div className="flex items-center space-x-2">
                        <FargoChatIcon />
                        <h2 className="text-lg font-bold text-gray-800">Ask Fargo</h2>
                    </div>
                    <button onClick={closeChat} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </header>
                
                <main className="flex-1 p-4 overflow-y-auto space-y-4">
                     <div className="flex justify-start">
                        <div className="max-w-xs md:max-w-sm p-3 rounded-2xl bg-gray-200 text-gray-800">
                           <p className="text-sm whitespace-pre-wrap break-words">{initialGreetingText}</p>
                        </div>
                    </div>
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-sm p-3 rounded-2xl ${msg.role === 'user' ? 'bg-wells-red text-white' : 'bg-gray-200 text-gray-800'}`}>
                                {msg.parts ? (
                                     <p className="text-sm whitespace-pre-wrap break-words"><SimpleMarkdown text={msg.parts} /></p>
                                ) : (
                                    // This is the typing indicator
                                     <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </main>

                <footer className="p-4 border-t">
                    <form onSubmit={handleSend} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 p-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-wells-red px-4"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-wells-red text-white p-2.5 rounded-full hover:bg-wells-dark-red disabled:opacity-50 transition-colors"
                            aria-label="Send message"
                        >
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default FargoChat;