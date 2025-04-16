import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from './context/AuthContext'

// Pages
import Dashboard from '@/pages/Dashboard'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import CreditCards from '@/pages/CreditCards'
import AddCreditCard from '@/pages/AddCreditCard'
import EditCreditCard from '@/pages/EditCreditCard'
import BillStatements from './pages/BillStatements'
import PaymentReminders from './pages/PaymentReminders'
import Layout from '@/components/Layout'

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="credit-cards" element={<CreditCards />} />
            <Route path="credit-cards/add" element={<AddCreditCard />} />
            <Route path="credit-cards/edit/:id" element={<EditCreditCard />} />
            <Route path="credit-cards/:id/statements" element={<BillStatements />} />
            <Route path="payment-reminders" element={<PaymentReminders />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
