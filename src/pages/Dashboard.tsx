import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCreditCards, getPaymentReminders } from '@/services/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, CalendarClock, Plus } from 'lucide-react';
import { isBefore, addDays } from 'date-fns';
import { PaymentReminderType } from '@/types/paymentReminder';
import { CreditCardType } from '@/types/creditCard';
import { formatCurrency, formatDate } from '@/lib/utils/format';


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

  // Get card by ID
  const getCardById = (id: string) => {
    return creditCards.find(card => card.id === id);
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 space-y-4 px-4 sm:px-6 sm:py-6 sm:space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-muted-foreground">
            Overview of your credit cards and upcoming payments
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button asChild className="flex-1 sm:flex-auto">
              <Link to="/credit-cards/add">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Credit Card</span>
                <span className="sm:hidden">Add Card</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {creditCards.length} active credit card{creditCards.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalLimit - totalBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalLimit > 0 ? Math.round((1 - totalBalance / totalLimit) * 100) : 0}% of total limit available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {upcomingReminders.length > 0 
                ? formatCurrency(upcomingReminders.reduce((sum, reminder) => sum + reminder.amount, 0))
                : "₹0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {upcomingReminders.length} payment{upcomingReminders.length !== 1 ? 's' : ''} due soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Cards Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
          <CardTitle className="text-base">Your Credit Cards</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/credit-cards" className="text-sm">View all</Link>
          </Button>
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
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
              <CreditCard className="mb-2 h-10 w-10 text-muted-foreground" />
              <h3 className="mb-1 text-lg font-medium">No credit cards yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add your first credit card to get started</p>
              <Button asChild>
                <Link to="/credit-cards/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Credit Card
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Reminders Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
          <CardTitle className="text-base">Upcoming Payments</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/payment-reminders" className="text-sm">View all</Link>
          </Button>
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
            <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-6 text-center">
              <CalendarClock className="mb-2 h-10 w-10 text-muted-foreground" />
              <h3 className="mb-1 text-lg font-medium">No upcoming payments</h3>
              <p className="text-sm text-muted-foreground">
                You don't have any payment reminders due soon
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
