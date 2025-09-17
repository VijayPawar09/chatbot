import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, RotateCcw, User, Bot } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  message: string;
  is_user: boolean;
  created_at: string;
  retrieved_sources?: Array<{
    title: string;
    url: string;
    source: string;
  }>;
}

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initialize session on component mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const initializeSession = async () => {
    try {
      const response = await fetch(`https://syoepzxmmpseqlvwpark.supabase.co/functions/v1/session-management?action=create`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSessionId(result.sessionId);
      
      // Load existing messages if any
      loadSessionHistory(result.sessionId);
    } catch (error) {
      console.error('Error initializing session:', error);
      toast({
        title: "Error",
        description: "Failed to initialize chat session",
        variant: "destructive"
      });
    }
  };

  const loadSessionHistory = async (sessionId: string) => {
    try {
      const response = await fetch(`https://syoepzxmmpseqlvwpark.supabase.co/functions/v1/session-management?action=history&sessionId=${sessionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      setMessages(result.messages || []);
    } catch (error) {
      console.error('Error loading session history:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      message: userMessage,
      is_user: true,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`https://syoepzxmmpseqlvwpark.supabase.co/functions/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: sessionId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Simulate typing effect
      setTimeout(() => {
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          message: result.response,
          is_user: false,
          created_at: new Date().toISOString(),
          retrieved_sources: result.sources
        };
        
        setMessages(prev => [...prev.slice(0, -1), tempUserMessage, botMessage]);
        setIsTyping(false);
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`https://syoepzxmmpseqlvwpark.supabase.co/functions/v1/session-management?action=clear&sessionId=${sessionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setMessages([]);
        toast({
          title: "Session Cleared",
          description: "Chat history has been cleared"
        });
      }
    } catch (error) {
      console.error('Error clearing session:', error);
      toast({
        title: "Error",
        description: "Failed to clear session",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">RAG News Chatbot</CardTitle>
            <Button
              variant="outline"
              onClick={clearSession}
              disabled={messages.length === 0}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Clear Session
            </Button>
          </div>
          <p className="text-muted-foreground">
            Ask me anything about recent news! I can search through business, technology, world, politics, and sports news.
          </p>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation by asking about recent news!</p>
                  <p className="text-sm mt-2">Try: "What's happening in technology?" or "Tell me about recent business news"</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.is_user ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.is_user ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.is_user ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {message.is_user ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    
                    <div className={`rounded-lg p-3 ${
                      message.is_user 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.message}</div>
                      
                      {message.retrieved_sources && message.retrieved_sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/20">
                          <p className="text-sm font-medium mb-2">Sources:</p>
                          <div className="space-y-1">
                            {message.retrieved_sources.map((source, index) => (
                              <a
                                key={index}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs hover:underline text-blue-400"
                              >
                                {source.title} - {source.source}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="rounded-lg p-3 bg-muted">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex-shrink-0 p-6 border-t">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about recent news..."
                className="flex-1"
                disabled={isLoading || !sessionId}
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim() || !sessionId}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};