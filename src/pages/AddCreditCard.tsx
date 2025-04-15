import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addCreditCard } from '@/services/supabase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Card type options
const cardTypes = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'American Express' },
  { value: 'discover', label: 'Discover' },
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
  name: z.string().min(1, { message: 'Card name is required' }),
  number: z
    .string()
    .min(13, { message: 'Card number must be at least 13 digits' })
    .max(19, { message: 'Card number must be at most 19 digits' })
    .regex(/^\d+$/, { message: 'Card number must contain only digits' }),
  expiry_date: z.string().regex(/^\d{4}-\d{2}$/, {
    message: 'Expiry date must be in YYYY-MM format',
  }),
  cvv: z
    .string()
    .min(3, { message: 'CVV must be at least 3 digits' })
    .max(4, { message: 'CVV must be at most 4 digits' })
    .regex(/^\d+$/, { message: 'CVV must contain only digits' }),
  card_type: z.string().min(1, { message: 'Card type is required' }),
  color: z.string().min(1, { message: 'Card color is required' }),
  limit: z.coerce
    .number()
    .min(0, { message: 'Limit must be a positive number' }),
  current_balance: z.coerce
    .number()
    .min(0, { message: 'Balance must be a positive number' }),
});

export default function AddCreditCard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      number: '',
      expiry_date: '',
      cvv: '',
      card_type: '',
      color: '#1e293b',
      limit: 0,
      current_balance: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { error } = await addCreditCard(values);
      
      if (error) throw error;
      
      toast.success('Credit card added successfully');
      navigate('/credit-cards');
    } catch (error) {
      console.error('Error adding credit card:', error);
      toast.error('Failed to add credit card');
    } finally {
      setIsLoading(false);
    }
  }

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const groups = [];
    
    for (let i = 0; i < digits.length; i += 4) {
      groups.push(digits.slice(i, i + 4));
    }
    
    return groups.join(' ');
  };

  // Handle expiry date input
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value.match(/^\d{4}-\d{0,2}$/)) {
      form.setValue('expiry_date', value);
    } else if (value.match(/^\d{4}$/)) {
      form.setValue('expiry_date', `${value}-`);
    } else if (value.match(/^\d{0,4}$/)) {
      form.setValue('expiry_date', value);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Add Credit Card</h1>
        <p className="text-muted-foreground">Enter your credit card details to add it to your account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Card Information</CardTitle>
          <CardDescription>
            Fill in the details of your credit card. This information is securely stored.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. My Visa Card" {...field} />
                      </FormControl>
                      <FormDescription>
                        A name to identify this card
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="card_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select card type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cardTypes.map((type) => (
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

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="1234 5678 9012 3456" 
                          {...field} 
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '');
                            field.onChange(digits);
                          }}
                          value={formatCardNumber(field.value)}
                          maxLength={19}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiry Date</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="YYYY-MM" 
                            {...field} 
                            onChange={(e) => {
                              handleExpiryDateChange(e);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cvv"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CVV</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="123" 
                            type="password" 
                            {...field} 
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '');
                              field.onChange(digits);
                            }}
                            maxLength={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Limit</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="5000" 
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
              </div>

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Card Color</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
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
                    <FormDescription>
                      Choose a color for your card visualization
                    </FormDescription>
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
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Credit Card'}
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
