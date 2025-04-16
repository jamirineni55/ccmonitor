export type CreditCardType = {
  id: string;
  card_name: string;
  last_four_digits: string;
  card_network: string;
  bank_name: string;
  last_bill_date: string;
  last_due_date: string;
  bill_cycle_days: number;
  credit_limit: number;
  current_balance: number;
  available_credit: number;
  joining_date: string;
  joining_fees: number;
  annual_fees: number;
  color: string;
  card_image?: string;
  expiry_date?: string;
  user_id: string;
  created_at: string;
};

export type BillStatementType = {
  id: string;
  credit_card_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  user_id: string;
  created_at: string;
  bill_date: string;
  due_date: string;
  amount: number;
};
