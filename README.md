# CC Monitor

A modern credit card management application built with React, Vite, and Supabase.

## Features

- **User Authentication**: Secure sign up, login, and sign out functionality
- **Credit Card Management**: Add, view, edit, and delete credit cards
- **Payment Reminders**: Set up and manage payment reminders for your credit cards
- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Smooth Animations**: Using Framer Motion for a polished user experience

## Tech Stack

- **Frontend**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database and Authentication**: Supabase
- **State Management**: React Query
- **Form Handling**: React Hook Form with Zod validation
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jamirineni55/ccmonitor.git
   cd ccmonitor
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Database Setup

The application requires the following tables in your Supabase database:

1. **credit_cards**: Stores credit card information
2. **payment_reminders**: Stores payment reminder information

Make sure to set up Row Level Security (RLS) policies to ensure users can only access their own data.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
