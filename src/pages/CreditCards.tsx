import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCreditCards, deleteCreditCard } from '@/services/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Trash2, PencilLine, AlertTriangle, Calendar, Clock } from 'lucide-react';
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
  card_name: string;
  last_four_digits: string;
  card_network: string;
  bank_name: string;
  last_bill_date: string;
  last_due_date: string;
  bill_cycle_days: number;
  credit_limit: number;
  current_balance: number;
  available_credit: number;
  joining_date: string;
  joining_fees: number;
  annual_fees: number;
  color: string;
  card_image?: string;
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

  // Format currency in Indian Rupees
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date in Indian format (DD/MM/YYYY)
  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    
    // Format as DD-MMM-YYYY (Indian format)
    const day = dateObj.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  // Calculate utilization percentage
  const calculateUtilization = (balance: number, limit: number) => {
    if (!limit) return 0;
    return (balance / limit) * 100;
  };

  // Determine if due date is approaching
  const isDueDateApproaching = (dueDate: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
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
            <span className="hidden sm:inline">Add Credit Card</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <p className="text-muted-foreground">Loading credit cards...</p>
        </div>
      ) : creditCards.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                    <div className="font-medium">{card.card_name}</div>
                    <div className="text-sm opacity-80">{card.card_network}</div>
                  </div>
                  <div className="mb-6 text-lg font-bold">
                    •••• •••• •••• {card.last_four_digits || '****'}
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <div className="opacity-80">Bank</div>
                      <div className="font-medium">{card.bank_name}</div>
                    </div>
                    <div>
                      <div className="opacity-80">Joined</div>
                      <div className="font-medium">{card.joining_date ? new Date(card.joining_date).getFullYear() : 'N/A'}</div>
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
                      <span className="font-medium">{formatCurrency(card.credit_limit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Available Credit</span>
                      <span className="font-medium">{formatCurrency(card.available_credit || (card.credit_limit - card.current_balance))}</span>
                    </div>
                  </div>
                  
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Utilization</span>
                    <span className="text-sm font-medium">
                      {Math.round(calculateUtilization(card.current_balance, card.credit_limit))}%
                    </span>
                  </div>
                  
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div 
                      className="h-full bg-primary"
                      style={{ 
                        width: `${Math.min(100, calculateUtilization(card.current_balance, card.credit_limit))}%`,
                        backgroundColor: calculateUtilization(card.current_balance, card.credit_limit) > 75 ? 'hsl(var(--destructive))' : undefined
                      }}
                    />
                  </div>

                  <div className="mt-4 grid gap-3 grid-cols-2">
                    <div className="rounded-md border p-3">
                      <div className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Last Bill Date
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(card.last_bill_date)}
                      </div>
                    </div>
                    
                    <div className="rounded-md border p-3">
                      <div className="text-sm font-medium flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Last Due Date
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(card.last_due_date)}
                        </span>
                        {isDueDateApproaching(card.last_due_date) && (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 grid-cols-2">
                    <div className="rounded-md border p-3">
                      <div className="text-sm font-medium">Bill Cycle</div>
                      <div className="text-sm text-muted-foreground">
                        {card.bill_cycle_days ? `${card.bill_cycle_days} days` : 'N/A'}
                      </div>
                    </div>
                    
                    <div className="rounded-md border p-3">
                      <div className="text-sm font-medium">Annual Fee</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(card.annual_fees)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/credit-cards/edit/${card.id}`}>
                        <PencilLine className="mr-1 h-3 w-3" />
                        <span className="hidden sm:inline">Edit</span>
                      </Link>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" onClick={() => setCardToDelete(card.id)}>
                          <Trash2 className="mr-1 h-3 w-3" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this credit card and all associated data.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setCardToDelete(null)}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteCard}>
                            Delete
                          </AlertDialogAction>
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
            <CardDescription>
              You haven't added any credit cards yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-center text-muted-foreground">
              Add your first credit card to start tracking your balances and payments.
            </p>
            <Button asChild>
              <Link to="/credit-cards/add">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Credit Card</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
