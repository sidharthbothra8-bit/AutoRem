import { Client, Invoice, ClientCategory } from './types';
// FIX: Replaced `subDays` and `subMonths` with `addDays` and `addMonths` with negative values to work around an import issue.
import { addDays, addMonths } from 'date-fns';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const now = new Date();

const clients: Client[] = [
    { id: 'client-1', name: 'Rajesh Exports', company: 'Global Gems', phone: '9876543210', email: 'rajesh@globalgems.com', gstin: '29AABCU9567R1Z5', category: ClientCategory.HighVolume },
    { id: 'client-2', name: 'Priya Weaves', company: 'The Silk Route', phone: '9876543211', email: 'priya@silkroute.in', gstin: '27AABCU9567R1Z6', category: ClientCategory.Wholesale },
    { id: 'client-3', name: 'Modern Fabrics Inc.', company: 'Fashion Forward', phone: '9876543212', email: 'contact@fashionforward.com', gstin: '24AABCU9567R1Z7', category: ClientCategory.Retail },
    { id: 'client-4', name: 'Surat Textiles Hub', company: 'Surat Textiles Hub', phone: '9876543213', email: 'sales@surathub.com', gstin: '21AABCU9567R1Z8', category: ClientCategory.Wholesale },
    { id: 'client-5', name: 'Anika Designs', company: 'Boutique Creations', phone: '9876543214', email: 'anika@boutique.com', gstin: '20AABCU9567R1Z9', category: ClientCategory.Retail },
];

const invoices: Omit<Invoice, 'id'>[] = [
    // Client 1: Rajesh Exports (Mostly paid, one overdue)
    { clientId: 'client-1', invoiceNumber: 'INV-2024-001', amount: 125000, invoiceDate: addMonths(now, -5).toISOString(), dueDate: addMonths(now, -4).toISOString(), paid: true, paymentDate: addMonths(now, -4).toISOString(), productDetails: '500m Silk Fabric' },
    { clientId: 'client-1', invoiceNumber: 'INV-2024-015', amount: 150000, invoiceDate: addMonths(now, -2).toISOString(), dueDate: addMonths(now, -1).toISOString(), paid: true, paymentDate: addDays(addMonths(now, -1), 5).toISOString(), productDetails: '1000m Cotton Poplin' },
    { clientId: 'client-1', invoiceNumber: 'INV-2024-028', amount: 95000, invoiceDate: addMonths(now, -1).toISOString(), dueDate: addDays(now, -10).toISOString(), paid: false, productDetails: '250m Velvet' },

    // Client 2: Priya Weaves (Paid on time, one upcoming)
    { clientId: 'client-2', invoiceNumber: 'INV-2024-005', amount: 75000, invoiceDate: addMonths(now, -4).toISOString(), dueDate: addMonths(now, -3).toISOString(), paid: true, paymentDate: addMonths(now, -3).toISOString(), productDetails: 'Banarasi Silk Saree Stock' },
    { clientId: 'client-2', invoiceNumber: 'INV-2024-021', amount: 82000, invoiceDate: addMonths(now, -1).toISOString(), dueDate: addDays(now, 20).toISOString(), paid: false, productDetails: 'Kanjeevaram Silk Batch' },

    // Client 3: Modern Fabrics Inc. (Slow payer)
    { clientId: 'client-3', invoiceNumber: 'INV-2024-008', amount: 45000, invoiceDate: addMonths(now, -3).toISOString(), dueDate: addMonths(now, -2).toISOString(), paid: true, paymentDate: addDays(addMonths(now, -2), 25).toISOString(), productDetails: 'Printed Georgette Fabric' },
    { clientId: 'client-3', invoiceNumber: 'INV-2024-031', amount: 52000, invoiceDate: addDays(now, -40).toISOString(), dueDate: addDays(now, -10).toISOString(), paid: false, productDetails: 'Rayon Fabric Lot' },

    // Client 4: Surat Textiles Hub (Good payer, one due soon)
    { clientId: 'client-4', invoiceNumber: 'INV-2024-011', amount: 210000, invoiceDate: addMonths(now, -3).toISOString(), dueDate: addMonths(now, -2).toISOString(), paid: true, paymentDate: addMonths(now, -2).toISOString(), productDetails: 'Bulk Polyester Fabric' },
    { clientId: 'client-4', invoiceNumber: 'INV-2024-040', amount: 180000, invoiceDate: addDays(now, -25).toISOString(), dueDate: addDays(now, 5).toISOString(), paid: false, productDetails: 'Large Cotton Roll Order' },

    // Client 5: Anika Designs (Smaller, regular orders)
    { clientId: 'client-5', invoiceNumber: 'INV-2024-018', amount: 22000, invoiceDate: addMonths(now, -2).toISOString(), dueDate: addMonths(now, -1).toISOString(), paid: true, paymentDate: addMonths(now, -1).toISOString(), productDetails: 'Assorted Lace Trims' },
    { clientId: 'client-5', invoiceNumber: 'INV-2024-025', amount: 25000, invoiceDate: addMonths(now, -1).toISOString(), dueDate: addDays(now, -5).toISOString(), paid: false, productDetails: 'Designer Buttons & Sequins' },
    { clientId: 'client-5', invoiceNumber: 'INV-2024-042', amount: 30000, invoiceDate: addDays(now, -15).toISOString(), dueDate: addDays(now, 15).toISOString(), paid: false, productDetails: 'Embroidered Patches' },
];

export const getDemoClients = (): Client[] => clients;
export const getDemoInvoices = (): Omit<Invoice, 'id'>[] => invoices;
