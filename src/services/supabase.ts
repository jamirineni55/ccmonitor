import { createClient } from '@supabase/supabase-js';
import { type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file and Netlify environment variables.');
  throw new Error('supabaseUrl is required');
}

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

export async function getCreditCardById(id: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }
  
  return supabase
    .from('credit_cards')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.user.id);
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

// Storage related functions
export async function uploadBillStatement(creditCardId: string, file: File, metadata: {
  bill_date: string;
  due_date: string;
  amount: number;
}) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }
  
  const fileName = `${Date.now()}_${file.name}`;
  const filePath = `${user.user.id}/${creditCardId}/${fileName}`;
  
  const { error } = await supabase.storage
    .from('bill_statements')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw error;
  }
  
  // Add record to bill_statements table
  const { data: statementData, error: statementError } = await supabase
    .from('bill_statements')
    .insert({
      credit_card_id: creditCardId,
      file_name: fileName,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      user_id: user.user.id,
      bill_date: metadata.bill_date,
      due_date: metadata.due_date,
      amount: metadata.amount
    })
    .select();
  
  if (statementError) {
    // If there was an error creating the record, delete the uploaded file
    await supabase.storage.from('bill_statements').remove([filePath]);
    throw statementError;
  }
  
  return { data: statementData, error: null };
}

export async function getBillStatements(creditCardId: string) {
  const { data: user } = await supabase.auth.getUser();
  
  if (!user.user) {
    throw new Error('User not authenticated');
  }
  
  return supabase
    .from('bill_statements')
    .select('*')
    .eq('credit_card_id', creditCardId)
    .eq('user_id', user.user.id)
    .order('created_at', { ascending: false });
}

export async function deleteBillStatement(statementId: string) {
  const { data: statement } = await supabase
    .from('bill_statements')
    .select('file_path')
    .eq('id', statementId)
    .single();
  
  if (!statement) {
    throw new Error('Statement not found');
  }
  
  // Delete file from storage
  const { error: storageError } = await supabase.storage
    .from('bill_statements')
    .remove([statement.file_path]);
  
  if (storageError) {
    throw storageError;
  }
  
  // Delete record from database
  return supabase
    .from('bill_statements')
    .delete()
    .eq('id', statementId);
}

export async function getStatementUrl(filePath: string) {
  const { data } = await supabase.storage
    .from('bill_statements')
    .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
  
  return data?.signedUrl;
}
