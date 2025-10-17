import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generateInvoicePDF = async (invoice, elementId = 'invoice-preview') => {
  try {
    console.log('📄 GENERATING PDF WITH INVOICE DATA:', {
      invoice_number: invoice.invoice_number,
      invoiceNumber: invoice.invoiceNumber,
      id: invoice.id,
      booking_id: invoice.booking_id,
      bookingId: invoice.bookingId,
      booking_reference: invoice.booking_reference
    });
    
    // Create a temporary div with the invoice content
    const invoiceElement = document.createElement('div');
    invoiceElement.innerHTML = generateInvoiceHTML(invoice);
    invoiceElement.style.position = 'absolute';
    invoiceElement.style.left = '-9999px';
    invoiceElement.style.top = '-9999px';
    invoiceElement.style.width = '800px';
    invoiceElement.style.backgroundColor = 'white';
    invoiceElement.style.padding = '40px';
    invoiceElement.style.fontFamily = 'Arial, sans-serif';
    
    document.body.appendChild(invoiceElement);

    // Convert to canvas with optimized settings for high quality text
    const canvas = await html2canvas(invoiceElement, {
      scale: 3, // Increased to 3 for sharper text rendering
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0,
      removeContainer: true,
      letterRendering: true, // Better text rendering
      windowWidth: 1200, // Wider for better resolution
      windowHeight: 1600
    });

    // Remove temporary element
    document.body.removeChild(invoiceElement);

    // Create PDF with compression
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true, // Enable PDF compression
      putOnlyUsedFonts: true,
      precision: 16 // Higher precision for better quality
    });
    
    // Use JPEG with higher quality for better text clarity (0.92 for sharp text)
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Download the PDF
    pdf.save(`invoice-${invoice.id}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

export const printInvoicePDF = async (invoice) => {
  try {
    // Create a temporary div with the invoice content
    const invoiceElement = document.createElement('div');
    invoiceElement.innerHTML = generateInvoiceHTML(invoice);
    invoiceElement.style.position = 'absolute';
    invoiceElement.style.left = '-9999px';
    invoiceElement.style.top = '-9999px';
    invoiceElement.style.width = '800px';
    invoiceElement.style.backgroundColor = 'white';
    invoiceElement.style.padding = '40px';
    invoiceElement.style.fontFamily = 'Arial, sans-serif';
    
    document.body.appendChild(printElement);

    // Convert to canvas with optimized settings for high quality text
    const canvas = await html2canvas(printElement, {
      scale: 3, // Increased to 3 for sharper text rendering
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0,
      removeContainer: true,
      letterRendering: true, // Better text rendering
      windowWidth: 1200, // Wider for better resolution
      windowHeight: 1600
    });

    // Remove temporary element
    document.body.removeChild(printElement);

    // Create PDF with compression for printing
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true,
      precision: 16 // Higher precision for better quality
    });
    
    // Use JPEG with higher quality for better text clarity
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Open print dialog instead of downloading
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Create a new window for printing
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = function() {
        printWindow.print();
        // Clean up the URL after printing
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl);
          printWindow.close();
        }, 1000);
      };
    }
    
    return true;
  } catch (error) {
    console.error('Error printing PDF:', error);
    return false;
  }
};

const generateInvoiceHTML = (invoice) => {
  // Helper function to safely get invoice number
  const getInvoiceNumber = () => {
    return invoice.invoice_number || invoice.invoiceNumber || invoice.id || 'N/A';
  };
  
  // Helper function to safely get booking reference
  const getBookingRef = () => {
    // Priority: booking_reference (e.g., BK773337T28) > booking_id (numeric)
    return invoice.booking_reference || invoice.bookingReference || 
           invoice.bookingRef || invoice.booking_id || invoice.bookingId || null;
  };
  
  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333; font-size: 11px;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
        <div>
          <h1 style="color: #1e293b; font-size: 24px; margin: 0;">INVOICE</h1>
        </div>
        <div style="text-align: right; max-width: 350px;">
          <h2 style="color: #3b82f6; margin: 0 0 4px 0; font-size: 18px;">Reem Resort</h2>
          <p style="margin: 0; color: #64748b; font-size: 10px; line-height: 1.3;">
            Block - A, Plot - 87, Hotel Motel Zone, Cox's Bazar, Bangladesh
          </p>
        </div>
      </div>

      <!-- Invoice Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <div>
          <h3 style="color: #1e293b; margin: 0 0 6px 0; font-size: 12px;">Bill To:</h3>
          <div style="color: #64748b; font-size: 10px;">
            <p style="margin: 2px 0; font-weight: bold; color: #1e293b;">${invoice.customerInfo?.name || 'Customer Name'}</p>
            <p style="margin: 2px 0;">${invoice.customerInfo?.email || ''}</p>
            <p style="margin: 2px 0;">${invoice.customerInfo?.phone || ''}</p>
            ${invoice.customerInfo?.nid ? `<p style="margin: 2px 0;"><strong>NID:</strong> ${invoice.customerInfo.nid}</p>` : ''}
            ${invoice.customerInfo?.address ? `<p style="margin: 2px 0;">${invoice.customerInfo.address}</p>` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <p style="margin: 2px 0; font-size: 10px;"><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate || Date.now()).toLocaleDateString()}</p>
          <p style="margin: 2px 0; font-size: 10px;"><strong>Invoice No:</strong> ${getInvoiceNumber()}</p>
          ${getBookingRef() ? `<p style="margin: 2px 0; font-size: 10px;"><strong>Booking Ref:</strong> ${getBookingRef().toString().startsWith('BK') ? getBookingRef() : '#' + getBookingRef()}</p>` : ''}
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 9px;">Room</th>
            <th style="padding: 6px 4px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 9px;">Check-in</th>
            <th style="padding: 6px 4px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 9px;">Check-out</th>
            <th style="padding: 6px 4px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 9px;">Nights</th>
            <th style="padding: 6px 4px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 9px;">Guests</th>
            <th style="padding: 6px 4px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 9px;">Per Night</th>
            <th style="padding: 6px 4px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 9px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(invoice.items || []).map(item => `
            <tr>
              <td style="padding: 5px 4px; border-bottom: 1px solid #f1f5f9;">${item.roomNumber || 'Room'}</td>
              <td style="padding: 5px 4px; text-align: center; border-bottom: 1px solid #f1f5f9;">${item.checkInDate ? new Date(item.checkInDate).toLocaleDateString() : ''}</td>
              <td style="padding: 5px 4px; text-align: center; border-bottom: 1px solid #f1f5f9;">${item.checkOutDate ? new Date(item.checkOutDate).toLocaleDateString() : ''}</td>
              <td style="padding: 5px 4px; text-align: center; border-bottom: 1px solid #f1f5f9;">${item.totalNights || 0}</td>
              <td style="padding: 5px 4px; text-align: center; border-bottom: 1px solid #f1f5f9;">${item.guestCount || 1}</td>
              <td style="padding: 5px 4px; text-align: right; border-bottom: 1px solid #f1f5f9;">৳${(item.perNightCost || 0).toFixed(0)}</td>
              <td style="padding: 5px 4px; text-align: right; border-bottom: 1px solid #f1f5f9;">৳${(item.amount || 0).toFixed(0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${invoice.additionalCharges && invoice.additionalCharges.length > 0 && invoice.additionalCharges.some(charge => charge.description && charge.amount > 0) ? `
      <!-- Additional Charges -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px;">
        <thead>
          <tr style="background-color: #fef3c7;">
            <th style="padding: 5px 4px; text-align: left; border-bottom: 1px solid #f59e0b; font-size: 9px;">Additional Charges</th>
            <th style="padding: 5px 4px; text-align: right; border-bottom: 1px solid #f59e0b; font-size: 9px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.additionalCharges.filter(charge => charge.description && charge.amount > 0).map(charge => `
            <tr>
              <td style="padding: 4px; border-bottom: 1px solid #f1f5f9;">${charge.description}</td>
              <td style="padding: 4px; text-align: right; border-bottom: 1px solid #f1f5f9;">৳${charge.amount.toFixed(0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
        <div style="width: 300px; font-size: 10px;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
            <span>Original Room Charges:</span>
            <span>৳${(invoice.originalSubtotal || 0).toFixed(0)}</span>
          </div>
          ${(invoice.totalDiscount && invoice.totalDiscount > 0) ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9; color: #dc2626;">
            <span>Total Discount Applied:</span>
            <span>-৳${invoice.totalDiscount.toFixed(0)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
            <span>Room Charges After Discount:</span>
            <span>৳${(invoice.subtotal || 0).toFixed(0)}</span>
          </div>
          ${invoice.additionalTotal && invoice.additionalTotal > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
            <span>Additional Charges:</span>
            <span>৳${(invoice.additionalTotal || 0).toFixed(0)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">
            <span>Subtotal (Before VAT):</span>
            <span>৳${((invoice.subtotal || 0) + (invoice.additionalTotal || 0)).toFixed(0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f5f9;">
            <span>VAT (${invoice.taxRate || 0}%):</span>
            <span>৳${(invoice.tax || invoice.taxAmount || 0).toFixed(0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-weight: bold; font-size: 12px; border-top: 1px solid #3b82f6; border-bottom: 1px solid #3b82f6; background-color: #eff6ff; color: #1e40af;">
            <span>Final Total Amount:</span>
            <span>৳${(invoice.total || 0).toFixed(0)}</span>
          </div>
          ${invoice.totalPaid && invoice.totalPaid > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #059669; font-weight: 600;">
            <span>Total Paid:</span>
            <span>৳${(invoice.totalPaid || 0).toFixed(0)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 6px 0; font-weight: bold; font-size: 11px; border-top: 1px solid #e2e8f0; color: ${invoice.dueAmount > 0 ? '#dc2626' : '#059669'};">
            <span>Due Amount:</span>
            <span>৳${invoice.dueAmount.toFixed(0)}</span>
          </div>
          ` : ''}
        </div>
      </div>

      ${invoice.payments && invoice.payments.length > 0 ? `
      <!-- Payment History -->
      <div style="margin-bottom: 10px;">
        <h3 style="color: #1e293b; margin: 0 0 6px 0; font-size: 11px;">Payment History:</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
          <thead>
            <tr style="background-color: #f0f9ff;">
              <th style="padding: 4px; text-align: left; border-bottom: 1px solid #bae6fd;">Date</th>
              <th style="padding: 4px; text-align: left; border-bottom: 1px solid #bae6fd;">Method</th>
              <th style="padding: 4px; text-align: left; border-bottom: 1px solid #bae6fd;">Description</th>
              <th style="padding: 4px; text-align: right; border-bottom: 1px solid #bae6fd;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.payments.map(payment => `
              <tr>
                <td style="padding: 3px 4px; border-bottom: 1px solid #f1f5f9;">${new Date(payment.date).toLocaleDateString()}</td>
                <td style="padding: 3px 4px; border-bottom: 1px solid #f1f5f9; text-transform: capitalize;">${payment.method.replace('_', ' ')}</td>
                <td style="padding: 3px 4px; border-bottom: 1px solid #f1f5f9;">${payment.description}</td>
                <td style="padding: 3px 4px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #059669; font-weight: 600;">৳${payment.amount.toFixed(0)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Notes and Terms -->
      ${invoice.notes ? `
        <div style="margin-bottom: 8px;">
          <h3 style="color: #1e293b; margin: 0 0 4px 0; font-size: 10px;">Notes:</h3>
          <p style="color: #64748b; line-height: 1.4; font-size: 9px;">${invoice.notes}</p>
        </div>
      ` : ''}

      <div style="margin-bottom: 10px;">
        <h3 style="color: #1e293b; margin: 0 0 4px 0; font-size: 10px;">Terms & Conditions</h3>
        <p style="color: #64748b; line-height: 1.3; font-size: 8px;">
          All payments are due as per the terms stated and are non-transferable. Cancellations or no-shows are subject to applicable fees as outlined in the hotel policy. Guests shall be held liable for any damage, loss, or misconduct occurring during their stay. Smoking in prohibited areas will incur a penalty charge. The hotel accepts no responsibility for loss of personal belongings. Early check-in and late check-out are subject to prior approval and additional charges.
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; color: #64748b; font-size: 9px;">
        <p style="margin: 4px 0; font-weight: 600; color: #1e293b; font-size: 10px;">Thank you for your business!</p>
        <p style="margin: 2px 0; line-height: 1.3;">
          For any questions, contact us at <strong style="color: #3b82f6;">contact@reemresort.com</strong> | <strong style="color: #3b82f6;">+880 1756-989693</strong>
        </p>
      </div>
    </div>
  `;
};

export const previewInvoice = (invoice) => {
  console.log('👁️ PREVIEWING INVOICE:', {
    invoice_number: invoice.invoice_number,
    invoiceNumber: invoice.invoiceNumber,
    id: invoice.id,
    booking_id: invoice.booking_id,
    bookingId: invoice.bookingId
  });
  
  const previewWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!previewWindow) {
    alert('Popup blocked! Please allow popups for this site to view the invoice.');
    return;
  }
  
  previewWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice Preview - ${invoice.id}</title>
      <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align: center; margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Invoice</button>
        <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
      </div>
      ${generateInvoiceHTML(invoice)}
    </body>
    </html>
  `);
  previewWindow.document.close();
};