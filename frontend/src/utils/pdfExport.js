import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { formatQuantity, formatQuantityAllUnits } from './unitConverter';

/**
 * Remove all superscript characters from text
 * @param {string} text - Text to clean
 * @returns {string} - Clean text without superscripts
 */
const removeSuperscripts = (text) => {
  if (!text || typeof text !== 'string') return text;
  // Remove all superscript characters: ¹, ², ³, and all superscript/subscript digits
  return text.replace(/[\u00B9\u00B2\u00B3\u2070-\u2079\u2080-\u2089\u00B0-\u00BF]/g, '').trim();
};

/**
 * Format number for PDF export - removes special characters like superscripts
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Clean formatted number string
 */
const formatNumberForPDF = (num, decimals = 2) => {
  if (!num && num !== 0) return '0';
  
  // Format number with fixed decimals
  const fixed = num.toFixed(decimals);
  
  // Split into integer and decimal parts
  const parts = fixed.split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  // Add Indian number system commas (lakhs and crores)
  // Format: 12,34,567.89
  let formatted = '';
  const len = integerPart.length;
  
  if (len > 3) {
    // Add comma after last 3 digits
    formatted = integerPart.slice(-3);
    integerPart = integerPart.slice(0, -3);
    
    // Add commas for remaining digits (every 2 digits for Indian system)
    while (integerPart.length > 2) {
      formatted = integerPart.slice(-2) + ',' + formatted;
      integerPart = integerPart.slice(0, -2);
    }
    
    if (integerPart.length > 0) {
      formatted = integerPart + ',' + formatted;
    }
  } else {
    formatted = integerPart;
  }
  
  // Add decimal part if needed
  if (decimalPart && decimals > 0) {
    formatted = formatted + '.' + decimalPart;
  }
  
  // Remove any superscripts that might have been introduced
  return removeSuperscripts(formatted);
};

/**
 * Export data to PDF
 * @param {string} title - Report title
 * @param {Array} headers - Table headers
 * @param {Array} rows - Table rows data
 * @param {Object} summary - Optional summary data
 * @param {string} filename - PDF filename
 */
