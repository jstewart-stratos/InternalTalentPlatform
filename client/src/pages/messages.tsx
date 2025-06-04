import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Send, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import type { Employee, Message } from "@shared/schema";

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");

  // Mock current user ID
  const currentUserId = 1;

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const response = await fetch("/api/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json() as Promise<Employee[]>;
    },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/messages", currentUserId],
    queryFn: async () => {
      const response = await fetch(`/api/messages?employeeId=${currentUserId}`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json() as Promise<Message[]>;
    },
  });

  // Group conversations by the other participant
  const groupedConversations = conversations.reduce((acc, message) => {
    const otherParticipant = message.fromEmployeeId === currentUserId 
      ? message.toEmployeeId 
      : message.fromEmployeeId;
    
    if (!acc[otherParticipant]) {
      acc[otherParticipant] = [];
    }
    acc[otherParticipant].push(message);
    return acc;
  }, {} as Record<number, Message[]>);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    // This would normally send the message via API
    console.log("Sending message:", messageText, "to:", selectedConversation);
    setMessageText("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Connect and collaborate with your colleagues</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Conversations</span>
              <Button size="sm">New Message</Button>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {Object.keys(groupedConversations).length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No conversations yet</p>
                  <p className="text-sm text-gray-400 mt-1">Start by sending a message to a colleague</p>
                </div>
              ) : (
                Object.entries(groupedConversations).map(([participantId, messages]) => {
                  const participant = employees.find(e => e.id === parseInt(participantId));
                  const lastMessage = messages[messages.length - 1];
                  const unreadCount = messages.filter(m => !m.isRead && m.toEmployeeId === currentUserId).length;
                  
                  if (!participant) return null;
                  
                  return (
                    <div
                      key={participantId}
                      className={`p-4 cursor-pointer hover:bg-gray-50 border-b ${
                        selectedConversation === parseInt(participantId) ? "bg-blue-50 border-l-4 border-l-primary" : ""
                      }`}
                      onClick={() => setSelectedConversation(parseInt(participantId))}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={participant.profileImage || ""} />
                          <AvatarFallback>
                            {participant.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {participant.name}
                            </p>
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{participant.title}</p>
                          <p className="text-sm text-gray-600 truncate">
                            {lastMessage.subject}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const participant = employees.find(e => e.id === selectedConversation);
                      return participant ? (
                        <>
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={participant.profileImage || ""} />
                            <AvatarFallback>
                              {participant.name.split(" ").map(n => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-semibold">{participant.name}</h3>
                            <p className="text-sm text-gray-500">{participant.title}</p>
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto p-6">
                  {groupedConversations[selectedConversation]?.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 ${
                        message.fromEmployeeId === currentUserId ? "text-right" : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.fromEmployeeId === currentUserId
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">{message.subject}</p>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 min-h-[60px]"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button onClick={handleSendMessage} disabled={!messageText.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
                <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
