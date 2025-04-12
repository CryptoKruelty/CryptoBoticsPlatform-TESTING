import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { logout, getDiscordAvatarUrl } from "@/lib/auth";

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { data: authData } = useQuery({
    queryKey: ['/auth/status'],
  });
  
  const user = authData?.user;
  
  const avatarUrl = user ? getDiscordAvatarUrl(user.discordId, user.avatar) : '';
  
  return (
    <nav className="bg-discord-light shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="h-10 w-10 rounded-full bg-discord-primary flex items-center justify-center">
                <span className="material-icons text-white">smart_toy</span>
              </div>
              <span className="ml-2 text-xl font-heading font-bold text-white">CryptoBotics</span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-6">
              <Link href="/dashboard" 
                className={`px-3 py-2 text-sm font-medium ${location === '/dashboard' ? 'text-white' : 'text-discord-secondary hover:text-white'}`}>
                Dashboard
              </Link>
              <a href="#" 
                className="text-discord-secondary hover:text-white px-3 py-2 text-sm font-medium">
                Documentation
              </a>
              <a href="#" 
                className="text-discord-secondary hover:text-white px-3 py-2 text-sm font-medium">
                Pricing
              </a>
              <a href="#" 
                className="text-discord-secondary hover:text-white px-3 py-2 text-sm font-medium">
                Support
              </a>
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <>
                <div className="hidden md:block px-3 py-2 text-sm font-medium text-white">
                  <div className="flex items-center">
                    <img src={avatarUrl} alt="User Avatar" className="h-8 w-8 rounded-full"/>
                    <span className="ml-2">{user.username}</span>
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="ml-2 md:ml-4 p-1 rounded-full text-discord-secondary hover:text-white focus:outline-none"
                >
                  <span className="material-icons">logout</span>
                </button>
              </>
            ) : (
              <Link href="/login"
                className="ml-2 px-4 py-2 rounded-md bg-discord-primary text-white hover:bg-opacity-90 focus:outline-none"
              >
                Login
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ml-2 p-1 rounded-full text-discord-secondary hover:text-white md:hidden focus:outline-none"
            >
              <span className="material-icons">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location === '/dashboard' ? 'bg-discord-primary text-white' : 'text-discord-secondary hover:bg-discord-lighter hover:text-white'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <a href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-discord-secondary hover:bg-discord-lighter hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Documentation
            </a>
            <a href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-discord-secondary hover:bg-discord-lighter hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </a>
            <a href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-discord-secondary hover:bg-discord-lighter hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Support
            </a>
          </div>
          {user && (
            <div className="pt-4 pb-3 border-t border-discord-dark">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <img src={avatarUrl} alt="User Avatar" className="h-10 w-10 rounded-full"/>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-white">{user.username}</div>
                </div>
                <button
                  onClick={() => logout()}
                  className="ml-auto p-1 rounded-full text-discord-secondary hover:text-white focus:outline-none"
                >
                  <span className="material-icons">logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
