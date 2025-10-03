import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Sidebar } from '@/components/messenger/Sidebar';
import { ChatList } from '@/components/messenger/ChatList';
import { ChatWindow } from '@/components/messenger/ChatWindow';
import { ChatInfo } from '@/components/messenger/ChatInfo';

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

interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  status: 'online' | 'offline';
}

interface Call {
  chatId: number;
  chatName: string;
  type: 'voice' | 'video';
  startTime: number;
}

const Index = () => {
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [showCustomization, setShowCustomization] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [voiceRooms, setVoiceRooms] = useState<VoiceRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadChats();
    loadVoiceRooms();
    loadUsers();
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

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_URL}?path=users`, {
        headers: { 'X-User-Id': String(CURRENT_USER_ID) }
      });
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const startCall = (type: 'voice' | 'video') => {
    if (!activeChatData) return;
    setActiveCall({
      chatId: activeChatData.id,
      chatName: activeChatData.name,
      type,
      startTime: Date.now()
    });
    toast({
      title: type === 'voice' ? 'Голосовой звонок' : 'Видеозвонок',
      description: `Звонок в ${activeChatData.name} начат`
    });
  };

  const endCall = () => {
    setActiveCall(null);
    toast({
      title: 'Звонок завершён',
      description: 'Связь прервана'
    });
  };

  const createDirectChat = async (userId: number) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const response = await fetch(`${API_URL}?path=create-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(CURRENT_USER_ID)
        },
        body: JSON.stringify({
          name: user.display_name,
          type: 'chat',
          member_ids: [userId]
        })
      });

      if (response.ok) {
        const data = await response.json();
        loadChats();
        setActiveChat(data.chat.id);
        setShowUserSearch(false);
        toast({
          title: 'Чат создан',
          description: `Начните переписку с ${user.display_name}`
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
      <div className="h-screen flex">
        <Sidebar 
          showCustomization={showCustomization}
          setShowCustomization={setShowCustomization}
        />
        
        <ChatList
          chats={chats}
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          createNewChat={createNewChat}
          formatTime={formatTime}
          onSearchUsers={() => setShowUserSearch(true)}
        />
        
        <ChatWindow
          activeChatData={activeChatData}
          messages={messages}
          message={message}
          setMessage={setMessage}
          sendMessage={sendMessage}
          addReaction={addReaction}
          formatTime={formatTime}
          loading={loading}
          activeChat={activeChat}
          currentUserId={CURRENT_USER_ID}
          onStartCall={startCall}
          activeCall={activeCall}
          onEndCall={endCall}
        />
        
        <ChatInfo
          activeChatData={activeChatData}
          voiceRooms={voiceRooms}
          showCustomization={showCustomization}
        />

        {showUserSearch && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowUserSearch(false)}>
            <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Поиск пользователей</h2>
                <button onClick={() => setShowUserSearch(false)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
              <div className="space-y-2">
                {users.filter(u => u.id !== CURRENT_USER_ID).map(user => (
                  <div
                    key={user.id}
                    onClick={() => createDirectChat(user.id)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 cursor-pointer transition-all"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: user.avatar_color }}>
                      {user.display_name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{user.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;