import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface SidebarProps {
  showCustomization: boolean;
  setShowCustomization: (show: boolean) => void;
}

export const Sidebar = ({ showCustomization, setShowCustomization }: SidebarProps) => {
  return (
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
  );
};