export const exportToPDF = (title, headers, rows, summary = null, filename = 'report') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(title, 14, 20);
  
  // Add date
  doc.setFontSize(10);
  const date = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated on: ${date}`, 14, 30);
  
  let yPosition = 40;

  // Add summary if provided
  if (summary) {
    doc.setFontSize(12);
    doc.text('Summary', 14, yPosition);
    yPosition += 7;
    doc.setFontSize(10);
    
    Object.keys(summary).forEach((key) => {
      doc.text(`${key}: ${summary[key]}`, 14, yPosition);
      yPosition += 6;
    });
    yPosition += 5;
  }

  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: yPosition,
    styles: { fontSize: 9 },
    headStyles: {
      fillColor: [34, 139, 34], // Green color
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: yPosition },
  });

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Helper function to add MAHAFPC header to PDF
 */
const addMAHAFPCHeader = async (doc, user, reportTitle) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerY = 15;
  
  // Load logo image
  let logoDataUrl = null;
  try {
    logoDataUrl = await new Promise((resolve) => {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = function() {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = this.width;
          canvas.height = this.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(this, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          console.log('Could not convert logo to data URL');
          resolve(null);
        }
      };
      logoImg.onerror = function() {
        console.log('Logo image not found, continuing without logo');
        resolve(null);
      };
      logoImg.src = '/logocheck.png';
      setTimeout(() => resolve(null), 2000);
    });
  } catch (e) {
    console.log('Error loading logo:', e);
    logoDataUrl = null;
  }
  
  // Add logo if available
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 14, headerY, 20, 20);
    } catch (e) {
      console.log('Could not add logo image');
    }
  }
  
  // Add MAHAFPC name and information
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('MAHAFPC', logoDataUrl ? 40 : 14, headerY + 8);
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Maharashtra Farmer Producer Company', logoDataUrl ? 40 : 14, headerY + 14);
  doc.text('State Level Farmer Producer Company', logoDataUrl ? 40 : 14, headerY + 20);
  doc.text('Registered under Company Act 1956', logoDataUrl ? 40 : 14, headerY + 26);
  
  // Add date and report info on the right side
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const date = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const cleanDate = date.replace(/[\u00B9\u00B2\u00B3\u2070-\u2079\u2080-\u2089]/g, '');
  doc.text(`Generated on: ${cleanDate}`, pageWidth - 14, headerY + 14, { align: 'right' });
  const cleanUserName = user.name.replace(/[\u00B9\u00B2\u00B3\u2070-\u2079\u2080-\u2089]/g, '');
  doc.text(`FPO: ${cleanUserName}`, pageWidth - 14, headerY + 22, { align: 'right' });
  
  // Add horizontal line to separate header from content
  doc.setLineWidth(0.5);
  doc.line(14, headerY + 30, pageWidth - 14, headerY + 30);
  
  // Add report title below the horizontal line (centered)
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(reportTitle, pageWidth / 2, headerY + 38, { align: 'center' });
  
  return headerY + 48;
};

/**
 * Export procurement data to PDF
 */
export const exportProcurementToPDF = async (procurements, user, filters = {}) => {
  const headers = ['Date', 'Farmer', 'Product', 'Quantity (ton)', 'Rate (₹)', 'Amount (₹)'];
  const rows = procurements.map((p) => [
    p.date,
    p.farmerName,
    p.productName,
    formatQuantity(p.quantity), // Keeps 2 decimals: "5.00 ton"
    formatNumberForPDF(p.rate, 0), // No decimals: "45,700"
    formatNumberForPDF(p.amount, 0), // No decimals: "228,500"
  ]);

  const totalQuantity = procurements.reduce((sum, p) => sum + p.quantity, 0);
  const totalAmount = procurements.reduce((sum, p) => sum + p.amount, 0);

  const summary = {
    'Total Procurements': procurements.length,
    'Total Quantity': formatQuantityAllUnits(totalQuantity),
    'Total Amount': formatNumberForPDF(totalAmount, 0), // No decimals
    'FPO': user.name,
  };

  if (filters.dateFrom || filters.dateTo) {
    summary['Date Range'] = `${filters.dateFrom || 'Start'} to ${filters.dateTo || 'End'}`;
  }

  const doc = new jsPDF();
  
  // Add header just like inventory report
  const yPosition = await addMAHAFPCHeader(doc, user, 'Procurement Report');
  
  // Add summary table (formatted like main table)
  let currentY = yPosition;
  if (summary) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 14, currentY);
    currentY += 6;

    // Create summary table with proper boxes
    const summaryHeaders = ['Metric', 'Value'];
    const summaryRows = Object.keys(summary).map((key) => [
      key,
      summary[key]
    ]);

    autoTable(doc, {
      head: [summaryHeaders],
      body: summaryRows,
      startY: currentY,
      didParseCell: function (data) {
        // Center all cells and ensure no superscripts
        data.cell.styles.halign = 'center';
        
        // Remove any superscript characters from text
        if (data.cell.text) {
          data.cell.text = data.cell.text.map(text => {
            if (typeof text === 'string') {
              // Remove all superscript characters using comprehensive function
              return removeSuperscripts(text);
            }
            return text;
          });
        }
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: false, // No color - white/blank
        textColor: [0, 0, 0], // Black text
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 9,
        cellPadding: 3
      },
      bodyStyles: {
        fillColor: false, // No color - white/blank
        textColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle',
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { 
          cellWidth: 45, // Metric column - compact
          halign: 'center',
          fontStyle: 'bold',
          fontSize: 8,
          overflow: 'linebreak'
        },
        1: { 
          cellWidth: 55, // Value column - enough for values
          halign: 'center',
          fontSize: 8,
          overflow: 'linebreak'
        }
      },
      margin: { top: currentY, left: 14, right: 14 },
      theme: 'grid', // Grid theme for full borders
      showHead: 'firstPage',
      tableWidth: 'wrap',
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: currentY,
    styles: { fontSize: 9 },
    headStyles: {
      fillColor: [34, 139, 34], // Green color
      textColor: 255,
      fontStyle: 'bold',
    },
    bodyStyles: {
      halign: 'left', // Left-align all data rows
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: currentY },
  });

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  doc.save(`procurement_report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export inventory data to PDF with all columns
 */
