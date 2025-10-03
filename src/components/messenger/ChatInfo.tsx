import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

interface VoiceRoom {
  id: number;
  name: string;
  participants: number;
}

interface ChatInfoProps {
  activeChatData: Chat | undefined;
  voiceRooms: VoiceRoom[];
  showCustomization: boolean;
}

export const ChatInfo = ({ activeChatData, voiceRooms, showCustomization }: ChatInfoProps) => {
  return (
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
  );
};
