export enum ClientCategory {
  HighVolume = 'High Volume',
  Wholesale = 'Wholesale',
  Retail = 'Retail',
}

export interface Client {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  gstin: string;
  category: ClientCategory;
  interestRate?: number; // Annual interest rate percentage, overrides business default
}

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  amount: number; // in INR
  invoiceDate: string; // ISO string
  dueDate: string; // ISO string
  paid: boolean;
  paymentDate?: string; // ISO string
  interestCharged?: number; // Calculated on the fly
  productDetails: string;
}

// Used for displaying client-level aggregated data
export interface ClientWithInvoiceData extends Client {
    totalDue: number;
    overduePrincipal: number;
    totalInterestDue: number;
    overdueInvoiceCount: number;
    // New analytics fields
    averagePaymentDays: number;
    overdue_1_30: number;
    overdue_31_60: number;
    overdue_60_plus: number;
    totalBilled: number;
}

// Used when an invoice needs its client's data
export interface InvoiceWithClientData extends Invoice {
    client: Client;
}

export interface BusinessInfo {
    name: string;
    defaultInterestRate: number; // Annual interest rate
}