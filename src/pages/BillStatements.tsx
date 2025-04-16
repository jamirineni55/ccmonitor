import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { FileText, Download, Trash2, Eye, Upload, Loader2, Calendar, ChevronLeft } from 'lucide-react';

// UI components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Services and types
import { getCreditCardById, getBillStatements, uploadBillStatement, deleteBillStatement, getStatementUrl } from '@/services/supabase';
import { CreditCardType, BillStatementType } from '@/types/creditCard';

export default function BillStatements() {
  const { id } = useParams<{ id: string }>();
  
  const [creditCard, setCreditCard] = useState<CreditCardType | null>(null);
  const [statements, setStatements] = useState<BillStatementType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [billDate, setBillDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [statementAmount, setStatementAmount] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Load credit card details
        const cardData = await getCreditCardById(id);
        if (cardData && Array.isArray(cardData.data) && cardData.data.length > 0) {
          const card = cardData.data[0];
          setCreditCard(card);
          
          // Calculate default dates based on credit card data
          if (card.last_bill_date && card.last_due_date) {
            // Parse dates
            const lastBillDate = new Date(card.last_bill_date);
            const lastDueDate = new Date(card.last_due_date);
            
            // Calculate the day of month for bill date
            const billDay = lastBillDate.getDate();
            
            // Calculate days between bill date and due date
            const daysUntilDue = Math.round((lastDueDate.getTime() - lastBillDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Create current month's bill date with the same day
            const today = new Date();
            const currentMonthBillDate = new Date(today.getFullYear(), today.getMonth(), billDay);
            
            // Calculate due date based on the same duration
            const currentMonthDueDate = new Date(currentMonthBillDate);
            currentMonthDueDate.setDate(currentMonthDueDate.getDate() + daysUntilDue);
            
            // Set the default dates
            setBillDate(currentMonthBillDate);
            setDueDate(currentMonthDueDate);
          }
        }
        
        // Load statements
        const statementsData = await getBillStatements(id);
        if (statementsData && Array.isArray(statementsData.data)) {
          setStatements(statementsData.data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      // Check if file is a PDF
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are supported');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!id || !selectedFile) return;
    
    // Validate required fields
    if (!billDate || !dueDate || !statementAmount) {
      toast.error('All fields are required');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Convert amount to number
      const amount = parseFloat(statementAmount);
      
      // Ensure amount is valid
      if (isNaN(amount)) {
        toast.error('Please enter a valid amount');
        return;
      }
      
      // Format dates for the API
      const formattedBillDate = format(billDate, 'yyyy-MM-dd');
      const formattedDueDate = format(dueDate, 'yyyy-MM-dd');
      
      const result = await uploadBillStatement(id, selectedFile, {
        bill_date: formattedBillDate,
        due_date: formattedDueDate,
        amount
      });
      
      if (result.error) throw result.error;
      
      // Add the new statement to our local state
      if (result.data && Array.isArray(result.data)) {
        setStatements(prev => [...result.data, ...prev]);
        
        // Close the dialog and reset form
        toast.success('Statement uploaded successfully');
        setUploadDialogOpen(false);
        resetUploadForm();
      }
    } catch (error) {
      console.error('Error uploading statement:', error);
      toast.error('Failed to upload statement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteStatement = async (statement: BillStatementType) => {
    if (!id) return;
    
    try {
      const confirmed = window.confirm(`Are you sure you want to delete ${statement.file_name}?`);
      if (!confirmed) return;
      
      const result = await deleteBillStatement(statement.id);
      
      if (result.error) throw result.error;
      
      // Remove the statement from our local state
      setStatements(prev => prev.filter(s => s.id !== statement.id));
      
      toast.success('Statement deleted successfully');
    } catch (error) {
      console.error('Error deleting statement:', error);
      toast.error('Failed to delete statement');
    }
  };

  const handleViewStatement = async (statement: BillStatementType) => {
    try {
      const url = await getStatementUrl(statement.file_path);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('Failed to get statement URL');
      }
    } catch (error) {
      console.error('Error viewing statement:', error);
      toast.error('Failed to view statement');
    }
  };

  const handleDownloadStatement = async (statement: BillStatementType) => {
    try {
      const url = await getStatementUrl(statement.file_path);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = statement.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        toast.error('Failed to get statement URL');
      }
    } catch (error) {
      console.error('Error downloading statement:', error);
      toast.error('Failed to download statement');
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setBillDate(undefined);
    setDueDate(undefined);
    setStatementAmount('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="container mx-auto py-4 space-y-4 px-4 sm:px-6 sm:py-6 sm:space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center">
          <Link to="/credit-cards" className="mr-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Bill Statements</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <p className="text-muted-foreground">
            {creditCard ? `Manage bill statements for ${creditCard.card_name}` : 'Loading...'}
          </p>
          <Button 
            onClick={() => setUploadDialogOpen(true)}
            disabled={isLoading || !creditCard}
            className="w-full sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Statement
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : statements.length > 0 ? (
        <div className="space-y-4">
          {/* Mobile view - Card layout */}
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {statements.map((statement) => (
              <Card key={statement.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base flex justify-between items-start">
                    <div className="truncate max-w-[200px]">{statement.file_name}</div>
                    <div className="text-sm font-normal text-right">
                      {statement.amount 
                        ? new Intl.NumberFormat('en-IN', { 
                            style: 'currency', 
                            currency: 'INR' 
                          }).format(statement.amount)
                        : '-'}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="text-sm text-muted-foreground mb-2">
                    <div className="flex justify-between">
                      <span>Bill Date:</span>
                      <span>
                        {statement.bill_date 
                          ? format(new Date(statement.bill_date), 'MMM d, yyyy')
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span>
                        {statement.due_date 
                          ? format(new Date(statement.due_date), 'MMM d, yyyy')
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span>{formatFileSize(statement.file_size)}</span>
                    </div>
                  </div>
                  <div className="flex justify-end items-center gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewStatement(statement)}
                      title="View Statement"
                      className="h-8 w-8"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownloadStatement(statement)}
                      title="Download Statement"
                      className="h-8 w-8"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStatement(statement)}
                      title="Delete Statement"
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Desktop view - Table layout */}
          <div className="hidden sm:block rounded-md border w-full max-w-full">
            <div className="overflow-x-auto max-w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] max-w-[200px]">File Name</TableHead>
                    <TableHead>Bill Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statements.map((statement) => (
                    <TableRow key={statement.id}>
                      <TableCell className="font-medium truncate max-w-[200px]">
                        {statement.file_name}
                      </TableCell>
                      <TableCell>
                        {statement.bill_date 
                          ? format(new Date(statement.bill_date), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {statement.due_date 
                          ? format(new Date(statement.due_date), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>{formatFileSize(statement.file_size)}</TableCell>
                      <TableCell>
                        {statement.amount 
                          ? new Intl.NumberFormat('en-IN', { 
                              style: 'currency', 
                              currency: 'INR' 
                            }).format(statement.amount)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right p-2">
                        <div className="flex justify-end items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewStatement(statement)}
                            title="View Statement"
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadStatement(statement)}
                            title="Download Statement"
                            className="h-8 w-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteStatement(statement)}
                            title="Delete Statement"
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-6 sm:p-8 text-center animate-in fade-in-50">
          <div className="flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-8 sm:h-10 w-8 sm:w-10 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No statements found</h3>
          <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-xs">
            You haven't uploaded any bill statements for this credit card yet.
          </p>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Statement
          </Button>
        </div>
      )}

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md max-w-[95vw] rounded-lg">
          <DialogHeader>
            <DialogTitle>Upload Bill Statement</DialogTitle>
            <DialogDescription>
              Upload a PDF statement for your credit card.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Statement File (PDF)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="flex-1 text-sm"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="billDate">Bill Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !billDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {billDate ? format(billDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={billDate}
                      onSelect={setBillDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Statement Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={statementAmount}
                onChange={(e) => setStatementAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                resetUploadForm();
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
