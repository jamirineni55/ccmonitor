import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCreditCardById, updateCreditCard } from '@/services/supabase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2 } from 'lucide-react';

// Card network options
const cardNetworks = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'American Express' },
  { value: 'discover', label: 'Discover' },
  { value: 'rupay', label: 'RuPay' },
  { value: 'other', label: 'Other' },
];

// Card color options
const cardColors = [
  { value: '#1e293b', label: 'Navy' },
  { value: '#0f172a', label: 'Dark Blue' },
  { value: '#18181b', label: 'Dark Gray' },
  { value: '#171717', label: 'Black' },
  { value: '#701a75', label: 'Purple' },
  { value: '#9f1239', label: 'Red' },
  { value: '#1e40af', label: 'Blue' },
  { value: '#065f46', label: 'Green' },
];

// Form schema
const formSchema = z.object({
  card_name: z.string().min(1, { message: 'Card name is required' }),
  last_four_digits: z
    .string()
    .length(4, { message: 'Last four digits must be exactly 4 digits' })
    .regex(/^\d+$/, { message: 'Last four digits must contain only digits' }),
  card_network: z.string().min(1, { message: 'Card network is required' }),
  bank_name: z.string().min(1, { message: 'Bank name is required' }),
  last_bill_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Last bill date must be in YYYY-MM-DD format',
  }).optional().or(z.literal('')),
  last_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Last due date must be in YYYY-MM-DD format',
  }).optional().or(z.literal('')),
  credit_limit: z.coerce
    .number()
    .min(0, { message: 'Credit limit must be a positive number' }),
  current_balance: z.coerce
    .number()
    .min(0, { message: 'Current balance must be a positive number' }),
  joining_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Joining date must be in YYYY-MM-DD format',
  }).optional().or(z.literal('')),
  joining_fees: z.coerce
    .number()
    .min(0, { message: 'Joining fees must be a positive number' }),
  annual_fees: z.coerce
    .number()
    .min(0, { message: 'Annual fees must be a positive number' }),
  color: z.string().min(1, { message: 'Card color is required' }),
});

// Type for credit card data
type CreditCardType = z.infer<typeof formSchema> & {
  id: string;
  user_id: string;
  available_credit: number;
  bill_cycle_days?: number;
  created_at: string;
};

export default function EditCreditCard() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [creditCard, setCreditCard] = useState<CreditCardType | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      card_name: '',
      last_four_digits: '',
      card_network: '',
      bank_name: '',
      last_bill_date: '',
      last_due_date: '',
      credit_limit: 0,
      current_balance: 0,
      joining_date: '',
      joining_fees: 0,
      annual_fees: 0,
      color: '#1e293b',
    },
  });

  useEffect(() => {
    async function fetchCreditCard() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await getCreditCardById(id);
        
        if (error) throw error;
        if (!data || data.length === 0) {
          toast.error('Credit card not found');
          navigate('/credit-cards');
          return;
        }
        
        const card = data[0];
        setCreditCard(card);
        
        // Set form values
        form.reset({
          card_name: card.card_name,
          last_four_digits: card.last_four_digits,
          card_network: card.card_network,
          bank_name: card.bank_name,
          last_bill_date: card.last_bill_date || '',
          last_due_date: card.last_due_date || '',
          credit_limit: card.credit_limit,
          current_balance: card.current_balance,
          joining_date: card.joining_date || '',
          joining_fees: card.joining_fees || 0,
          annual_fees: card.annual_fees || 0,
          color: card.color,
        });
      } catch (error) {
        console.error('Error fetching credit card:', error);
        toast.error('Failed to load credit card details');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCreditCard();
  }, [id, navigate, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!id || !creditCard) return;
    
    setIsSaving(true);
    try {
      // Calculate bill cycle days if both dates are provided
      let billCycleDays = creditCard.bill_cycle_days;
      if (values.last_bill_date && values.last_due_date) {
        const billDate = new Date(values.last_bill_date);
        const dueDate = new Date(values.last_due_date);
        billCycleDays = Math.round((dueDate.getTime() - billDate.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      // Calculate available credit
      const availableCredit = values.credit_limit - values.current_balance;
      
      const cardData = {
        ...values,
        bill_cycle_days: billCycleDays,
        available_credit: availableCredit,
      };
      
      const { error } = await updateCreditCard(id, cardData);
      
      if (error) throw error;
      
      toast.success('Credit card updated successfully');
      navigate('/credit-cards');
    } catch (error) {
      console.error('Error updating credit card:', error);
      toast.error('Failed to update credit card');
    } finally {
      setIsSaving(false);
    }
  }


  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading credit card details...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-4xl px-4 sm:px-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit Credit Card</h1>
        <p className="text-muted-foreground">Update your credit card details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Card Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="card_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. My Visa Card" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. HDFC Bank" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="last_four_digits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Four Digits</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1234" 
                          {...field} 
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '');
                            field.onChange(digits.slice(0, 4));
                          }}
                          maxLength={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="card_network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Network</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select card network" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cardNetworks.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="credit_limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Limit</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50000" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="current_balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Balance</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="10000" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="last_bill_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Bill Date</FormLabel>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Due Date</FormLabel>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="joining_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Joining Date</FormLabel>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        setDate={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="joining_fees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Joining Fees</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1000" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="annual_fees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Fees</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="999" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(parseFloat(e.target.value) || 0);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Color</FormLabel>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                      {cardColors.map((color) => (
                        <div 
                          key={color.value}
                          className={`h-10 cursor-pointer rounded-md transition-all hover:scale-105 ${
                            field.value === color.value ? 'ring-2 ring-primary ring-offset-2' : ''
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => form.setValue('color', color.value)}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/credit-cards')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
