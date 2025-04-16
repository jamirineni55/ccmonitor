import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addCreditCard } from '@/services/supabase';
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

// Import types and constants
import { cardNetworks, cardColors } from '@/constants';
import { creditCardFormSchema, type CreditCardFormValues } from '@/types/schemas';

export default function AddCreditCard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardFormSchema),
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
      expiry_date: '',
      color: '#1e293b',
    },
  });

  async function onSubmit(values: CreditCardFormValues) {
    setIsLoading(true);
    try {
      // Calculate bill cycle days if both dates are provided
      let billCycleDays = null;
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
      
      const { error } = await addCreditCard(cardData);
      
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-4xl px-4 sm:px-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Add Credit Card</h1>
        <p className="text-muted-foreground">Enter your credit card details to add it to your account</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Card Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-8 md:grid-cols-2">
                {/* Card Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Card Information</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
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
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select card network" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cardNetworks.map((network: { value: string; label: string }) => (
                                <SelectItem key={network.value} value={network.value}>
                                  {network.label}
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
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Color</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select card color" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cardColors.map((color) => (
                                <SelectItem key={color.value} value={color.value}>
                                  <div className="flex items-center">
                                    <div 
                                      className="w-4 h-4 rounded-full mr-2" 
                                      style={{ backgroundColor: color.value }}
                                    ></div>
                                    {color.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Financial Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Financial Details</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
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
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
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
                              placeholder="0" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
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
                              placeholder="0" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Important Dates Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Important Dates</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="last_bill_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Last Bill Date</FormLabel>
                          <DatePicker
                            value={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                            onChange={(date: Date | undefined) => {
                              if (date) {
                                // Format date as YYYY-MM-DD without timezone conversion
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                field.onChange(`${year}-${month}-${day}`);
                              } else {
                                field.onChange('');
                              }
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="last_due_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Last Due Date</FormLabel>
                          <DatePicker
                            value={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                            onChange={(date: Date | undefined) => {
                              if (date) {
                                // Format date as YYYY-MM-DD without timezone conversion
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                field.onChange(`${year}-${month}-${day}`);
                              } else {
                                field.onChange('');
                              }
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="joining_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Joining Date</FormLabel>
                          <DatePicker
                            value={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                            onChange={(date: Date | undefined) => {
                              if (date) {
                                // Format date as YYYY-MM-DD without timezone conversion
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                field.onChange(`${year}-${month}-${day}`);
                              } else {
                                field.onChange('');
                              }
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Expiry Date</FormLabel>
                          <DatePicker
                            value={field.value ? new Date(field.value + 'T00:00:00') : undefined}
                            onChange={(date: Date | undefined) => {
                              if (date) {
                                // Format date as YYYY-MM-DD without timezone conversion
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                field.onChange(`${year}-${month}-${day}`);
                              } else {
                                field.onChange('');
                              }
                            }}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => navigate('/credit-cards')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Card'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
