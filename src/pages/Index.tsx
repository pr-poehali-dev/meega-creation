import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/6b4a381f-3ea1-465e-8ae8-0d4b5ddf8e04';
const CURRENT_USER_ID = 2;

interface Chat {
  id: number;
  name: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
  member_count: number;
  type: 'chat' | 'group' | 'channel' | 'voice';
}

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  avatar_color: string;
  content: string;
  created_at: string;
  reactions?: string[];
}

interface VoiceRoom {
  id: number;
  name: string;
  participants: number;
}

const Index = () => {
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [showCustomization, setShowCustomization] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceRooms, setVoiceRooms] = useState<VoiceRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadChats();
    loadVoiceRooms();
  }, []);

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat]);

  const loadChats = async () => {
    try {
      const response = await fetch(`${API_URL}?path=chats`, {
        headers: { 'X-User-Id': String(CURRENT_USER_ID) }
      });
      const data = await response.json();
      setChats(data.chats || []);
      if (data.chats && data.chats.length > 0 && !activeChat) {
        setActiveChat(data.chats[0].id);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить чаты',
        variant: 'destructive'
      });
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const response = await fetch(`${API_URL}?path=messages/${chatId}`, {
        headers: { 'X-User-Id': String(CURRENT_USER_ID) }
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить сообщения',
        variant: 'destructive'
      });
    }
  };

  const loadVoiceRooms = async () => {
    try {
      const response = await fetch(`${API_URL}?path=voice-rooms`, {
        headers: { 'X-User-Id': String(CURRENT_USER_ID) }
      });
      const data = await response.json();
      setVoiceRooms(data.rooms || []);
    } catch (error) {
      console.error('Failed to load voice rooms:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeChat || loading) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?path=send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(CURRENT_USER_ID)
        },
        body: JSON.stringify({
          chat_id: activeChat,
          content: message.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages([...messages, data.message]);
        setMessage('');
        loadChats();
      } else {
        throw new Error(data.error || 'Ошибка отправки');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить сообщение',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addReaction = async (messageId: number, emoji: string) => {
    try {
      await fetch(`${API_URL}?path=react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(CURRENT_USER_ID)
        },
        body: JSON.stringify({ message_id: messageId, emoji })
      });
      
      if (activeChat) {
        loadMessages(activeChat);
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const createNewChat = async () => {
    const chatName = prompt('Название нового чата:');
    if (!chatName) return;

    try {
      const response = await fetch(`${API_URL}?path=create-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(CURRENT_USER_ID)
        },
        body: JSON.stringify({
          name: chatName,
          type: 'group'
        })
      });

      if (response.ok) {
        loadChats();
        toast({
          title: 'Успешно',
          description: 'Чат создан!'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать чат',
        variant: 'destructive'
      });
    }
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const activeChatData = chats.find(c => c.id === activeChat);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] text-foreground">
      <div className="container mx-auto h-screen flex">
        <div className="w-20 bg-card/50 backdrop-blur-sm border-r border-border flex flex-col items-center py-6 gap-6">
          <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            M
          </div>
          
          <nav className="flex flex-col gap-4">
            <Button variant="ghost" size="icon" className="hover:bg-primary/20 transition-all hover:scale-110">
              <Icon name="MessageSquare" size={24} />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-secondary/20 transition-all hover:scale-110">
              <Icon name="Users" size={24} />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-accent/20 transition-all hover:scale-110">
              <Icon name="Radio" size={24} />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-primary/20 transition-all hover:scale-110">
              <Icon name="Image" size={24} />
            </Button>
          </nav>

          <div className="mt-auto flex flex-col gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowCustomization(!showCustomization)}
              className="hover:bg-accent/20 transition-all hover:scale-110"
            >
              <Icon name="Palette" size={24} />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-muted/20 transition-all hover:scale-110">
              <Icon name="Settings" size={24} />
            </Button>
          </div>
        </div>

        <div className="w-80 bg-card/30 backdrop-blur-md border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Чаты</h2>
              <Button size="icon" variant="ghost" className="hover:bg-primary/20" onClick={createNewChat}>
                <Icon name="Plus" size={20} />
              </Button>
            </div>
            <Input 
              placeholder="Поиск..." 
              className="bg-muted/50 border-border"
            />
          </div>

          <Tabs defaultValue="all" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-3 m-4">
              <TabsTrigger value="all">Все</TabsTrigger>
              <TabsTrigger value="groups">Группы</TabsTrigger>
              <TabsTrigger value="channels">Каналы</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="flex-1 overflow-y-auto px-2">
              {chats.map((chat) => (
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
              {chats.filter(c => c.type === 'group').map((chat) => (
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
              {chats.filter(c => c.type === 'channel').map((chat) => (
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

        <div className="flex-1 flex flex-col bg-background/30 backdrop-blur-sm">
          <div className="p-4 bg-card/40 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary">
                  {activeChatData?.name[0] || 'M'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{activeChatData?.name || 'Выберите чат'}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-glow"></span>
                  {activeChatData?.member_count || 0} участников
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="hover:bg-primary/20">
                <Icon name="Phone" size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-secondary/20">
                <Icon name="Video" size={20} />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-muted/20">
                <Icon name="MoreVertical" size={20} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender_id === CURRENT_USER_ID ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <Card className={`max-w-md p-4 ${
                  msg.sender_id === CURRENT_USER_ID
                    ? 'bg-gradient-to-r from-primary to-primary/80' 
                    : 'bg-card/80 backdrop-blur-sm'
                }`}>
                  {msg.sender_id !== CURRENT_USER_ID && (
                    <p className="text-xs font-semibold text-secondary mb-1">{msg.sender_name}</p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">{formatTime(msg.created_at)}</span>
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="flex gap-1">
                        {msg.reactions.map((reaction, idx) => (
                          <span 
                            key={idx} 
                            className="text-sm hover:scale-125 transition-transform cursor-pointer"
                            onClick={() => addReaction(msg.id, reaction)}
                          >
                            {reaction}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          </div>

          <div className="p-4 bg-card/40 border-t border-border">
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="hover:bg-muted/20">
                <Icon name="Paperclip" size={20} />
              </Button>
              <Input 
                placeholder="Написать сообщение..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 bg-muted/50"
                disabled={!activeChat || loading}
              />
              <Button variant="ghost" size="icon" className="hover:bg-accent/20">
                <Icon name="Smile" size={20} />
              </Button>
              <Button 
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                onClick={sendMessage}
                disabled={!activeChat || loading || !message.trim()}
              >
                <Icon name="Send" size={20} />
              </Button>
            </div>
          </div>
        </div>

        <div className="w-72 bg-card/30 backdrop-blur-md border-l border-border overflow-y-auto">
          <div className="p-6">
            <div className="text-center mb-6">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarFallback className="bg-gradient-to-br from-primary via-secondary to-accent text-2xl">
                  ИК
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold mb-1">{activeChatData?.name || 'Чат'}</h2>
              <p className="text-sm text-muted-foreground">{activeChatData?.member_count || 0} участников</p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Icon name="Volume2" size={16} className="text-secondary" />
                  Голосовые комнаты
                </h3>
                {voiceRooms.map((room) => (
                  <Card key={room.id} className="p-3 mb-2 bg-secondary/10 hover:bg-secondary/20 cursor-pointer transition-all group">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{room.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Icon name="Users" size={12} />
                          {room.participants}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="PhoneCall" size={16} />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Icon name="Image" size={16} className="text-accent" />
                  Медиа
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-muted/50 rounded-lg hover:scale-105 transition-transform cursor-pointer"></div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Icon name="Sticker" size={16} className="text-primary" />
                  Стикеры
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {['🎮', '⚡', '🔥', '🚀', '🎯', '👾'].map((emoji, idx) => (
                    <Button 
                      key={idx} 
                      variant="outline" 
                      size="icon"
                      className="text-2xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {showCustomization && (
            <div className="p-6 bg-accent/10 border-t border-border animate-slide-in-right">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Icon name="Palette" size={16} />
                Кастомизация
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Тема оформления</span>
                  <Button size="sm" variant="outline">Изменить</Button>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary cursor-pointer hover:scale-110 transition-transform"></div>
                  <div className="w-8 h-8 rounded-full bg-secondary cursor-pointer hover:scale-110 transition-transform"></div>
                  <div className="w-8 h-8 rounded-full bg-accent cursor-pointer hover:scale-110 transition-transform"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;