"use client";

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Removed UseQueryOptions as it's not needed for direct options passing
import { postChatMessage, getChatHistory, getProject } from '@/lib/api';
import type { ChatMessage, ChatMessageResponse, ChatHistoryResponse, ProjectResponse, ChatSessionInfo } from '@/types/api';
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

// Temporary type for messages in UI to handle optimistic updates with temp ID
interface DisplayChatMessage extends ChatMessage {
  _tempId?: string; // For optimistic updates
}

// Input type for saveMessageMutation
type SaveMessageMutationInput = {
  messageText: string;
  tempId: string; // The _tempId of the message being saved
  // role: 'user' | 'model'; // Role is removed as this mutation now only handles user messages
};

export function ChatbotPanel({ projectId }: ChatbotPanelProps) {
  const [userInput, setUserInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch project details to get chat_session_id
  const { data: projectData, isLoading: isLoadingProject, error: projectError } = useQuery<ProjectResponse, Error, ProjectResponse, readonly ['project', number]>({
    queryKey: ['project', projectId] as const,
    queryFn: () => getProject(projectId),
    enabled: !!projectId,
    // onSuccess and onError callbacks removed from here
  });

  // Effect to handle successful project data fetching
  useEffect(() => {
    if (projectData) {
      if (projectData.chat_session_id) {
        setSessionId(projectData.chat_session_id);
      } else {
        const newSessionId = crypto.randomUUID();
        setSessionId(newSessionId);
        console.warn('Chat session ID not found in project data. Using a new temporary session ID:', newSessionId);
        toast({ title: "Chat Info", description: "No existing chat session found for this project. Starting a new one.", variant: "default" });
      }
    }
  }, [projectData, toast]);

  // Effect to handle errors during project data fetching
  useEffect(() => {
    if (projectError) {
      const newSessionId = crypto.randomUUID();
      setSessionId(newSessionId);
      console.error("Error fetching project data for chat session ID:", projectError);
      toast({ title: "Error", description: `Could not load project data: ${projectError.message}. Using temporary session ID. Chat history may not be saved.`, variant: "destructive" });
    }
  }, [projectError, toast]);

  const { data: chatHistoryData, isLoading: isLoadingHistory, error: historyError, refetch: refetchChatHistory } = useQuery<ChatHistoryResponse, Error, ChatHistoryResponse, readonly ['chatHistory', string | null]>({
    queryKey: ['chatHistory', sessionId] as const,
    queryFn: async (): Promise<ChatHistoryResponse> => {
      if (!sessionId) {
        const tempSessionInfo: ChatSessionInfo = {
          id: 'temp-session-id', // This will be the effective session ID for this temporary state
          title: 'Temporary Session',
          created_at: new Date().toISOString(),
          // updated_at is not part of ChatSessionInfo as per latest type definition
        };
        return { session: tempSessionInfo, messages: [] };
      }
      return getChatHistory(sessionId);
    },
    enabled: !!sessionId,
  });

  const chatMessages: DisplayChatMessage[] = chatHistoryData?.messages.map(m => ({ ...m })) || [];

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
  }, [chatMessages.length]);

  // Mutation to save a message (user or AI) to the backend via postChatMessage
  // postChatMessage is expected to return the persisted message, which might have a new ID or structure.
  // For now, assuming ChatMessageResponse is { id: number, message: string, is_user_message: 0 | 1, ... }
  // This needs to align with what postChatMessage actually returns for the new API.
  // The new API for postChatMessage takes (sessionId, messageText) and returns ChatMessageResponse.
  // Let's assume ChatMessageResponse is { id: string | number, message: string, is_user_message: 0 | 1, created_at: string, project_id: number }
  // We need to map this back to our DisplayChatMessage structure if needed.
  const saveMessageMutation = useMutation<ChatMessageResponse, Error, SaveMessageMutationInput>({
    mutationFn: (data) => {
      if (!sessionId) return Promise.reject(new Error("Session ID not available for saving message."));
      return postChatMessage(sessionId, data.messageText); // Only sends user message
    },
    onSuccess: (savedMessageBackend, variables) => {
      queryClient.setQueryData<ChatHistoryResponse | undefined>(['chatHistory', sessionId], (oldData) => {
        if (!oldData) return oldData;
        const updatedMessages = oldData.messages.map(msg => {
          const displayMsg = msg as DisplayChatMessage;
          if (displayMsg._tempId === variables.tempId) {
            // Update the user's message with data from backend
            return {
              id: savedMessageBackend.id.toString(),
              role: 'user', // Hardcoded to 'user' as this mutation is for user messages
              content: savedMessageBackend.message,
              timestamp: savedMessageBackend.created_at,
            } as ChatMessage;
          }
          return msg;
        });
        return { ...oldData, messages: updatedMessages };
      });
      // Invalidate chat history to refetch and get AI's response
      queryClient.invalidateQueries({ queryKey: ['chatHistory', sessionId] });
      scrollToBottom(); // Scroll after optimistic update / initial save
    },
    onError: (error, variables) => {
      toast({ title: "Error Saving Message", description: `Failed to save user message: ${error.message}`, variant: "destructive" });
      queryClient.setQueryData<ChatHistoryResponse | undefined>(['chatHistory', sessionId], (oldData) => {
        if (!oldData) return oldData;
        // Remove the optimistic message that failed to save
        const filteredMessages = oldData.messages.filter(msg => (msg as DisplayChatMessage)._tempId !== variables.tempId);
        return { ...oldData, messages: filteredMessages };
      });
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || saveMessageMutation.isPending || !sessionId || isLoadingProject) return;
    
    const currentInput = userInput.trim();
    setUserInput('');

    const tempUserMessageId = `temp-user-${crypto.randomUUID()}`;
    const userMessageForDisplay: DisplayChatMessage = {
      _tempId: tempUserMessageId,
      id: tempUserMessageId, 
      role: 'user',
      content: currentInput,
      timestamp: new Date().toISOString(),
    };

    // Optimistically add user message to UI
    queryClient.setQueryData<ChatHistoryResponse | undefined>(['chatHistory', sessionId], (oldData) => {
      const messages = oldData?.messages || [];
      const sessionInfo = oldData?.session || { id: sessionId!, title: 'Chat Session', created_at: new Date().toISOString() }; 
      return { session: sessionInfo, messages: [...messages, userMessageForDisplay] };
    });
    scrollToBottom();

    // Send user message to backend
    saveMessageMutation.mutate({ messageText: currentInput, tempId: tempUserMessageId });
  };

  // Combined loading state for initial setup (project loading OR session ID not yet set AND no project error)
  const isInitialLoading = isLoadingProject || (!sessionId && !projectError);

  if (isInitialLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader><CardTitle>Chatbot</CardTitle></CardHeader>
        <CardContent className="flex-grow p-4 space-y-4">
          <Skeleton className="h-10 w-full self-start rounded-lg" />
          <Skeleton className="h-12 w-3/4 self-start rounded-lg mt-4" />
          <Skeleton className="h-16 w-3/4 self-end rounded-lg" />
        </CardContent>
        <CardFooter className="p-4 border-t">
          <Skeleton className="h-10 flex-grow mr-2" />
          <Skeleton className="h-10 w-20" />
        </CardFooter>
      </Card>
    );
  }

  // Loading state for chat history, only if session ID is available and not initial loading
  if (isLoadingHistory && sessionId && !chatMessages.length) { // Show full skeleton only if history is loading AND no messages yet
    return (
      <Card className="h-full flex flex-col">
        <CardHeader><CardTitle>Chatbot</CardTitle></CardHeader>
        <CardContent className="flex-grow p-4 space-y-4">
          {/* Show existing messages if any, then skeletons for loading more */}
          {chatMessages.map((msg, index) => (
             <div key={msg._tempId || msg.id || `msg-${index}`} className={cn("flex items-end gap-2 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}> <Avatar className="h-8 w-8"><AvatarImage src={msg.role === 'user' ? undefined : "/placeholder-bot.png"} /><AvatarFallback>{msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</AvatarFallback></Avatar> <div className={cn("rounded-lg px-3 py-2 text-sm shadow", msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{msg.content}</div></div>
          ))}
          <Skeleton className="h-12 w-3/4 self-start rounded-lg" />
          <Skeleton className="h-16 w-3/4 self-end rounded-lg" />
        </CardContent>
        <CardFooter className="p-4 border-t">
          <Skeleton className="h-10 flex-grow mr-2" />
          <Skeleton className="h-10 w-20" />
        </CardFooter>
      </Card>
    );
  }

  if (historyError && sessionId) {
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
        <CardTitle>AI Chatbot {projectData?.name ? `for ${projectData.name}` : ''}</CardTitle>
        {sessionId && <p className="text-xs text-muted-foreground">Session: {chatHistoryData?.session?.title || (chatHistoryData?.session?.id ? 'ID: ' + chatHistoryData.session.id : 'Loading session...')}</p>}
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {chatMessages.map((msg, index) => (
              <div
                key={msg._tempId || msg.id || `msg-${index}-${msg.role}-${msg.timestamp}`}
                className={cn(
                  "flex items-end gap-2 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.role === 'user' ? undefined : "/placeholder-bot.png"} />
                  <AvatarFallback>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm shadow",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {/* Removed AI response pending loader (aiResponseMutation.isPending) */}
            {/* isLoadingHistory will cover loading states during refetch */}
            {/* Show AI thinking indicator when user's message is sent and history is being refetched for AI's response */}
            {!saveMessageMutation.isPending && isLoadingHistory && (
              <div className={cn("flex items-end gap-2 max-w-[85%]", "mr-auto")}>
                <Avatar className="h-8 w-8">
                  Thinking
                  <AvatarImage src="/placeholder-bot.png" />
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm shadow",
                    "bg-muted text-muted-foreground"
                  )}
                >
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
            placeholder={sessionId ? "Ask about the document..." : "Initializing chat..."}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={saveMessageMutation.isPending || !sessionId || isLoadingProject || isLoadingHistory}
            className="flex-grow"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={saveMessageMutation.isPending || !userInput.trim() || !sessionId || isLoadingProject || isLoadingHistory}
          >
            {saveMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
