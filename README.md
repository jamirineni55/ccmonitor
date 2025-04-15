# CC Monitor - Credit Card Management Application

A modern credit card management application built with React, Vite, Supabase, and shadcn/ui components. This application allows users to manage their credit cards, track balances, and set up payment reminders.

## Features

- User authentication with Supabase
- Add and manage credit cards
- Track credit card balances and limits
- Set up payment reminders
- Modern UI with smooth animations
- Responsive design for all devices

## Tech Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication & Database**: Supabase
- **State Management**: React Query
- **Form Handling**: React Hook Form with Zod validation
- **Animations**: Framer Motion
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ccmonitor.git
   cd ccmonitor
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up Supabase:
   - Create a new Supabase project
   - Set up the following tables:
     - `credit_cards`: For storing credit card information
     - `payment_reminders`: For storing payment reminders
   - Set up Row Level Security (RLS) policies to secure your data

### Database Schema

#### Credit Cards Table
```sql
CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  number TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  cvv TEXT NOT NULL,
  card_type TEXT NOT NULL,
  color TEXT NOT NULL,
  limit NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own credit cards
CREATE POLICY "Users can only view their own credit cards"
  ON credit_cards
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own credit cards"
  ON credit_cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own credit cards"
  ON credit_cards
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own credit cards"
  ON credit_cards
  FOR DELETE
  USING (auth.uid() = user_id);
```

#### Payment Reminders Table
```sql
CREATE TABLE payment_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own payment reminders
CREATE POLICY "Users can only view their own payment reminders"
  ON payment_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own payment reminders"
  ON payment_reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own payment reminders"
  ON payment_reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own payment reminders"
  ON payment_reminders
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Running the Application

Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

Build the application for production:
```bash
pnpm build
```

Preview the production build:
```bash
pnpm preview
```

## License

MIT
