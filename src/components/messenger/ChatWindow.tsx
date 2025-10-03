import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  avatar_color: string;
  content: string;
  created_at: string;
  reactions?: string[];
}

interface ChatWindowProps {
  activeChatData: Chat | undefined;
  messages: Message[];
  message: string;
  setMessage: (message: string) => void;
  sendMessage: () => void;
  addReaction: (messageId: number, emoji: string) => void;
  formatTime: (timestamp: string | null) => string;
  loading: boolean;
  activeChat: number | null;
  currentUserId: number;
}

export const ChatWindow = ({
  activeChatData,
  messages,
  message,
  setMessage,
  sendMessage,
  addReaction,
  formatTime,
  loading,
  activeChat,
  currentUserId
}: ChatWindowProps) => {
  return (
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
            className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <Card className={`max-w-md p-4 ${
              msg.sender_id === currentUserId
                ? 'bg-gradient-to-r from-primary to-primary/80' 
                : 'bg-card/80 backdrop-blur-sm'
            }`}>
              {msg.sender_id !== currentUserId && (
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
  );
};
