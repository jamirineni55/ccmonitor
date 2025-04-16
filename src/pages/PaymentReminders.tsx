import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPaymentReminders, getCreditCards, addPaymentReminder, updatePaymentReminder, deletePaymentReminder } from '@/services/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, Plus, Check, AlertTriangle, Trash2, ChevronLeft, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import { format, isBefore, isToday, addDays } from 'date-fns';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PaymentReminderType } from '@/types/paymentReminder';
import { CreditCardType } from '@/types/creditCard';
import { reminderFormSchema, ReminderFormValues } from '@/types/schemas';

export default function PaymentReminders() {
  const [reminders, setReminders] = useState<PaymentReminderType[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<PaymentReminderType | null>(null);
  const [reminderToDelete, setReminderToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema) as Resolver<ReminderFormValues>,
    defaultValues: {
      credit_card_id: '',
      due_date: undefined as unknown as Date,
      amount: 0,
      notes: '',
      is_paid: false,
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editingReminder) {
      form.reset({
        credit_card_id: editingReminder.credit_card_id,
        due_date: new Date(editingReminder.due_date),
        amount: editingReminder.amount,
        notes: editingReminder.notes || '',
        is_paid: editingReminder.is_paid,
      });
    } else {
      form.reset({
        credit_card_id: '',
        due_date: undefined as unknown as Date,
        amount: 0,
        notes: '',
        is_paid: false,
      });
    }
  }, [editingReminder, form]);

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
      setReminders(remindersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit(values: ReminderFormValues) {
    try {
      if (editingReminder) {
        // Update existing reminder
        const { error } = await updatePaymentReminder(editingReminder.id, values);
        
        if (error) throw error;
        
        setReminders(prev => prev.map(reminder => 
          reminder.id === editingReminder.id 
            ? { ...reminder, ...values, due_date: values.due_date.toISOString() } 
            : reminder
        ));
        
        toast.success('Payment reminder updated');
      } else {
        // Add new reminder
        const { data, error } = await addPaymentReminder({
          ...values,
          due_date: values.due_date.toISOString(),
        });
        
        if (error) throw error;
        
        if (data) {
          setReminders(prev => [...prev, data[0]]);
        }
        
        toast.success('Payment reminder added');
      }
      
      setIsDialogOpen(false);
      setEditingReminder(null);
      form.reset();
    } catch (error) {
      console.error('Error saving payment reminder:', error);
      toast.error('Failed to save payment reminder');
    }
  }

  async function handleToggleStatus(reminder: PaymentReminderType) {
    try {
      const { error } = await updatePaymentReminder(reminder.id, {
        ...reminder,
        is_paid: !reminder.is_paid,
      });
      
      if (error) throw error;
      
      setReminders(prev => prev.map(r => 
        r.id === reminder.id 
          ? { ...r, is_paid: !r.is_paid } 
          : r
      ));
      
      toast.success(`Payment marked as ${!reminder.is_paid ? 'paid' : 'unpaid'}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  }

  async function handleDeleteReminder() {
    if (!reminderToDelete) return;
    
    try {
      const { error } = await deletePaymentReminder(reminderToDelete);
      
      if (error) throw error;
      
      setReminders(prev => prev.filter(r => r.id !== reminderToDelete));
      
      toast.success('Payment reminder deleted');
    } catch (error) {
      console.error('Error deleting payment reminder:', error);
      toast.error('Failed to delete payment reminder');
    } finally {
      setReminderToDelete(null);
    }
  }

  function getCreditCardById(id: string) {
    return creditCards.find(card => card.id === id);
  }

  function getStatusColor(dueDate: string, isPaid: boolean) {
    if (isPaid) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    const date = new Date(dueDate);
    
    if (isBefore(date, new Date()) && !isToday(date)) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
    
    if (isToday(date) || isBefore(date, addDays(new Date(), 3))) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
    
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  }

  function getStatusText(dueDate: string, isPaid: boolean) {
    if (isPaid) return 'Paid';
    const date = new Date(dueDate);
    
    if (isBefore(date, new Date()) && !isToday(date)) {
      return 'Overdue';
    }
    
    if (isToday(date)) {
      return 'Due Today';
    }
    
    if (isBefore(date, addDays(new Date(), 3))) {
      return 'Due Soon';
    }
    
    return 'Upcoming';
  }

  function getStatusIcon(dueDate: string, isPaid: boolean) {
    if (isPaid) return <Check className="h-4 w-4" />;
    const date = new Date(dueDate);
    
    if (isBefore(date, new Date()) && !isToday(date)) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    
    if (isToday(date) || isBefore(date, addDays(new Date(), 3))) {
      return <AlertTriangle className="h-4 w-4" />;
    }
    
    return <CalendarClock className="h-4 w-4" />;
  }

  const upcomingReminders = reminders.filter(reminder => !reminder.is_paid);
  const paidReminders = reminders.filter(reminder => reminder.is_paid);

  return (
    <div className="container mx-auto py-4 space-y-4 px-4 sm:px-6 sm:py-6 sm:space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center">
          <Link to="/" className="mr-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Payment Reminders</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-muted-foreground">
            Track and manage your credit card payment due dates
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingReminder(null);
                  setIsDialogOpen(true);
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-w-[95vw] rounded-lg">
              <DialogHeader>
                <DialogTitle>{editingReminder ? 'Edit Payment Reminder' : 'Add Payment Reminder'}</DialogTitle>
                <DialogDescription>
                  {editingReminder 
                    ? 'Update the payment reminder details below'
                    : 'Add a new payment reminder for your credit card'
                  }
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="credit_card_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credit Card</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a credit card" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {creditCards.map(card => (
                              <SelectItem key={card.id} value={card.id}>
                                {card.card_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date('1900-01-01')}
                          className="rounded-md border shadow"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0.01" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Add notes about this payment" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_paid"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Mark as Paid
                          </FormLabel>
                          <FormDescription>
                            Toggle if this payment has been completed
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
                    <Button type="submit" className="w-full sm:w-auto">
                      {editingReminder ? 'Update Reminder' : 'Add Reminder'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming" className="flex items-center gap-1.5">
            <CalendarClock className="h-4 w-4" />
            Upcoming ({upcomingReminders.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex items-center gap-1.5">
            <Check className="h-4 w-4" />
            Paid ({paidReminders.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : upcomingReminders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarClock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No upcoming payments</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  You don't have any upcoming payment reminders
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingReminder(null);
                    setIsDialogOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Add Reminder
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingReminders.map(reminder => {
                const card = getCreditCardById(reminder.credit_card_id);
                
                return (
                  <Card key={reminder.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">
                          {card?.card_name || 'Unknown Card'}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingReminder(reminder);
                              setIsDialogOpen(true);
                            }}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setReminderToDelete(reminder.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm text-muted-foreground">
                          Due Date
                        </div>
                        <div className="font-medium">
                          {format(new Date(reminder.due_date), 'dd MMM yyyy')}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-muted-foreground">
                          Amount
                        </div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('en-IN', { 
                            style: 'currency', 
                            currency: 'INR' 
                          }).format(reminder.amount)}
                        </div>
                      </div>
                      
                      {reminder.notes && (
                        <div className="mb-4 text-sm">
                          <div className="text-muted-foreground mb-1">Notes</div>
                          <div className="bg-muted p-2 rounded-md">{reminder.notes}</div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reminder.due_date, reminder.is_paid)}`}>
                          {getStatusIcon(reminder.due_date, reminder.is_paid)}
                          {getStatusText(reminder.due_date, reminder.is_paid)}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleToggleStatus(reminder)}
                        >
                          Mark as Paid
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="paid" className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : paidReminders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Check className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No paid payments</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  You don't have any paid payment reminders
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paidReminders.map(reminder => {
                const card = getCreditCardById(reminder.credit_card_id);
                
                return (
                  <Card key={reminder.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">
                          {card?.card_name || 'Unknown Card'}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingReminder(reminder);
                              setIsDialogOpen(true);
                            }}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setReminderToDelete(reminder.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm text-muted-foreground">
                          Due Date
                        </div>
                        <div className="font-medium">
                          {format(new Date(reminder.due_date), 'dd MMM yyyy')}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-muted-foreground">
                          Amount
                        </div>
                        <div className="font-medium">
                          {new Intl.NumberFormat('en-IN', { 
                            style: 'currency', 
                            currency: 'INR' 
                          }).format(reminder.amount)}
                        </div>
                      </div>
                      
                      {reminder.notes && (
                        <div className="mb-4 text-sm">
                          <div className="text-muted-foreground mb-1">Notes</div>
                          <div className="bg-muted p-2 rounded-md">{reminder.notes}</div>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reminder.due_date, reminder.is_paid)}`}>
                          {getStatusIcon(reminder.due_date, reminder.is_paid)}
                          {getStatusText(reminder.due_date, reminder.is_paid)}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleToggleStatus(reminder)}
                        >
                          Mark as Unpaid
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this payment reminder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReminderToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReminder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
