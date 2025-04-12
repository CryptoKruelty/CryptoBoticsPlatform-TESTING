import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/dashboard',
        },
      });
      
      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "You are now subscribed!",
        });
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An error occurred during payment processing",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-discord-light p-4 rounded-md">
        <PaymentElement />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isSubmitting}
        className="w-full py-3 bg-discord-primary text-white rounded-md font-medium hover:bg-opacity-90 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <span className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></span>
            Processing...
          </span>
        ) : (
          "Subscribe Now"
        )}
      </button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();
  
  // Check if user has an active subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['/api/user/subscription'],
  });
  
  useEffect(() => {
    // Get client secret for payment intent
    const getSubscriptionIntent = async () => {
      try {
        const res = await apiRequest("POST", "/api/get-or-create-subscription", {});
        const data = await res.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to create subscription",
          variant: "destructive",
        });
      }
    };
    
    if (!isLoadingSubscription && subscription?.status !== 'active') {
      getSubscriptionIntent();
    }
  }, [isLoadingSubscription, subscription, toast]);
  
  if (isLoadingSubscription) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-transparent border-discord-primary rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (subscription?.status === 'active') {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-8">
          <div className="bg-discord-lighter rounded-lg shadow-lg p-6 text-center">
            <span className="material-icons text-crypto-success text-5xl mb-4">check_circle</span>
            <h2 className="text-2xl font-heading font-bold mb-4">You're Already Subscribed!</h2>
            <p className="text-discord-secondary mb-6">
              You already have an active Pro subscription. You can manage your subscription from the dashboard.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 bg-discord-primary text-white rounded-md hover:bg-opacity-90"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!clientSecret) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-transparent border-discord-primary rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-2xl font-heading font-bold mb-6">Subscribe to CryptoBotics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="col-span-2">
            <div className="bg-discord-lighter rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-heading font-medium mb-4">Payment Details</h2>
              
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm />
              </Elements>
            </div>
          </div>
          
          <div className="col-span-1">
            <div className="bg-discord-lighter rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-heading font-medium mb-4">Pricing Information</h2>
              
              <div className="space-y-3 mb-4">
                <h3 className="font-medium">Bot Base Pricing:</h3>
                <div className="flex justify-between text-sm">
                  <span>Standard Bot</span>
                  <span>$5.00/month</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Alert Bot</span>
                  <span>$8.00/month</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Custom RPC Bot</span>
                  <span>$11.00/month</span>
                </div>
                <div className="pt-2 border-t border-discord-dark">
                  <h3 className="font-medium mt-2">Update Frequency Add-ons:</h3>
                  <div className="flex justify-between text-sm">
                    <span>30-Second Updates</span>
                    <span>+$2.00/month</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>15-Second Updates</span>
                    <span>+$5.00/month</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-discord-light rounded-md p-3 text-sm">
                <h3 className="font-medium mb-2">Subscription Benefits:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="material-icons text-crypto-success mr-2 text-sm">check_circle</span>
                    <span>Pay only for what you use</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-crypto-success mr-2 text-sm">check_circle</span>
                    <span>All blockchain networks supported</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-crypto-success mr-2 text-sm">check_circle</span>
                    <span>24/7 uptime monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-crypto-success mr-2 text-sm">check_circle</span>
                    <span>Cancel or modify anytime</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
