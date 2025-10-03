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
        />
        
        <ChatInfo
          activeChatData={activeChatData}
          voiceRooms={voiceRooms}
          showCustomization={showCustomization}
        />
      </div>
    </div>
  );
};

export default Index;
