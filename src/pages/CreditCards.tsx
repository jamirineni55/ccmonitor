import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCreditCards, deleteCreditCard } from '@/services/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Trash2, PencilLine, FileText } from 'lucide-react';
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

// Import types and utility functions
import { CreditCardType } from '@/types/creditCard';
import { formatCurrency, formatExpiryDate, calculateUtilization } from '@/lib/utils/format';
import { containerVariants, itemVariants } from '@/lib/utils/animations';

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
              <Card className="overflow-hidden pt-0">
                <div 
                  className="min-h-40 p-6 text-white"
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
                      <div className="opacity-80">Expires</div>
                      <div className="font-medium">
                        {card.expiry_date ? formatExpiryDate(card.expiry_date) : 'MM/YY'}
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="px-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Current Balance</span>
                      <span className="text-sm">{formatCurrency(card.current_balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Credit Limit</span>
                      <span className="text-sm">{formatCurrency(card.credit_limit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Available Credit</span>
                      <span className="text-sm">{formatCurrency(card.available_credit)}</span>
                    </div>
                    
                    {/* Utilization bar */}
                    <div className="mt-2">
                      <div className="mb-3 flex justify-between text-xs">
                        <span>Utilization</span>
                        <span>{Math.round(calculateUtilization(card.current_balance, card.credit_limit))}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div 
                          className="h-full rounded-full bg-primary" 
                          style={{ 
                            width: `${Math.min(calculateUtilization(card.current_balance, card.credit_limit), 100)}%`,
                            backgroundColor: calculateUtilization(card.current_balance, card.credit_limit) > 80 ? '#ef4444' : undefined
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      asChild
                    >
                      <Link to={`/credit-cards/${card.id}/statements`}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="icon"
                          onClick={() => setCardToDelete(card.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your
                            credit card and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setCardToDelete(null)}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteCard}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button variant="outline" size="icon" asChild>
                      <Link to={`/credit-cards/edit/${card.id}`}>
                        <PencilLine className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-medium">No credit cards found</h3>
            <p className="text-sm text-muted-foreground">
              You haven't added any credit cards yet. Add your first card to get started.
            </p>
          </div>
          <Button asChild>
            <Link to="/credit-cards/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Credit Card
            </Link>
          </Button>
        </div>
      )}
    </motion.div>
  );
}
