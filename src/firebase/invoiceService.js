import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './config';

export const invoiceService = {
  // Collection reference
  getInvoicesCollection: () => collection(db, 'invoices'),

  // Create new invoice
  createInvoice: async (invoiceData) => {
    try {
      // Additional validation to ensure no undefined values
      const validateData = (obj, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
          if (value === undefined) {
            console.warn(`Found undefined value at ${path}.${key}`);
            return false;
          }
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            if (!validateData(value, `${path}.${key}`)) {
              return false;
            }
          }
        }
        return true;
      };
      
      if (!validateData(invoiceData)) {
        throw new Error('Invoice data contains undefined values');
      }
      
      const invoiceWithTimestamp = {
        ...invoiceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'created'
      };
      
      console.log('Saving invoice with data:', JSON.stringify(invoiceWithTimestamp, null, 2));
      
      const docRef = await addDoc(invoiceService.getInvoicesCollection(), invoiceWithTimestamp);
      console.log('Invoice created with ID:', docRef.id);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all invoices
  getAllInvoices: async () => {
    try {
      const q = query(
        invoiceService.getInvoicesCollection(), 
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, invoices };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return { success: false, error: error.message, invoices: [] };
    }
  },

  // Get invoices by admin
  getInvoicesByAdmin: async (adminName) => {
    try {
      const q = query(
        invoiceService.getInvoicesCollection(),
        where('adminName', '==', adminName),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const invoices = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, invoices };
    } catch (error) {
      console.error('Error fetching invoices by admin:', error);
      return { success: false, error: error.message, invoices: [] };
    }
  },

  // Update invoice
  updateInvoice: async (id, updateData) => {
    try {
      const invoiceRef = doc(db, 'invoices', id);
      const dataWithTimestamp = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      await updateDoc(invoiceRef, dataWithTimestamp);
      console.log('Invoice updated:', id);
      return { success: true };
    } catch (error) {
      console.error('Error updating invoice:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete invoice
  deleteInvoice: async (id) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
      console.log('Invoice deleted:', id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark invoice as sent
  markAsSent: async (id) => {
    return await invoiceService.updateInvoice(id, { 
      status: 'sent',
      sentAt: serverTimestamp()
    });
  },

  // Mark invoice as paid
  markAsPaid: async (id) => {
    return await invoiceService.updateInvoice(id, { 
      status: 'paid',
      paidAt: serverTimestamp()
    });
  }
};

export default invoiceService;