import { ReactNode } from "react";
import Footer from "@/components/common/Footer";
import { Link } from "wouter";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-discord-dark text-white">
      <header className="bg-discord-light shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="h-10 w-10 rounded-full bg-discord-primary flex items-center justify-center">
                <span className="material-icons text-white">smart_toy</span>
              </div>
              <span className="ml-2 text-xl font-heading font-bold text-white">CryptoBotics</span>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
