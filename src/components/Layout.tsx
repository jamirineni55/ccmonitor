import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  CalendarClock, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize to detect mobile view
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { path: '/credit-cards', label: 'Credit Cards', icon: <CreditCard className="mr-2 h-4 w-4" /> },
    { path: '/payment-reminders', label: 'Payment Reminders', icon: <CalendarClock className="mr-2 h-4 w-4" /> },
  ];

  const renderSidebar = () => (
    <motion.aside 
      initial={{ x: isMobile ? -280 : 0 }}
      animate={{ x: 0 }}
      exit={{ x: -280 }}
      transition={{ duration: 0.3 }}
      className={`fixed inset-y-0 left-0 z-50 w-[280px] border-r bg-card shadow-sm ${
        isMobile ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b px-6">
        <h1 className="text-xl font-bold">CC Monitor</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
              location.pathname === item.path ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="rounded-md border p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary h-8 w-8 flex items-center justify-center text-primary-foreground">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col overflow-hidden">
              <p className="truncate text-sm font-medium">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 w-full justify-start text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
    </motion.aside>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile menu button */}
      {isMobile && (
        <div className="fixed top-0 left-0 z-40 flex h-16 w-full items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">CC Monitor</h1>
          </div>
          <ThemeToggle />
        </div>
      )}

      {/* Sidebar - shown always on desktop, conditionally on mobile */}
      <AnimatePresence>
        {(!isMobile || isMobileMenuOpen) && renderSidebar()}
      </AnimatePresence>

      {/* Overlay for mobile menu */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <main className={`flex-1 ${isMobile ? 'pt-16' : 'pl-[280px]'}`}>
        <div className="container py-6 px-4 md:py-8 md:px-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
