import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCreditCards, getPaymentReminders } from '@/services/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, CalendarClock, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { isBefore, addDays } from 'date-fns';

// Types for our data
type CreditCardType = {
  id: string;
  card_name: string;
  bank_name: string;
  last_four_digits: string;
  expiry_date: string;
  cvv: string;
  card_type: string;
  color: string;
  credit_limit: number;
  current_balance: number;
  user_id: string;
  created_at: string;
};

type PaymentReminderType = {
  id: string;
  credit_card_id: string;
  due_date: string;
  amount: number;
  is_paid: boolean;
  user_id: string;
  created_at: string;
  credit_card?: CreditCardType;
};

export default function Dashboard() {
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [paymentReminders, setPaymentReminders] = useState<PaymentReminderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Fetch credit cards
        const { data: cardsData, error: cardsError } = await getCreditCards();
        if (cardsError) throw cardsError;
        setCreditCards(cardsData || []);
        
        // Fetch payment reminders
        const { data: remindersData, error: remindersError } = await getPaymentReminders();
        if (remindersError) throw remindersError;
        setPaymentReminders(remindersData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Calculate total balance across all cards
  const totalBalance = creditCards.reduce((sum, card) => sum + (card.current_balance || 0), 0);
  
  // Calculate total credit limit
  const totalLimit = creditCards.reduce((sum, card) => sum + (card.credit_limit || 0), 0);
  
  // Get upcoming payment reminders (due within 7 days and not paid)
  const upcomingReminders = paymentReminders
    .filter(reminder => !reminder.is_paid && isBefore(new Date(), addDays(new Date(reminder.due_date), 7)))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 3);

  // Format currency in Indian Rupees
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date in Indian format (DD-MMM-YYYY)
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

  // Get card by ID
  const getCardById = (id: string) => {
    return creditCards.find(card => card.id === id);
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

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/credit-cards/add">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add Credit Card</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
              <p className="text-xs text-muted-foreground">
                {creditCards.length} active credit card{creditCards.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalLimit - totalBalance)}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((1 - totalBalance / totalLimit) * 100)}% of total limit available
              </p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {upcomingReminders.length > 0 
                  ? formatCurrency(upcomingReminders.reduce((sum, reminder) => sum + reminder.amount, 0))
                  : "No upcoming payments"}
              </div>
              <p className="text-xs text-muted-foreground">
                {upcomingReminders.length} payment{upcomingReminders.length !== 1 ? 's' : ''} due soon
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Credit Cards Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Credit Cards</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/credit-cards">View All</Link>
              </Button>
            </div>
            <CardDescription>Manage your credit cards and view balances</CardDescription>
          </CardHeader>
          <CardContent>
            {creditCards.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {creditCards.slice(0, 3).map((card) => (
                  <div 
                    key={card.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: card.color || '#1e293b' }}
                      >
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{card.card_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {card.bank_name} • •••• {card.last_four_digits}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(card.current_balance)}</div>
                      <div className="text-sm text-muted-foreground">
                        of {formatCurrency(card.credit_limit)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <CreditCard className="mb-2 h-10 w-10 text-muted-foreground" />
                <h3 className="mb-1 text-lg font-medium">No credit cards yet</h3>
                <p className="text-sm text-muted-foreground">Add your first credit card to get started</p>
                <Button className="mt-4" asChild>
                  <Link to="/credit-cards/add">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Credit Card
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payment Reminders Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Payments</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/payment-reminders">View All</Link>
              </Button>
            </div>
            <CardDescription>Track your upcoming credit card payments</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingReminders.length > 0 ? (
              <div className="space-y-4">
                {upcomingReminders.map((reminder) => {
                  const card = getCardById(reminder.credit_card_id);
                  const dueDate = new Date(reminder.due_date);
                  const isOverdue = isBefore(dueDate, new Date());
                  const isDueToday = dueDate.toDateString() === new Date().toDateString();
                  
                  return (
                    <div 
                      key={reminder.id}
                      className={`flex items-center justify-between rounded-lg border p-4 ${
                        isOverdue ? 'border-destructive/50 bg-destructive/5' : 
                        isDueToday ? 'border-primary/50 bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {card && (
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: card.color || '#1e293b' }}
                          >
                            <CreditCard className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{card?.card_name || 'Unknown Card'}</div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <CalendarClock className="mr-1 h-3 w-3" />
                            {formatDate(reminder.due_date)}
                            {isOverdue && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                                Overdue
                              </span>
                            )}
                            {isDueToday && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                Today
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(reminder.amount)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <CalendarClock className="mb-2 h-10 w-10 text-muted-foreground" />
                <h3 className="mb-1 text-lg font-medium">No upcoming payments</h3>
                <p className="text-sm text-muted-foreground">
                  You don't have any payment reminders due soon
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
