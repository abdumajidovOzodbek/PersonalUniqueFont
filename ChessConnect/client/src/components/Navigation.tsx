The code adds a profile settings link to the navigation dropdown menu.
```
```replit_final_file
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Sword, Menu, Play, User, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navigation() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleQuickPlay = () => {
    setLocation("/");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button
                onClick={() => setLocation("/")}
                className="text-2xl font-bold text-green-600 hover:text-green-700 transition-colors"
              >
                <Sword className="inline-block w-8 h-8 mr-2" />
                OpenChess
              </button>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              <button
                onClick={() => setLocation("/")}
                className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Play
              </button>
              <button className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors">
                Puzzles
              </button>
              <button className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors">
                Learn
              </button>
              <button className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors">
                Community
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button onClick={handleQuickPlay} className="bg-green-600 hover:bg-green-700 hidden sm:inline-flex">
              <Play className="w-4 h-4 mr-2" />
              Quick Play
            </Button>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                      <AvatarFallback>
                        {user.firstName ? user.firstName[0] : user.id.startsWith('guest_') ? 'G' : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.firstName 
                          ? user.firstName
                          : user.id.startsWith('guest_') 
                          ? 'Guest Player'
                          : 'Player'
                        }
                      </p>
                      {user.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Rating: {user.rating || 1200}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation('/profile')}>
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleQuickPlay}>
                    <Play className="mr-2 h-4 w-4" />
                    <span>Quick Play</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <button
              onClick={() => {
                setLocation("/");
                setShowMobileMenu(false);
              }}
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 w-full text-left"
            >
              Play
            </button>
            <button className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 w-full text-left">
              Puzzles
            </button>
            <button className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 w-full text-left">
              Learn
            </button>
            <button className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 w-full text-left">
              Community
            </button>
            <div className="pt-2">
              <Button onClick={handleQuickPlay} className="w-full bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Quick Play
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}