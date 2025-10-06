import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { differenceInDays } from 'date-fns';
import { BusinessInfo, Client, ClientWithInvoiceData, Invoice, InvoiceWithClientData } from './types';
import { generateNewInvoice } from './utils/invoiceGenerator';
import { downloadInvoicePDF } from './services/pdfService';
import * as firestoreService from './services/firestoreService';

import { auth } from '../firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';

import AuthPage from './components/AuthPage';
import OnboardingModal from './components/OnboardingModal';
import Dashboard from './components/Dashboard';
import ClientFormModal from './components/ClientFormModal';
import ClientDetailModal from './components/ClientDetailModal';
import InvoiceFormModal from './components/InvoiceFormModal';
import ReminderModal from './components/ReminderModal';

const App: React.FC = () => {
    // Firebase auth state
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    // App state, now synced with Firestore
    const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Modal and selection state
    const [isClientFormOpen, setIsClientFormOpen] = useState(false);
    const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
    const [isReminderOpen, setIsReminderOpen] = useState(false);

    const [selectedClient, setSelectedClient] = useState<ClientWithInvoiceData | null>(null);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const [selectedInvoiceForReminder, setSelectedInvoiceForReminder] = useState<InvoiceWithClientData | null>(null);
    const [editingInvoice, setEditingInvoice] = useState<Omit<Invoice, 'id' | 'clientId'> | (Invoice & { clientId: string }) | null>(null);

    // Listen for authentication state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
            if (!currentUser) {
                // Clear data on logout
                setBusinessInfo(null);
                setClients([]);
                setInvoices([]);
                setLoadingData(true);
            }
        });
        return () => unsubscribe();
    }, []);
    
    // Subscribe to Firestore data when user is logged in
    useEffect(() => {
        if (user) {
            setLoadingData(true);
            const unsubscribe = firestoreService.subscribeToUserData(
                user.uid,
                (info) => {
                    setBusinessInfo(info);
                    setLoadingData(false);
                },
                setClients,
                setInvoices
            );
            return () => unsubscribe(); // Unsubscribe on cleanup
        }
    }, [user]);


    // --- Data Processing & Calculations ---
    const calculateInvoiceWithInterest = useCallback((invoice: Invoice, client: Client, businessAnnualRate: number): Invoice => {
        const annualRate = client.interestRate ?? businessAnnualRate;
        if (!annualRate || annualRate <= 0 || invoice.paid) {
            return { ...invoice, interestCharged: 0 };
        }

        const dueDate = new Date(invoice.dueDate);
        const today = new Date();
        if (today <= dueDate) {
            return { ...invoice, interestCharged: 0 };
        }

        const dailyRate = (annualRate / 100) / 365;
        const daysOverdue = differenceInDays(today, dueDate);
        const interest = invoice.amount * dailyRate * daysOverdue;

        return { ...invoice, interestCharged: parseFloat(interest.toFixed(2)) };
    }, []);

    const invoicesWithInterest = useMemo(() => {
        if (!businessInfo) return [];
        const clientMap = new Map(clients.map(c => [c.id, c]));
        return invoices.map(inv => {
            const client = clientMap.get(inv.clientId);
            if (!client) return { ...inv, interestCharged: 0 }; // Should not happen
            return calculateInvoiceWithInterest(inv, client, businessInfo.defaultInterestRate);
        });
    }, [invoices, clients, businessInfo, calculateInvoiceWithInterest]);

    const clientsWithInvoiceData = useMemo((): ClientWithInvoiceData[] => {
        const clientMap = new Map<string, Client>(clients.map(c => [c.id, c]));
        const clientInvoiceMap = new Map<string, Invoice[]>();

        invoicesWithInterest.forEach(invoice => {
            if (!clientInvoiceMap.has(invoice.clientId)) {
                clientInvoiceMap.set(invoice.clientId, []);
            }
            clientInvoiceMap.get(invoice.clientId)!.push(invoice);
        });

        const results: ClientWithInvoiceData[] = [];
        
        clientMap.forEach((client, clientId) => {
            const clientInvoices = clientInvoiceMap.get(clientId) || [];
            
            let totalDue = 0;
            let overduePrincipal = 0;
            let totalInterestDue = 0;
            let overdueInvoiceCount = 0;
            let totalBilled = 0;
            
            let paymentDaysSum = 0;
            let latePaidInvoicesCount = 0;

            let overdue_1_30 = 0;
            let overdue_31_60 = 0;
            let overdue_60_plus = 0;

            const today = new Date();

            clientInvoices.forEach(invoice => {
                totalBilled += invoice.amount;
                
                if (invoice.paid) {
                    if (invoice.paymentDate) {
                        const dueDate = new Date(invoice.dueDate);
                        const paymentDate = new Date(invoice.paymentDate);
                        if (paymentDate > dueDate) {
                            paymentDaysSum += differenceInDays(paymentDate, dueDate);
                            latePaidInvoicesCount++;
                        }
                    }
                } else { // Unpaid invoices
                    const totalDueForInvoice = invoice.amount + (invoice.interestCharged || 0);
                    totalDue += totalDueForInvoice;
                    
                    const dueDate = new Date(invoice.dueDate);
                    if (today > dueDate) {
                        overduePrincipal += invoice.amount;
                        totalInterestDue += invoice.interestCharged || 0;
                        overdueInvoiceCount += 1;
                        
                        const daysOverdue = differenceInDays(today, dueDate);
                        const overdueAmount = invoice.amount + (invoice.interestCharged || 0);
                        if (daysOverdue <= 30) {
                            overdue_1_30 += overdueAmount;
                        } else if (daysOverdue <= 60) {
                            overdue_31_60 += overdueAmount;
                        } else {
                            overdue_60_plus += overdueAmount;
                        }
                    }
                }
            });

            results.push({
                ...client,
                totalDue,
                overduePrincipal,
                totalInterestDue,
                overdueInvoiceCount,
                totalBilled,
                averagePaymentDays: latePaidInvoicesCount > 0 ? Math.round(paymentDaysSum / latePaidInvoicesCount) : 0,
                overdue_1_30,
                overdue_31_60,
                overdue_60_plus,
            });
        });

        return results.sort((a,b) => a.name.localeCompare(b.name));
    }, [clients, invoicesWithInterest]);

    const validClientsWithData = useMemo(() => 
        clientsWithInvoiceData.filter((c): c is ClientWithInvoiceData => !!c), 
        [clientsWithInvoiceData]
    );

    // Sync selected client data
    useEffect(() => {
        if (selectedClient) {
            const freshData = validClientsWithData.find(c => c.id === selectedClient.id);
            if (freshData) {
                if (JSON.stringify(freshData) !== JSON.stringify(selectedClient)) {
                    setSelectedClient(freshData);
                }
            } else {
                setSelectedClient(null);
            }
        }
    }, [validClientsWithData, selectedClient]);

    const allInvoicesWithClientData = useMemo((): InvoiceWithClientData[] => {
        const clientMap = new Map(clients.map(c => [c.id, c]));
        return invoicesWithInterest.map(inv => ({
            ...inv,
            client: clientMap.get(inv.clientId)!
        })).filter(inv => inv.client);
    }, [invoicesWithInterest, clients]);
    
    const businessTotalRevenue = useMemo(() => {
        return validClientsWithData.reduce((acc, client) => acc + client.totalBilled, 0);
    }, [validClientsWithData]);
    
    // --- Event Handlers (now async to interact with Firestore) ---
    const handleCompleteOnboarding = async (name: string, rate: number) => {
        if (!user) return;
        const newBusinessInfo: BusinessInfo = { name, defaultInterestRate: rate };
        await firestoreService.saveBusinessInfo(user.uid, newBusinessInfo);
    };

    const handleAddClient = () => {
        setEditingClient(null);
        setIsClientFormOpen(true);
    };
    
    const handleEditClient = (client: Client) => {
        setEditingClient(client);
        setIsClientFormOpen(true);
    };

    const handleSaveClient = async (clientData: Omit<Client, 'id'> | Client) => {
        if (!user) return;
        await firestoreService.saveClient(user.uid, clientData);
        setIsClientFormOpen(false);
        setEditingClient(null);
    };

    const handleAddInvoice = () => {
        if (!selectedClient) return;
        setEditingInvoice(generateNewInvoice(selectedClient));
        setIsInvoiceFormOpen(true);
    };
    
    const handleEditInvoice = (invoice: Invoice) => {
        setEditingInvoice(invoice);
        setIsInvoiceFormOpen(true);
    };

    const handleSaveInvoice = async (invoiceData: Omit<Invoice, 'id'> | Invoice) => {
        if (!user) return;
        await firestoreService.saveInvoice(user.uid, invoiceData);
        setIsInvoiceFormOpen(false);
        setEditingInvoice(null);
    };

    const handleSendReminder = (invoice: InvoiceWithClientData) => {
        setSelectedInvoiceForReminder(invoice);
        setIsReminderOpen(true);
    };
    
    const handleDownloadPDF = (invoice: InvoiceWithClientData) => {
        if(businessInfo?.name) {
            downloadInvoicePDF(invoice, businessInfo.name);
        }
    };

    // --- Render Logic ---
    if (loadingAuth) {
        return <div className="min-h-screen flex items-center justify-center">Authenticating...</div>;
    }
    
    if (!user) {
        return <AuthPage />;
    }
    
    if (loadingData) {
        return <div className="min-h-screen flex items-center justify-center">Loading your data...</div>;
    }

    if (!businessInfo) {
        // Automatically open onboarding for new, logged-in users without business info
        return <OnboardingModal 
            onClose={() => auth.signOut()} // Signing out if they close onboarding
            onComplete={handleCompleteOnboarding} 
        />
    }

    return (
        <>
            <Dashboard 
                businessName={businessInfo.name}
                onAddClient={handleAddClient}
                onSelectClient={setSelectedClient}
                clientsWithData={validClientsWithData}
                invoices={invoices}
                allInvoicesWithClientData={allInvoicesWithClientData}
            />
            
            {isClientFormOpen && <ClientFormModal 
                client={editingClient}
                onSave={handleSaveClient}
                onClose={() => setIsClientFormOpen(false)}
            />}

            {selectedClient && <ClientDetailModal 
                client={selectedClient}
                invoices={invoicesWithInterest}
                onClose={() => setSelectedClient(null)}
                onAddInvoice={handleAddInvoice}
                onEditInvoice={handleEditInvoice}
                onSendReminder={handleSendReminder}
                onEditClient={handleEditClient}
                onDownloadPDF={handleDownloadPDF}
                businessTotalRevenue={businessTotalRevenue}
            />}
            
            {isInvoiceFormOpen && selectedClient && <InvoiceFormModal 
                invoice={editingInvoice}
                clientId={selectedClient.id}
                onSave={handleSaveInvoice}
                onClose={() => setIsInvoiceFormOpen(false)}
            />}

            {isReminderOpen && selectedInvoiceForReminder && <ReminderModal
                invoice={selectedInvoiceForReminder}
                businessName={businessInfo.name}
                onClose={() => setIsReminderOpen(false)}
            />}
        </>
    );
};

export default App;