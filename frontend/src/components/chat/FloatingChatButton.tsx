import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MessageCircle, Users, CreditCard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import CommunityCenterChat from './CommunityCenterChat';

const FloatingChatButton: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) {
    return null; // Don't show for non-logged-in users
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg rounded-full p-4 h-14 w-14 flex items-center justify-center group"
          >
            <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
            {isOpen && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-2xl h-[80vh] p-0">
          <SheetHeader className="p-4 border-b bg-gray-50 dark:bg-gray-900">
            <SheetTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Community Center
              <div className="ml-auto flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  Online Now
                </span>
              </div>
            </SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-hidden">
            <CommunityCenterChat />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FloatingChatButton;
