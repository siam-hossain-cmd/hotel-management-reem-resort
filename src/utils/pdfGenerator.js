import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const generateInvoicePDF = async (invoice, elementId = 'invoice-preview') => {
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
    
    document.body.appendChild(invoiceElement);

    // Convert to canvas
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Remove temporary element
    document.body.removeChild(invoiceElement);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
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
    
    document.body.appendChild(invoiceElement);

    // Convert to canvas
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Remove temporary element
    document.body.removeChild(invoiceElement);

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
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
  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 40px; font-family: Arial, sans-serif; color: #333;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px;">
        <div>
          <h1 style="color: #1e293b; font-size: 36px; margin: 0;">INVOICE</h1>
          <p style="color: #64748b; margin: 5px 0;">${invoice.id}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="color: #3b82f6; margin: 0; font-size: 24px;">Reem Resort</h2>
          <p style="margin: 5px 0; color: #64748b;">Invoice Generator System</p>
          <p style="margin: 5px 0; color: #64748b;">contact@reemresort.com</p>
        </div>
      </div>

      <!-- Invoice Details -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div>
          <h3 style="color: #1e293b; margin-bottom: 10px;">Bill To:</h3>
          <div style="color: #64748b;">
            <p style="margin: 5px 0; font-weight: bold; color: #1e293b;">${invoice.customerInfo?.name || 'Customer Name'}</p>
            <p style="margin: 5px 0;">${invoice.customerInfo?.email || ''}</p>
            <p style="margin: 5px 0;">${invoice.customerInfo?.phone || ''}</p>
            ${invoice.customerInfo?.nid ? `<p style="margin: 5px 0;"><strong>NID:</strong> ${invoice.customerInfo.nid}</p>` : ''}
            <p style="margin: 5px 0;">${invoice.customerInfo?.address || ''}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate || Date.now()).toLocaleDateString()}</p>
            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${new Date(invoice.dueDate || Date.now()).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Room Number</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Check-in</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Check-out</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Nights</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0;">Guests</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Per Night</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${(invoice.items || []).map(item => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">${item.roomNumber || 'Room'}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f1f5f9;">${item.checkInDate ? new Date(item.checkInDate).toLocaleDateString() : ''}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f1f5f9;">${item.checkOutDate ? new Date(item.checkOutDate).toLocaleDateString() : ''}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f1f5f9;">${item.totalNights || 0}</td>
              <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f1f5f9;">${item.guestCount || 1}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9;">৳${(item.perNightCost || 0).toFixed(2)}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9;">৳${(item.amount || 0).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${invoice.additionalCharges && invoice.additionalCharges.length > 0 && invoice.additionalCharges.some(charge => charge.description && charge.amount > 0) ? `
      <!-- Additional Charges -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #fef3c7;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #f59e0b;">Additional Charges</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #f59e0b;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.additionalCharges.filter(charge => charge.description && charge.amount > 0).map(charge => `
            <tr>
              <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">${charge.description}</td>
              <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9;">৳${charge.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
        <div style="width: 350px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
            <span>Original Room Charges:</span>
            <span>৳${(invoice.originalSubtotal || 0).toFixed(2)}</span>
          </div>
          ${(invoice.totalDiscount && invoice.totalDiscount > 0) ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #dc2626;">
            <span>Total Discount Applied:</span>
            <span>-৳${invoice.totalDiscount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
            <span>Room Charges After Discount:</span>
            <span>৳${(invoice.subtotal || 0).toFixed(2)}</span>
          </div>
          ${invoice.additionalTotal && invoice.additionalTotal > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
            <span>Additional Charges:</span>
            <span>৳${(invoice.additionalTotal || 0).toFixed(2)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 2px solid #e2e8f0; font-weight: 600;">
            <span>Subtotal (Before VAT):</span>
            <span>৳${((invoice.subtotal || 0) + (invoice.additionalTotal || 0)).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
            <span>VAT (${invoice.taxRate || 0}%):</span>
            <span>৳${(invoice.tax || invoice.taxAmount || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0; font-weight: bold; font-size: 18px; border-top: 2px solid #3b82f6; border-bottom: 2px solid #3b82f6; background-color: #eff6ff; color: #1e40af;">
            <span>Final Total Amount:</span>
            <span>৳${(invoice.total || 0).toFixed(2)}</span>
          </div>
          ${invoice.totalPaid && invoice.totalPaid > 0 ? `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #059669; font-weight: 600;">
            <span>Total Paid:</span>
            <span>৳${(invoice.totalPaid || 0).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0; font-weight: bold; font-size: 16px; border-top: 2px solid #e2e8f0; color: ${invoice.dueAmount > 0 ? '#dc2626' : '#059669'};">
            <span>Due Amount:</span>
            <span>৳${invoice.dueAmount.toFixed(2)}</span>
          </div>
          ` : ''}
        </div>
      </div>

      ${invoice.payments && invoice.payments.length > 0 ? `
      <!-- Payment History -->
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-bottom: 15px;">Payment History:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f0f9ff;">
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #bae6fd;">Date</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #bae6fd;">Method</th>
              <th style="padding: 10px; text-align: left; border-bottom: 1px solid #bae6fd;">Description</th>
              <th style="padding: 10px; text-align: right; border-bottom: 1px solid #bae6fd;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.payments.map(payment => `
              <tr>
                <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9;">${new Date(payment.date).toLocaleDateString()}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; text-transform: capitalize;">${payment.method.replace('_', ' ')}</td>
                <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9;">${payment.description}</td>
                <td style="padding: 8px 10px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #059669; font-weight: 600;">৳${payment.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      <!-- Notes and Terms -->
      ${invoice.notes ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1e293b; margin-bottom: 10px;">Notes:</h3>
          <p style="color: #64748b; line-height: 1.6;">${invoice.notes}</p>
        </div>
      ` : ''}

      <div style="margin-bottom: 30px;">
        <h3 style="color: #1e293b; margin-bottom: 10px;">Terms & Conditions:</h3>
        <p style="color: #64748b; line-height: 1.6;">${invoice.terms}</p>
      </div>

      <!-- Footer -->
      <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 14px;">
        <p>Thank you for your business!</p>
        <p>For any questions regarding this invoice, please contact us at contact@reemresort.com</p>
      </div>
    </div>
  `;
};

export const previewInvoice = (invoice) => {
  const previewWindow = window.open('', '_blank', 'width=800,height=600');
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