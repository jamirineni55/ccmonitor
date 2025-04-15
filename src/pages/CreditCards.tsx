import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCreditCards, deleteCreditCard } from '@/services/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Trash2, PencilLine, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Types for our data
type CreditCardType = {
  id: string;
  name: string;
  number: string;
  expiry_date: string;
  cvv: string;
  card_type: string;
  color: string;
  limit: number;
  current_balance: number;
  user_id: string;
  created_at: string;
};

export default function CreditCards() {
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCreditCards();
  }, []);

  async function fetchCreditCards() {
    try {
      setIsLoading(true);
      const { data, error } = await getCreditCards();
      
      if (error) throw error;
      setCreditCards(data || []);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
      toast.error('Failed to load credit cards');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteCard() {
    if (!cardToDelete) return;
    
    try {
      const { error } = await deleteCreditCard(cardToDelete);
      
      if (error) throw error;
      
      setCreditCards(prevCards => prevCards.filter(card => card.id !== cardToDelete));
      toast.success('Credit card deleted successfully');
    } catch (error) {
      console.error('Error deleting credit card:', error);
      toast.error('Failed to delete credit card');
    } finally {
      setCardToDelete(null);
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format expiry date
  const formatExpiryDate = (date: string) => {
    const [year, month] = date.split('-');
    return `${month}/${year.slice(2)}`;
  };

  // Calculate utilization percentage
  const calculateUtilization = (balance: number, limit: number) => {
    return (balance / limit) * 100;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Credit Cards</h1>
        <Button asChild>
          <Link to="/credit-cards/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Credit Card
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <p className="text-muted-foreground">Loading credit cards...</p>
        </div>
      ) : creditCards.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {creditCards.map((card) => (
            <motion.div key={card.id} variants={itemVariants}>
              <Card className="overflow-hidden">
                <div 
                  className="h-40 p-6 text-white"
                  style={{ 
                    backgroundColor: card.color || '#1e293b',
                    backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)'
                  }}
                >
                  <div className="mb-4 flex justify-between">
                    <div className="font-medium">{card.name}</div>
                    <div className="text-sm opacity-80">{card.card_type}</div>
                  </div>
                  <div className="mb-6 text-lg font-bold">
                    •••• •••• •••• {card.number.slice(-4)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <div className="opacity-80">Expires</div>
                      <div className="font-medium">{formatExpiryDate(card.expiry_date)}</div>
                    </div>
                    <div>
                      <div className="opacity-80">CVV</div>
                      <div className="font-medium">•••</div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Balance</span>
                      <span className="font-medium">{formatCurrency(card.current_balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Credit Limit</span>
                      <span className="font-medium">{formatCurrency(card.limit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Available Credit</span>
                      <span className="font-medium">{formatCurrency(card.limit - card.current_balance)}</span>
                    </div>
                  </div>
                  
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Utilization</span>
                    <span className="text-sm font-medium">
                      {Math.round(calculateUtilization(card.current_balance, card.limit))}%
                    </span>
                  </div>
                  
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className="h-full bg-primary"
                      style={{ 
                        width: `${Math.min(100, calculateUtilization(card.current_balance, card.limit))}%`,
                        backgroundColor: calculateUtilization(card.current_balance, card.limit) > 75 ? 'hsl(var(--destructive))' : undefined
                      }}
                    />
                  </div>
                  
                  {calculateUtilization(card.current_balance, card.limit) > 75 && (
                    <div className="mt-2 flex items-center text-sm text-destructive">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      <span>High utilization</span>
                    </div>
                  )}
                  
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      <PencilLine className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" onClick={() => setCardToDelete(card.id)}>
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this credit card and all associated payment reminders.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setCardToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteCard}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Credit Cards</CardTitle>
            <CardDescription>You haven't added any credit cards yet.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-center text-muted-foreground">
              Add your first credit card to start tracking your spending and payments.
            </p>
            <Button asChild>
              <Link to="/credit-cards/add">
                <Plus className="mr-2 h-4 w-4" />
                Add Credit Card
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
