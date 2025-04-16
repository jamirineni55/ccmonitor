import { z } from 'zod';

export const creditCardFormSchema = z.object({
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
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Expiry date must be in YYYY-MM-DD format',
  }).optional().or(z.literal('')),
  joining_fees: z.coerce
    .number()
    .min(0, { message: 'Joining fees must be a positive number' }),
  annual_fees: z.coerce
    .number()
    .min(0, { message: 'Annual fees must be a positive number' }),
  color: z.string().min(1, { message: 'Card color is required' }),
});

export type CreditCardFormValues = z.infer<typeof creditCardFormSchema>;

export const reminderFormSchema = z.object({
  credit_card_id: z.string().min(1, { message: 'Please select a credit card' }),
  due_date: z.date(),
  amount: z.coerce.number().min(0.01, { message: 'Amount must be greater than 0' }),
  notes: z.string().optional(),
  is_paid: z.boolean().default(false),
});

export type ReminderFormValues = z.infer<typeof reminderFormSchema>;
