import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';

interface Chat {
  id: number;
  name: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  member_count: number;
  type: 'chat' | 'group' | 'channel' | 'voice';
}

interface ChatListProps {
  chats: Chat[];
  activeChat: number | null;
  setActiveChat: (id: number) => void;
  createNewChat: () => void;
  formatTime: (timestamp: string | null) => string;
  onSearchUsers: () => void;
}

export const ChatList = ({ chats, activeChat, setActiveChat, createNewChat, formatTime, onSearchUsers }: ChatListProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filterChats = (chatList: Chat[]) => {
    if (!searchQuery.trim()) return chatList;
    return chatList.filter(chat => 
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="w-80 bg-card/30 backdrop-blur-md border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Чаты</h2>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="hover:bg-secondary/20" onClick={onSearchUsers}>
              <Icon name="UserPlus" size={20} />
            </Button>
            <Button size="icon" variant="ghost" className="hover:bg-primary/20" onClick={createNewChat}>
              <Icon name="Plus" size={20} />
            </Button>
          </div>
        </div>
        <Input 
          placeholder="Поиск..." 
          className="bg-muted/50 border-border"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 m-4">
          <TabsTrigger value="all">Все</TabsTrigger>
          <TabsTrigger value="groups">Группы</TabsTrigger>
          <TabsTrigger value="channels">Каналы</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 overflow-y-auto px-2">
          {filterChats(chats).map((chat) => (
            <Card 
              key={chat.id}
              className={`p-4 mb-2 cursor-pointer transition-all hover:bg-primary/10 animate-fade-in ${
                activeChat === chat.id ? 'bg-primary/20 border-primary' : 'bg-card/50'
              }`}
              onClick={() => setActiveChat(chat.id)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                      {chat.name[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold truncate">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground">{formatTime(chat.last_message_time)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.last_message || 'Нет сообщений'}</p>
                </div>
                {chat.unread_count > 0 && (
                  <Badge className="bg-primary text-primary-foreground animate-scale-in">
                    {chat.unread_count}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="groups" className="flex-1 overflow-y-auto px-2">
          {filterChats(chats.filter(c => c.type === 'group')).map((chat) => (
            <Card 
              key={chat.id} 
              className={`p-4 mb-2 cursor-pointer transition-all hover:bg-primary/10 ${
                activeChat === chat.id ? 'bg-primary/20 border-primary' : 'bg-card/50'
              }`}
              onClick={() => setActiveChat(chat.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-secondary">{chat.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{chat.name}</h3>
                  <p className="text-sm text-muted-foreground">{chat.last_message || 'Нет сообщений'}</p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="channels" className="flex-1 overflow-y-auto px-2">
          {filterChats(chats.filter(c => c.type === 'channel')).map((chat) => (
            <Card 
              key={chat.id} 
              className={`p-4 mb-2 cursor-pointer transition-all hover:bg-primary/10 ${
                activeChat === chat.id ? 'bg-primary/20 border-primary' : 'bg-card/50'
              }`}
              onClick={() => setActiveChat(chat.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-accent text-accent-foreground">{chat.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{chat.name}</h3>
                  <p className="text-sm text-muted-foreground">{chat.last_message || 'Нет сообщений'}</p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};