export type PaymentReminderType = {
  id: string;
  credit_card_id: string;
  due_date: string;
  amount: number;
  is_paid: boolean;
  notes?: string;
  user_id: string;
  created_at: string;
};
