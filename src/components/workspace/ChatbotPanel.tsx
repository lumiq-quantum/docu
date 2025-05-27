"use client";

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { answerQuestionsAboutDocument } from '@/ai/flows/answer-questions-about-document';
import { postChatMessage, getChatHistory } from '@/lib/api';
import type { ChatMessageResponse, ChatMessageCreate } from '@/types/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, User, Bot, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatbotPanelProps {
  projectId: number;
}

export function ChatbotPanel({ projectId }: ChatbotPanelProps) {
  const [userInput, setUserInput] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: chatHistory = [], isLoading: isLoadingHistory, error: historyError } = useQuery<ChatMessageResponse[], Error>({
    queryKey: ['chatHistory', projectId],
    queryKeyHash: `chatHistory-${projectId}`,
    queryFn: () => getChatHistory(projectId),
    enabled: !!projectId,
  });

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollableViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollableViewport) {
        scrollableViewport.scrollTop = scrollableViewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const saveMessageMutation = useMutation<ChatMessageResponse, Error, ChatMessageCreate & { tempId?: string }>({
    mutationFn: (messageData) => postChatMessage(projectId, messageData),
    onSuccess: (savedMessage, variables) => {
      queryClient.setQueryData(['chatHistory', projectId], (oldHistory: ChatMessageResponse[] = []) => {
        // If it was a temporary message, replace it, otherwise add
        if (variables.tempId) {
          return oldHistory.map(msg => msg.id.toString() === variables.tempId ? savedMessage : msg);
        }
        return [...oldHistory, savedMessage];
      });
      scrollToBottom();
    },
    onError: (error, variables) => {
      toast({ title: "Error", description: `Failed to save ${variables.is_user_message ? "your" : "AI"} message: ${error.message}`, variant: "destructive" });
       if (variables.tempId) {
         queryClient.setQueryData(['chatHistory', projectId], (oldHistory: ChatMessageResponse[] = []) => 
           oldHistory.filter(msg => msg.id.toString() !== variables.tempId)
         );
       }
    },
  });

  const aiResponseMutation = useMutation({
    mutationFn: async (question: string) => {
      // Optimistically add user message to UI
      const tempUserMessageId = `temp-user-${Date.now()}`;
      const userMessageForDisplay: ChatMessageResponse = {
        id: tempUserMessageId as any, // Temporary ID
        message: question,
        is_user_message: 1,
        created_at: new Date().toISOString(),
        project_id: projectId,
      };
      queryClient.setQueryData(['chatHistory', projectId], (old: ChatMessageResponse[] = []) => [...old, userMessageForDisplay]);
      scrollToBottom();
      
      // Save user message to backend
      saveMessageMutation.mutate({ message: question, is_user_message: 1, tempId: tempUserMessageId });

      // Get AI response
      return answerQuestionsAboutDocument({ projectId, question });
    },
    onSuccess: (aiResult) => {
      const aiMessageForDisplay: ChatMessageResponse = {
        id: `temp-ai-${Date.now()}` as any, // Temporary ID
        message: aiResult.answer,
        is_user_message: 0,
        created_at: new Date().toISOString(),
        project_id: projectId,
      };
      // Optimistically add AI message to UI
      queryClient.setQueryData(['chatHistory', projectId], (old: ChatMessageResponse[] = []) => [...old, aiMessageForDisplay]);
      scrollToBottom();
      
      // Save AI message to backend
      saveMessageMutation.mutate({ message: aiResult.answer, is_user_message: 0, tempId: aiMessageForDisplay.id.toString() });
    },
    onError: (error: Error) => {
      toast({ title: "AI Error", description: error.message || "Failed to get AI response.", variant: "destructive" });
      // Remove the optimistic user message if AI fails, or handle differently
      // For now, user message stays, AI error shown.
    },
  });


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || aiResponseMutation.isPending) return;
    
    const currentInput = userInput.trim();
    setUserInput(''); // Clear input immediately
    aiResponseMutation.mutate(currentInput);
  };

  if (isLoadingHistory) {
    return (
       <Card className="h-full flex flex-col">
        <CardHeader><CardTitle>Chatbot</CardTitle></CardHeader>
        <CardContent className="flex-grow p-4 space-y-4">
          <Skeleton className="h-12 w-3/4 self-start rounded-lg" />
          <Skeleton className="h-16 w-3/4 self-end rounded-lg" />
          <Skeleton className="h-10 w-full self-start rounded-lg" />
        </CardContent>
        <CardFooter className="p-4 border-t">
          <Skeleton className="h-10 flex-grow mr-2" />
          <Skeleton className="h-10 w-20" />
        </CardFooter>
      </Card>
    );
  }

  if (historyError) {
     return (
       <Card className="h-full flex flex-col">
        <CardHeader><CardTitle>Chatbot</CardTitle></CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
           <div className="text-destructive text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="font-semibold">Error loading chat history</p>
            <p className="text-sm">{historyError.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>AI Chatbot</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex items-end gap-2 max-w-[85%]",
                  msg.is_user_message ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.is_user_message ? undefined : "/placeholder-bot.png"} data-ai-hint="robot face" />
                  <AvatarFallback>
                    {msg.is_user_message ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm shadow",
                    msg.is_user_message
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            {aiResponseMutation.isPending && !saveMessageMutation.isPending && (
              <div className="flex items-end gap-2 max-w-[85%] mr-auto">
                 <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-bot.png" data-ai-hint="robot face" />
                  <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-3 py-2 text-sm shadow bg-muted text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Ask about the document..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={aiResponseMutation.isPending || saveMessageMutation.isPending}
            className="flex-grow"
          />
          <Button type="submit" size="icon" disabled={aiResponseMutation.isPending || saveMessageMutation.isPending || !userInput.trim()}>
            {aiResponseMutation.isPending && !saveMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
