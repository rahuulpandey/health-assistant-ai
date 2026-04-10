import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListGeminiConversations, 
  useCreateGeminiConversation, 
  useGetGeminiConversation,
  useDeleteGeminiConversation,
  getGetGeminiConversationQueryKey,
  getListGeminiConversationsQueryKey
} from "@workspace/api-client-react";
import { GeminiMessage } from "@workspace/api-client-react/src/generated/api.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Send, Trash2, MessageSquare, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Chat() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingConvs } = useListGeminiConversations();
  const createConv = useCreateGeminiConversation();
  const deleteConv = useDeleteGeminiConversation();

  const { data: activeConversation, isLoading: loadingActiveConv } = useGetGeminiConversation(
    activeConvId as number,
    { query: { enabled: activeConvId !== null, queryKey: getGetGeminiConversationQueryKey(activeConvId as number) } }
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages, streamedContent]);

  const handleCreateNew = () => {
    createConv.mutate(
      { data: { title: "New Conversation" } },
      {
        onSuccess: (newConv) => {
          setActiveConvId(newConv.id);
          queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
        },
      }
    );
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConv.mutate(
      { id },
      {
        onSuccess: () => {
          if (activeConvId === id) setActiveConvId(null);
          queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
        },
      }
    );
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeConvId || isStreaming) return;

    const messageContent = inputMessage;
    setInputMessage("");
    setIsStreaming(true);
    setStreamedContent("");

    // Optimistically add user message
    const tempUserMsg: GeminiMessage = {
      id: Date.now(),
      conversationId: activeConvId,
      role: "user",
      content: messageContent,
      createdAt: new Date().toISOString()
    };

    queryClient.setQueryData(
      getGetGeminiConversationQueryKey(activeConvId),
      (old: any) => old ? { ...old, messages: [...(old.messages || []), tempUserMsg] } : old
    );

    try {
      const response = await fetch(`/api/gemini/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let done = false;
        let assistantContent = "";
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content) {
                    assistantContent += data.content;
                    setStreamedContent(assistantContent);
                  }
                } catch (e) {
                  // ignore parse error on partial chunks
                }
              }
            }
          }
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to AI assistant.",
        variant: "destructive",
      });
    } finally {
      setIsStreaming(false);
      setStreamedContent("");
      queryClient.invalidateQueries({ queryKey: getGetGeminiConversationQueryKey(activeConvId) });
      queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() }); // Updates titles
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Sidebar */}
      <Card className="w-80 flex flex-col border-r shadow-sm overflow-hidden hidden md:flex">
        <div className="p-4 border-b">
          <Button onClick={handleCreateNew} className="w-full justify-start" disabled={createConv.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            New Conversation
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {loadingConvs ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : conversations?.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors group",
                  activeConvId === conv.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <div className="flex items-center overflow-hidden">
                  <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate text-sm font-medium">{conv.title || "New Conversation"}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDelete(conv.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col shadow-sm overflow-hidden">
        {activeConvId ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
              {loadingActiveConv ? (
                <div className="space-y-4">
                  <div className="flex justify-end"><Skeleton className="h-12 w-1/2 rounded-t-lg rounded-bl-lg" /></div>
                  <div className="flex justify-start"><Skeleton className="h-24 w-2/3 rounded-t-lg rounded-br-lg" /></div>
                </div>
              ) : (
                <>
                  {activeConversation?.messages.map((msg, i) => (
                    <div
                      key={msg.id || i}
                      className={cn(
                        "flex w-full",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className={cn(
                        "flex max-w-[80%] rounded-2xl p-4 gap-3",
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground rounded-br-none" 
                          : "bg-muted rounded-bl-none"
                      )}>
                        {msg.role === "assistant" && (
                          <div className="mt-1 shrink-0">
                            <Bot className="h-5 w-5" />
                          </div>
                        )}
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </div>
                        )}
                        {msg.role === "user" && (
                          <div className="mt-1 shrink-0">
                            <User className="h-5 w-5 opacity-80" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isStreaming && streamedContent && (
                    <div className="flex w-full justify-start">
                      <div className="flex max-w-[80%] rounded-2xl p-4 gap-3 bg-muted rounded-bl-none">
                        <div className="mt-1 shrink-0">
                          <Bot className="h-5 w-5" />
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {streamedContent}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                  {isStreaming && !streamedContent && (
                    <div className="flex w-full justify-start">
                      <div className="flex max-w-[80%] rounded-2xl p-4 gap-3 bg-muted rounded-bl-none items-center">
                        <Bot className="h-5 w-5" />
                        <div className="flex gap-1">
                          <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce"></span>
                          <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce delay-75"></span>
                          <span className="h-2 w-2 rounded-full bg-primary/40 animate-bounce delay-150"></span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="p-4 border-t bg-card">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-center gap-2"
              >
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a health related question..."
                  className="flex-1 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                  disabled={isStreaming}
                />
                <Button type="submit" disabled={!inputMessage.trim() || isStreaming} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">AI Health Assistant</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Ask questions about your health, get help understanding medical terms, or discuss your symptoms.
            </p>
            <Button onClick={handleCreateNew} disabled={createConv.isPending}>
              Start a New Conversation
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
