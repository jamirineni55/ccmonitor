import { useEffect, useState } from 'react';
import { getPaymentReminders, getCreditCards, addPaymentReminder, updatePaymentReminder, deletePaymentReminder } from '@/services/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarClock, Plus, Check, AlertTriangle, CreditCard, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format, isBefore, isToday, addDays } from 'date-fns';
import { z } from 'zod';
import { useForm, Control, SubmitHandler, Resolver } from 'react-hook-form';
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

// Types for our data
type CreditCardType = {
  id: string;
  name: string;
  number: string;
  card_type: string;
  color: string;
  limit: number;
  current_balance: number;
};

type PaymentReminderType = {
  id: string;
  credit_card_id: string;
  due_date: string;
  amount: number;
  is_paid: boolean;
  notes?: string;
  user_id: string;
  created_at: string;
};

// Form schema
const reminderFormSchema = z.object({
  credit_card_id: z.string().min(1, { message: 'Please select a credit card' }),
  due_date: z.date(),
  amount: z.coerce.number().min(0.01, { message: 'Amount must be greater than 0' }),
  notes: z.string().optional(),
  is_paid: z.boolean().default(false),
});

type ReminderFormValues = z.infer<typeof reminderFormSchema>;

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
      const reminderData = {
        ...values,
        due_date: format(values.due_date, 'yyyy-MM-dd'),
      };
      
      if (editingReminder) {
        // Update existing reminder
        const { error } = await updatePaymentReminder(editingReminder.id, reminderData);
        if (error) throw error;
        
        setReminders(prev => 
          prev.map(reminder => 
            reminder.id === editingReminder.id 
              ? { ...reminder, ...reminderData }
              : reminder
          )
        );
        
        toast.success('Payment reminder updated');
      } else {
        // Add new reminder
        const { data, error } = await addPaymentReminder(reminderData);
        if (error) throw error;
        
        if (data) {
          setReminders(prev => [...prev, data[0]]);
        }
        
        toast.success('Payment reminder added');
      }
      
      setIsDialogOpen(false);
      setEditingReminder(null);
    } catch (error) {
      console.error('Error saving payment reminder:', error);
      toast.error('Failed to save payment reminder');
    }
  }

  async function handleDeleteReminder() {
    if (!reminderToDelete) return;
    
    try {
      const { error } = await deletePaymentReminder(reminderToDelete);
      
      if (error) throw error;
      
      setReminders(prev => prev.filter(reminder => reminder.id !== reminderToDelete));
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Reminders</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your credit card payment due dates
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingReminder(null);
                setIsDialogOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
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
              <form onSubmit={form.handleSubmit(onSubmit as SubmitHandler<ReminderFormValues>)} className="space-y-6">
                <FormField
                  control={form.control as Control<ReminderFormValues>}
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
                              {card.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control as Control<ReminderFormValues>}
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
                  control={form.control as Control<ReminderFormValues>}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
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
                  control={form.control as Control<ReminderFormValues>}
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
                  control={form.control as Control<ReminderFormValues>}
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
                <DialogFooter>
                  <Button type="submit">
                    {editingReminder ? 'Update Reminder' : 'Add Reminder'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingReminders
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                .map((reminder) => {
                  const card = getCreditCardById(reminder.credit_card_id);
                  return (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="overflow-hidden h-full">
                        <div 
                          className="h-2" 
                          style={{ backgroundColor: card?.color || '#888888' }}
                        />
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <span>{card?.name || 'Unknown Card'}</span>
                              </CardTitle>
                              <CardDescription>
                                Due {format(new Date(reminder.due_date), 'MMMM d, yyyy')}
                              </CardDescription>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingReminder(reminder);
                                  setIsDialogOpen(true);
                                }}
                                className="h-8 w-8"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                <span className="sr-only">Edit</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Payment Reminder</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this payment reminder? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => {
                                        setReminderToDelete(reminder.id);
                                        handleDeleteReminder();
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {card?.card_type || 'Credit Card'}
                              </span>
                            </div>
                            <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(reminder.due_date, reminder.is_paid)}`}>
                              {getStatusIcon(reminder.due_date, reminder.is_paid)}
                              {getStatusText(reminder.due_date, reminder.is_paid)}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Amount Due</span>
                              <span className="text-sm font-bold">${reminder.amount.toFixed(2)}</span>
                            </div>
                            {reminder.notes && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                <p className="italic">{reminder.notes}</p>
                              </div>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 w-full gap-1.5"
                              onClick={() => {
                                setEditingReminder(reminder);
                                form.setValue('is_paid', true);
                                onSubmit({
                                  ...form.getValues(),
                                  is_paid: true,
                                });
                              }}
                            >
                              <Check className="h-4 w-4" />
                              Mark as Paid
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
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
                <p className="text-muted-foreground mt-1">
                  You haven't marked any payments as paid yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paidReminders
                .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
                .map((reminder) => {
                  const card = getCreditCardById(reminder.credit_card_id);
                  return (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="overflow-hidden h-full opacity-80">
                        <div 
                          className="h-2" 
                          style={{ backgroundColor: card?.color || '#888888' }}
                        />
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <span>{card?.name || 'Unknown Card'}</span>
                              </CardTitle>
                              <CardDescription>
                                Due {format(new Date(reminder.due_date), 'MMMM d, yyyy')}
                              </CardDescription>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingReminder(reminder);
                                  setIsDialogOpen(true);
                                }}
                                className="h-8 w-8"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                <span className="sr-only">Edit</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Payment Reminder</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this payment reminder? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => {
                                        setReminderToDelete(reminder.id);
                                        handleDeleteReminder();
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {card?.card_type || 'Credit Card'}
                              </span>
                            </div>
                            <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(reminder.due_date, reminder.is_paid)}`}>
                              {getStatusIcon(reminder.due_date, reminder.is_paid)}
                              {getStatusText(reminder.due_date, reminder.is_paid)}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">Amount Paid</span>
                              <span className="text-sm font-bold">${reminder.amount.toFixed(2)}</span>
                            </div>
                            {reminder.notes && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                <p className="italic">{reminder.notes}</p>
                              </div>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-2 w-full gap-1.5"
                              onClick={() => {
                                setEditingReminder(reminder);
                                form.setValue('is_paid', false);
                                onSubmit({
                                  ...form.getValues(),
                                  is_paid: false,
                                });
                              }}
                            >
                              <AlertTriangle className="h-4 w-4" />
                              Mark as Unpaid
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