export const exportInventoryToPDF = async (inventory, user, inventoryWithRates = null, totalValue = 0) => {
  // Use inventoryWithRates if provided, otherwise calculate from inventory
  const dataToExport = inventoryWithRates || inventory.map(item => ({
    ...item,
    avgRate: 0,
    quantityInTons: item.quantity || 0,
    totalValue: 0
  }));

  // All columns as shown on the page
  const headers = [
    'Product',
    'Quantity (ton)',
    'Rate per Ton (₹)',
    'Total Value (₹)'
  ];

  const rows = dataToExport.map((item) => {
    return [
      removeSuperscripts(item.productName || 'N/A'),
      removeSuperscripts(formatQuantity(item.quantity || item.quantityInTons || 0)), // Keeps 2 decimals: "5.00 ton"
      item.avgRate > 0 
        ? formatNumberForPDF(item.avgRate, 0) // No decimals: "45,700"
        : 'N/A',
      item.totalValue > 0 
        ? formatNumberForPDF(item.totalValue, 0) // No decimals: "228,500"
        : 'N/A'
    ];
  });

  // Calculate totals
  const totalQuantity = dataToExport.reduce((sum, i) => sum + (i.quantity || i.quantityInTons || 0), 0);
  const calculatedTotalValue = totalValue > 0 
    ? totalValue 
    : dataToExport.reduce((sum, i) => sum + (i.totalValue || 0), 0);

  const summary = {
    'Total Products': dataToExport.length,
    'Total Stock': formatQuantityAllUnits(totalQuantity),
    'Estimated Value': formatNumberForPDF(calculatedTotalValue, 0), // No decimals
    'FPO': removeSuperscripts(user.name),
  };

  // Create PDF with better table formatting
  const doc = new jsPDF();
  
  // Add official header with logo and MAHAFPC information
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerY = 15;
  
  // Load logo image and add header
  let logoDataUrl = null;
  try {
    // Try to load logo asynchronously
    logoDataUrl = await new Promise((resolve) => {
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = function() {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = this.width;
          canvas.height = this.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(this, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          console.log('Could not convert logo to data URL');
          resolve(null);
        }
      };
      logoImg.onerror = function() {
        console.log('Logo image not found, continuing without logo');
        resolve(null);
      };
      logoImg.src = '/logocheck.png';
      
      // Timeout after 2 seconds if image doesn't load
      setTimeout(() => resolve(null), 2000);
    });
  } catch (e) {
    console.log('Error loading logo:', e);
    logoDataUrl = null;
  }
  
  // Add logo if available
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 14, headerY, 20, 20);
    } catch (e) {
      console.log('Could not add logo image');
    }
  }
  
  // Add MAHAFPC name and information
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('MAHAFPC', logoDataUrl ? 40 : 14, headerY + 8);
  
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Maharashtra Farmer Producer Company', logoDataUrl ? 40 : 14, headerY + 14);
  doc.text('State Level Farmer Producer Company', logoDataUrl ? 40 : 14, headerY + 20);
  doc.text('Registered under Company Act 1956', logoDataUrl ? 40 : 14, headerY + 26);
  
  // Add date and report info on the right side
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  const date = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  // Remove any superscripts from date
  const cleanDate = date.replace(/[\u00B9\u00B2\u00B3\u2070-\u2079\u2080-\u2089]/g, '');
  doc.text(`Generated on: ${cleanDate}`, pageWidth - 14, headerY + 14, { align: 'right' });
  // Remove any superscripts from user name
  const cleanUserName = user.name.replace(/[\u00B9\u00B2\u00B3\u2070-\u2079\u2080-\u2089]/g, '');
  doc.text(`FPO: ${cleanUserName}`, pageWidth - 14, headerY + 22, { align: 'right' });
  
  // Add horizontal line to separate header from content
  doc.setLineWidth(0.5);
  doc.line(14, headerY + 30, pageWidth - 14, headerY + 30);
  
  // Add report title below the horizontal line (centered)
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Inventory Management Report', pageWidth / 2, headerY + 38, { align: 'center' });
  
  let yPosition = headerY + 48;

  // Add summary title
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Summary', 14, yPosition);
  yPosition += 6;

  // Create compact summary table with proper boxes
  const summaryHeaders = ['Metric', 'Value'];
  const summaryRows = Object.keys(summary).map((key) => [
    key,
    summary[key]
  ]);

  autoTable(doc, {
    head: [summaryHeaders],
    body: summaryRows,
    startY: yPosition,
    didParseCell: function (data) {
      // Center all cells and ensure no superscripts
      data.cell.styles.halign = 'center';
      
      // Remove any superscript characters from text
      if (data.cell.text) {
        data.cell.text = data.cell.text.map(text => {
          if (typeof text === 'string') {
            // Remove all superscript characters using comprehensive function
            return removeSuperscripts(text);
          }
          return text;
        });
      }
    },
    styles: { 
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: false, // No color - white/blank
      textColor: [0, 0, 0], // Black text
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 9,
      cellPadding: 3
    },
    bodyStyles: {
      fillColor: false, // No color - white/blank
      textColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle',
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { 
        cellWidth: 45, // Metric column - compact
        halign: 'center',
        fontStyle: 'bold',
        fontSize: 8,
        overflow: 'linebreak'
      },
      1: { 
        cellWidth: 55, // Value column - enough for values
        halign: 'center',
        fontSize: 8,
        overflow: 'linebreak'
      }
    },
    margin: { top: yPosition, left: 14, right: 14 },
    theme: 'grid', // Grid theme for full borders
    showHead: 'firstPage',
    tableWidth: 'wrap',
  });

  yPosition = doc.lastAutoTable.finalY + 8;

  // Add main table - same structure as procurement report
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: yPosition,
    styles: { fontSize: 9 },
    headStyles: {
      fillColor: [34, 139, 34], // Green color - same as procurement
      textColor: 255, // White text
      fontStyle: 'bold',
    },
    bodyStyles: {
      halign: 'left', // Left-align all data rows
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Light gray for alternate rows
    },
    margin: { top: yPosition },
  });

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  doc.save(`inventory_report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export sales data to PDF - same structure as procurement and inventory
 */
export const exportSalesToPDF = async (sales, user, filters = {}) => {
  const headers = ['Date', 'Time', 'Product', 'Quantity (ton)', 'Rate (₹)', 'Amount (₹)', 'Status'];
  const rows = sales.map((s) => [
    s.date,
    s.time || 'N/A',
    removeSuperscripts(s.productName || 'N/A'),
    formatQuantity(s.quantity), // Keeps 2 decimals: "5.00 ton"
    formatNumberForPDF(s.rate, 0), // No decimals: "45,700"
    formatNumberForPDF(s.amount, 0), // No decimals: "228,500"
    s.status,
  ]);

  const totalQuantity = sales.reduce((sum, s) => sum + s.quantity, 0);
  const totalAmount = sales.reduce((sum, s) => sum + s.amount, 0);

  const summary = {
    'Total Sales': sales.length,
    'Total Quantity Sold': formatQuantityAllUnits(totalQuantity),
    'Total Revenue': formatNumberForPDF(totalAmount, 0), // No decimals
    'FPO': removeSuperscripts(user.name),
  };

  if (filters.dateFrom || filters.dateTo) {
    summary['Date Range'] = `${filters.dateFrom || 'Start'} to ${filters.dateTo || 'End'}`;
  }

  const doc = new jsPDF();
  
  // Add header just like inventory and procurement reports
  const yPosition = await addMAHAFPCHeader(doc, user, 'Sales to MAHAFPC Report');
  
  // Add summary table (formatted like main table)
  let currentY = yPosition;
  if (summary) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Summary', 14, currentY);
    currentY += 6;

    // Create summary table with proper boxes
    const summaryHeaders = ['Metric', 'Value'];
    const summaryRows = Object.keys(summary).map((key) => [
      key,
      summary[key]
    ]);

    autoTable(doc, {
      head: [summaryHeaders],
      body: summaryRows,
      startY: currentY,
      didParseCell: function (data) {
        // Center all cells and ensure no superscripts
        data.cell.styles.halign = 'center';
        
        // Remove any superscript characters from text
        if (data.cell.text) {
          data.cell.text = data.cell.text.map(text => {
            if (typeof text === 'string') {
              // Remove all superscript characters using comprehensive function
              return removeSuperscripts(text);
            }
            return text;
          });
        }
      },
      styles: { 
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: false, // No color - white/blank
        textColor: [0, 0, 0], // Black text
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 9,
        cellPadding: 3
      },
      bodyStyles: {
        fillColor: false, // No color - white/blank
        textColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle',
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        0: { 
          cellWidth: 45, // Metric column - compact
          halign: 'center',
          fontStyle: 'bold',
          fontSize: 8,
          overflow: 'linebreak'
        },
        1: { 
          cellWidth: 55, // Value column - enough for values
          halign: 'center',
          fontSize: 8,
          overflow: 'linebreak'
        }
      },
      margin: { top: currentY, left: 14, right: 14 },
      theme: 'grid', // Grid theme for full borders
      showHead: 'firstPage',
      tableWidth: 'wrap',
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // Add table - same structure as procurement report
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: currentY,
    styles: { fontSize: 9 },
    headStyles: {
      fillColor: [34, 139, 34], // Green color
      textColor: 255,
      fontStyle: 'bold',
    },
    bodyStyles: {
      halign: 'left', // Left-align all data rows
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: currentY },
  });

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  doc.save(`sales_report_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Export FPO Daily Record to PDF
 */
export const exportFPODailyRecordToPDF = (fpoRecords, selectedDate, overallTotals) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('FPO Daily Record Report', 14, 20);
  
  // Add date
  doc.setFontSize(10);
  const date = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Generated on: ${date}`, 14, 30);
  
  if (selectedDate) {
    doc.text(`Record Date: ${selectedDate}`, 14, 36);
  }
  
  let yPosition = 45;

  // Add overall summary
  doc.setFontSize(12);
  doc.text('Overall Summary', 14, yPosition);
  yPosition += 7;
  doc.setFontSize(10);
  
  doc.text(`Total Procurement: ${formatQuantityAllUnits(overallTotals.procurementQuantity)}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Total Sales: ${formatQuantityAllUnits(overallTotals.salesQuantity)}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Total Inventory: ${formatQuantityAllUnits(overallTotals.inventory)}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Total Procurement Amount: ₹${overallTotals.procurementAmount.toLocaleString()}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Total Sales Amount: ₹${overallTotals.salesAmount.toLocaleString()}`, 14, yPosition);
  yPosition += 6;
  doc.text(`Total Business: ₹${overallTotals.totalBusiness.toLocaleString()}`, 14, yPosition);
  yPosition += 10;

  // Add FPO-wise records
  fpoRecords.forEach((record, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(34, 139, 34); // Green color
    doc.text(`${record.fpo.name} - ${record.fpo.location}`, 14, yPosition);
    yPosition += 7;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Black color
    doc.text(`Total Business: ₹${record.totals.totalBusiness.toLocaleString()}`, 14, yPosition);
    yPosition += 6;
    doc.text(`Procurement: ${formatQuantity(record.totals.procurementQuantity)} | Sales: ${formatQuantity(record.totals.salesQuantity)} | Inventory: ${formatQuantity(record.totals.inventory)}`, 14, yPosition);
    yPosition += 8;

    // Product-wise table
    const headers = ['Product', 'Proc Qty (ton)', 'Proc Rate (₹/ton)', 'Sales Qty (ton)', 'Sales Rate (₹/ton)', 'Billing (₹)', 'Inventory (ton)'];
    const rows = record.productWiseData.map((product) => [
      product.productName,
      formatQuantity(product.procurementQuantity),
      product.procurementRate > 0 ? `₹${(product.procurementRate * 1000).toFixed(2)}` : '-',
      formatQuantity(product.salesQuantity),
      product.salesRate > 0 ? `₹${(product.salesRate * 1000).toFixed(2)}` : '-',
      `₹${(product.procurementAmount + product.salesAmount).toLocaleString()}`,
      formatQuantity(product.inventory),
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPosition,
      styles: { fontSize: 8 },
      headStyles: {
        fillColor: [34, 139, 34],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: yPosition },
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  });

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save PDF
  const filename = `fpo_daily_record_${selectedDate || 'all_dates'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

