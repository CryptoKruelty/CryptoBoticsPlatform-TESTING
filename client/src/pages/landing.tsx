import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";

export default function Landing() {
  const [, setLocation] = useLocation();
  
  const { data: authData } = useQuery({
    queryKey: ['/auth/status'],
  });
  
  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (authData?.authenticated) {
      setLocation("/dashboard");
    }
  }, [authData, setLocation]);
  
  return (
    <div className="flex flex-col min-h-screen bg-discord-dark text-white">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-6">
              Display Real-Time DeFi Metrics <br />
              <span className="text-discord-primary">In Your Discord Server</span>
            </h1>
            <p className="text-xl md:text-2xl text-discord-secondary max-w-3xl mx-auto mb-8">
              Create custom Discord bots that display token prices, wallet balances, and more. 
              Real-time updates for your community.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/login"
                className="px-8 py-3 bg-discord-primary text-white rounded-md font-medium hover:bg-opacity-90 transition-colors"
              >
                Get Started
              </Link>
              <a 
                href="#features"
                className="px-8 py-3 border border-discord-primary text-discord-primary rounded-md font-medium hover:bg-discord-primary hover:bg-opacity-10 transition-colors"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>
        
        {/* Bot Types Section */}
        <section id="features" className="py-12 md:py-20 px-4 bg-discord-lighter">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-8">
              Our Discord Bots
            </h2>
            <p className="text-xl text-discord-secondary text-center max-w-3xl mx-auto mb-12">
              Choose the perfect bot for your Discord server from our suite of options
            </p>
            
            {/* 1. Standard Bots */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-discord-primary bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-2xl font-heading font-bold">Standard Bots</h3>
              </div>
              
              <p className="text-discord-secondary mb-8 max-w-4xl">
                Track and display real-time DeFi metrics in Discord. Ideal for consistent monitoring with flexible configuration options and customizable update frequencies.
              </p>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-discord-light p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">💰</span>
                    <h4 className="text-lg font-medium">Price Tracker</h4>
                  </div>
                  <p className="text-discord-secondary text-sm">
                    Track real-time token prices from DEXs (Uniswap, PancakeSwap). Bot nickname shows current price.
                  </p>
                </div>
                
                <div className="bg-discord-light p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">📈</span>
                    <h4 className="text-lg font-medium">Supply Tracker</h4>
                  </div>
                  <p className="text-discord-secondary text-sm">
                    Monitor circulating or maximum supply of a token. Perfect for tokenomics dashboards or burn metrics.
                  </p>
                </div>
                
                <div className="bg-discord-light p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">👛</span>
                    <h4 className="text-lg font-medium">Wallet Balance</h4>
                  </div>
                  <p className="text-discord-secondary text-sm">
                    Track balance of specific wallet addresses. Commonly used for treasury or developer wallet monitoring.
                  </p>
                </div>
                
                <div className="bg-discord-light p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🔥</span>
                    <h4 className="text-lg font-medium">Burn Tracker</h4>
                  </div>
                  <p className="text-discord-secondary text-sm">
                    Track balances of known burn addresses to display total tokens burned. Great for deflationary tokens.
                  </p>
                </div>
                
                <div className="bg-discord-light p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">💧</span>
                    <h4 className="text-lg font-medium">Liquidity Pool</h4>
                  </div>
                  <p className="text-discord-secondary text-sm">
                    Track liquidity pool reserves. Ideal for DeFi protocol dashboards or providing liquidity insights.
                  </p>
                </div>
                
                <div className="bg-discord-light p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🏦</span>
                    <h4 className="text-lg font-medium">TVL Tracker</h4>
                  </div>
                  <p className="text-discord-secondary text-sm">
                    Track Total Value Locked across a DeFi protocol or specific smart contracts in real-time.
                  </p>
                </div>
              </div>
            </div>
            
            {/* 2. Alert Bots */}
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-discord-primary bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚨</span>
                </div>
                <h3 className="text-2xl font-heading font-bold">Alert Bots</h3>
              </div>
              
              <p className="text-discord-secondary mb-8 max-w-4xl">
                Monitor blockchain activity for specific events and send alert messages to designated Discord channels.
                Set custom thresholds for transaction monitoring.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-discord-light p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🐋</span>
                    <h4 className="text-lg font-medium">Whale Alert Bot</h4>
                  </div>
                  <p className="text-discord-secondary">
                    Detect large token transfers above custom thresholds. Get instant notifications when whales are moving tokens,
                    with configurable alert messages and transaction details.
                  </p>
                </div>
                
                <div className="bg-discord-light p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🔔</span>
                    <h4 className="text-lg font-medium">Buy Alert Bot</h4>
                  </div>
                  <p className="text-discord-secondary">
                    Get notified when new buys occur. Customize message templates, set minimum transaction value,
                    and keep your community engaged with activity alerts.
                  </p>
                </div>
              </div>
            </div>
            
            {/* 3. Custom RPC Bot */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-discord-primary bg-opacity-20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h3 className="text-2xl font-heading font-bold">Custom RPC Bot</h3>
              </div>
              
              <p className="text-discord-secondary mb-8 max-w-4xl">
                Execute user-defined smart contract function calls using RPC. For advanced users who need specialized metrics
                not covered by our standard options.
              </p>
              
              <div className="bg-discord-light p-6 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🧩</span>
                  <h4 className="text-lg font-medium">Advanced Customization</h4>
                </div>
                <ul className="space-y-3 text-discord-secondary">
                  <li className="flex items-start">
                    <span className="material-icons text-crypto-success mr-2 mt-0.5 text-sm">check_circle</span>
                    <span>Support for complex data decoding from contract ABIs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-crypto-success mr-2 mt-0.5 text-sm">check_circle</span>
                    <span>Flexible output formatting via custom JSON paths</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-crypto-success mr-2 mt-0.5 text-sm">check_circle</span>
                    <span>Supports any EVM-compatible chain</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-crypto-success mr-2 mt-0.5 text-sm">check_circle</span>
                    <span>Perfect for developers needing specialized blockchain data</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-12 md:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">
              How It Works
            </h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="h-16 w-16 bg-discord-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="text-lg font-heading font-medium mb-2">Connect Discord</h3>
                <p className="text-discord-secondary">
                  Authorize with your Discord account to get started
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 bg-discord-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="text-lg font-heading font-medium mb-2">Create a Bot</h3>
                <p className="text-discord-secondary">
                  Choose a bot type and configure your metrics
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 bg-discord-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="text-lg font-heading font-medium mb-2">Set Up Subscription</h3>
                <p className="text-discord-secondary">
                  Select your plan and payment method
                </p>
              </div>
              
              <div className="text-center">
                <div className="h-16 w-16 bg-discord-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold">4</span>
                </div>
                <h3 className="text-lg font-heading font-medium mb-2">Go Live</h3>
                <p className="text-discord-secondary">
                  Your bot is now active in your Discord server
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pricing Section */}
        <section className="py-12 md:py-20 px-4 bg-discord-lighter">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
              Simple Pricing
            </h2>
            <p className="text-xl text-discord-secondary text-center max-w-3xl mx-auto mb-12">
              Pay only for what you need, cancel anytime
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-discord-light p-6 rounded-lg">
                <h3 className="text-xl font-heading font-medium mb-2">Standard Bot</h3>
                <p className="text-3xl font-bold mb-4">$5<span className="text-sm text-discord-secondary">/mo</span></p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <span className="material-icons text-crypto-success mr-2">check_circle</span>
                    <span>Real-time price tracking</span>
                  </li>
                  <li className="flex items-center">
                    <span className="material-icons text-crypto-success mr-2">check_circle</span>
                    <span>Token supply monitoring</span>
                  </li>
                  <li className="flex items-center">
                    <span className="material-icons text-crypto-success mr-2">check_circle</span>
                    <span>Wallet balance tracking</span>
                  </li>
                  <li className="flex items-center">
                    <span className="material-icons text-crypto-success mr-2">check_circle</span>
                    <span>60-second updates</span>
                  </li>
                </ul>
                <Link 
                  href="/login"
                  className="block w-full py-2 bg-discord-primary text-white rounded-md text-center font-medium hover:bg-opacity-90 transition-colors"
                >
                  Get Started
                </Link>
              </div>
              
              <div className="bg-discord-light border-2 border-discord-primary p-6 rounded-lg relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-discord-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
                <h3 className="text-xl font-heading font-medium mb-2">Alert Bot</h3>
                <p className="text-3xl font-bold mb-4">$8<span className="text-sm text-discord-secondary">/mo</span></p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <span className="material-icons text-crypto-success mr-2">check_circle</span>
                    <span>Whale transaction alerts</span>
                  </li>
                  <li className="flex items-center">
                    <span className="material-icons text-crypto-success mr-2">check_circle</span>
                    <span>Buy transaction notifications</span>
                  </li>
                  <li className="flex items-center">
                    <span className="material-icons text-crypto-success mr-2">check_circle</span>
                    <span>Customizable thresholds</span>
                  </li>
                  <li className="flex items-center">
                    <span className="material-icons text-crypto-success mr-2">check_circle</span>
                    <span>Real-time monitoring</span>
                  </li>
                </ul>
                <Link 
                  href="/login"
                  className="block w-full py-2 bg-discord-primary text-white rounded-md text-center font-medium hover:bg-opacity-90 transition-colors"
                >
                  Get Started
                </Link>
              </div>
              
              <div className="bg-discord-light p-6 rounded-lg">
                <h3 className="text-xl font-heading font-medium mb-2">Custom RPC Bot</h3>
                <p className="text-3xl font-bold mb-4">$11<span className="text-sm text-discord-secondary">/mo</span></p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <span className="material-icons text-crypto-success mr-2">check_circle</span>
                    <span>Custom smart contract calls</span>
                  </li>
                  <li className="flex items-center">
                    <span className="material-icons text-crypto-success mr-2">check_circle</span>
                    <span>Custom data formatting</span>
                  </li>
                  <li className="flex items-center">
                    <span className="material-icons text-crypto-success mr-2">check_circle</span>
                    <span>Advanced metrics</span>
                  </li>
                  <li className="flex items-center">
                    <span className="material-icons text-crypto-success mr-2">check_circle</span>
                    <span>60-second updates</span>
                  </li>
                </ul>
                <Link 
                  href="/login"
                  className="block w-full py-2 bg-discord-primary text-white rounded-md text-center font-medium hover:bg-opacity-90 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
            
            <div className="mt-12 bg-discord-light p-6 rounded-lg max-w-5xl mx-auto">
              <h3 className="text-xl font-heading font-medium mb-4">Add-ons</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <span className="material-icons text-discord-primary mr-3">speed</span>
                  <div>
                    <h4 className="font-medium mb-1">30-Second Updates</h4>
                    <p className="text-discord-secondary">Faster updates for any bot type</p>
                    <p className="text-crypto-accent mt-1">+$2.00/month</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="material-icons text-discord-primary mr-3">bolt</span>
                  <div>
                    <h4 className="font-medium mb-1">15-Second Updates</h4>
                    <p className="text-discord-secondary">Ultra-fast updates for any bot type</p>
                    <p className="text-crypto-accent mt-1">+$5.00/month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
              Ready to Enhance Your Discord Server?
            </h2>
            <p className="text-xl text-discord-secondary mb-8">
              Start tracking crypto metrics in real-time and keep your community informed.
            </p>
            <Link 
              href="/login"
              className="inline-block px-8 py-3 bg-discord-primary text-white rounded-md font-medium hover:bg-opacity-90 transition-colors"
            >
              Get Started with CryptoBotics
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
