import { createClient } from '@supabase/supabase-js';
import { type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

// Credit Card related functions
export async function addCreditCard(cardData: any) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }
  
  return supabase
    .from('credit_cards')
    .insert({
      ...cardData,
      user_id: user.user.id
    })
    .select();
}

export async function getCreditCards() {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }
  
  return supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false });
}

export async function updateCreditCard(id: string, cardData: any) {
  return supabase
    .from('credit_cards')
    .update(cardData)
    .eq('id', id)
    .select();
}

export async function deleteCreditCard(id: string) {
  return supabase
    .from('credit_cards')
    .delete()
    .eq('id', id);
}

// Payment reminders related functions
export async function addPaymentReminder(reminderData: any) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }
  
  return supabase
    .from('payment_reminders')
    .insert({
      ...reminderData,
      user_id: user.user.id
    })
    .select();
}

export async function getPaymentReminders() {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }
  
  return supabase
    .from('payment_reminders')
    .select('*')
    .eq('user_id', user.user.id)
    .order('due_date', { ascending: true });
}

export async function updatePaymentReminder(id: string, reminderData: any) {
  return supabase
    .from('payment_reminders')
    .update(reminderData)
    .eq('id', id)
    .select();
}

export async function deletePaymentReminder(id: string) {
  return supabase
    .from('payment_reminders')
    .delete()
    .eq('id', id);
}
