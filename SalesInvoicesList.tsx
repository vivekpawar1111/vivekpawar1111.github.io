/**
 * Care+ ERP: Sales Invoices Register & Document Viewer
 * Search, filter, inspect tax breakdown, and reprint using any selected template.
 */

import React, { useState, useRef } from 'react';
import { SalesInvoice, InvoiceTemplate, CompanyProfile, InvoiceType } from '../types/erp';
import { InvoiceRenderer, paperSizePx } from './InvoiceRenderer';
import { PrintSheet } from './PrintSheet';
import { printSheets } from '../utils/printService';
import { ShareDocumentModal } from './ShareDocumentModal';
import {
  Receipt,
  Search,
  Printer,
  Eye,
  FileCheck2,
  Calendar,
  Building,
  ArrowUpDown,
  Download,
  Filter,
  Edit3,
  Save,
  CheckCircle2,
  Trash2,
  X,
  UserPlus,
  Building2,
  Pill,
  Zap,
  Plus,
  Boxes,
  Share2,
} from 'lucide-react';
import { Customer, Supplier, Product, Batch } from '../types/erp';
import {
  QuickAddCustomerModal,
  QuickAddSupplierModal,
  QuickAddProductModal,
} from './QuickAddModals';
import { QuickAddBatchModal } from './QuickAddBatchModal';

interface SalesInvoicesListProps {
  invoices: SalesInvoice[];
  templates: InvoiceTemplate[];
  company: CompanyProfile;
  products?: Product[];
  batches?: Batch[];
  onUpdateInvoice?: (invoice: SalesInvoice) => Promise<void>;
  onCancelInvoice?: (id: string) => Promise<void>;
  initialEditInvoice?: SalesInvoice | null;
  initialType?: InvoiceType | 'ALL';
  onNavigateToBilling?: () => void;
  onCreateCustomer?: (custData: Partial<Customer>) => Promise<Customer | void>;
  onCreateSupplier?: (suppData: Partial<Supplier>) => Promise<Supplier | void>;
  onCreateProduct?: (prodData: Partial<Product>) => Promise<Product | void>;
  onCreateBatch?: (batchData: any) => Promise<Batch | void>;
}

export const SalesInvoicesList: React.FC<SalesInvoicesListProps> = ({
  invoices,
  templates,
  company,
  products = [],
  batches = [],
  onUpdateInvoice,
  onCancelInvoice,
  initialEditInvoice,
  initialType,
  onNavigateToBilling,
  onCreateCustomer,
  onCreateSupplier,
  onCreateProduct,
  onCreateBatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | InvoiceType>(initialType || 'ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(initialEditInvoice || null);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const invoicePrintRef = useRef<HTMLDivElement>(null);

  // Quick Add Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);

  React.useEffect(() => {
    if (initialEditInvoice) {
      setEditingInvoice(initialEditInvoice);
    }
  }, [initialEditInvoice]);

  React.useEffect(() => {
    if (initialType) setSelectedType(initialType);
  }, [initialType]);

  const originalInvoiceRef = React.useRef<string>('');
  React.useEffect(() => {
    if (editingInvoice && !originalInvoiceRef.current) {
      originalInvoiceRef.current = JSON.stringify(editingInvoice);
    } else if (!editingInvoice) {
      originalInvoiceRef.current = '';
    }
  }, [editingInvoice]);

  // Global escape and shortcut listener
  React.useEffect(() => {
    const handleEscape = (e: Event) => {
      // 1. If invoice document viewer / print preview is open (read-only): close immediately without confirmation
      if (selectedInvoice) {
        e.preventDefault();
        setSelectedInvoice(null);
        return;
      }

      // 2. If invoice editor modal is open:
      if (editingInvoice) {
        const isDirty = originalInvoiceRef.current && JSON.stringify(editingInvoice) !== originalInvoiceRef.current;
        if (!isDirty) {
          // No changes made: close immediately without confirmation
          e.preventDefault();
          setEditingInvoice(null);
          return;
        }

        // Changes made: confirm if user wants to save before closing
        e.preventDefault();
        window.dispatchEvent(
          new CustomEvent('careplus-request-confirm-close', {
            detail: {
              title: 'Save Invoice Changes?',
              message: 'You have modified invoice details. Would you like to save before closing?',
              saveLabel: 'Save & Close',
              discardLabel: 'Discard & Close',
              cancelLabel: 'Keep Editing',
              onSave: async () => {
                if (onUpdateInvoice) {
                  await onUpdateInvoice(editingInvoice);
                }
                triggerToast(`Invoice ${editingInvoice.invoiceNumber} updated successfully.`);
                setEditingInvoice(null);
              },
              onConfirm: () => setEditingInvoice(null),
            },
          })
        );
        return;
      }

      // 3. Quick add modals: close immediately without confirmation
      if (showAddCustomerModal) {
        e.preventDefault();
        setShowAddCustomerModal(false);
        return;
      }
      if (showAddSupplierModal) {
        e.preventDefault();
        setShowAddSupplierModal(false);
        return;
      }
      if (showAddProductModal) {
        e.preventDefault();
        setShowAddProductModal(false);
        return;
      }
      if (showAddBatchModal) {
        e.preventDefault();
        setShowAddBatchModal(false);
        return;
      }

      // 4. If no modal is open in this view, do NOT prevent default!
      // This allows App.tsx to immediately go back to the previous screen without confirmation.
    };
    const handleCreateShortcut = () => {
      if (onNavigateToBilling) {
        onNavigateToBilling();
      }
    };
    const handleAddBatchShortcut = () => {
      setShowAddBatchModal(true);
    };

    window.addEventListener('careplus-escape', handleEscape);
    window.addEventListener('careplus-create-entry', handleCreateShortcut);
    window.addEventListener('careplus-add-batch', handleAddBatchShortcut);

    return () => {
      window.removeEventListener('careplus-escape', handleEscape);
      window.removeEventListener('careplus-create-entry', handleCreateShortcut);
      window.removeEventListener('careplus-add-batch', handleAddBatchShortcut);
    };
  }, [
    selectedInvoice,
    editingInvoice,
    showAddCustomerModal,
    showAddSupplierModal,
    showAddProductModal,
    showAddBatchModal,
    onNavigateToBilling,
  ]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const [activeTemplateId, setActiveTemplateId] = useState<string>(
    templates.find((t) => t.isDefault)?.id || templates[0]?.id || ''
  );

  const filteredInvoices = invoices.filter((inv) => {
    if (selectedType !== 'ALL') {
      const type = inv.invoiceType || 'TAX_INVOICE';
      if (type !== selectedType) return false;
    }
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customerShopName.toLowerCase().includes(q) ||
      inv.customerGstin.toLowerCase().includes(q) ||
      (inv.supplierName && inv.supplierName.toLowerCase().includes(q))
    );
  });

  const handleOpenInvoice = (inv: SalesInvoice) => {
    setSelectedInvoice(inv);
    setActiveTemplateId(inv.templateId || templates[0]?.id);
  };

  const currentTemplate =
    templates.find((t) => t.id === activeTemplateId) || templates[0];

  /** Paper geometry of the layout chosen for the open invoice. */
  const currentPaper = paperSizePx(currentTemplate?.paperFormat);

  /**
   * Print the invoice sheet only. The dialog preview is scaled and clipped, so
   * `window.print()` there used to emit the dialog chrome instead of the page.
   * On the APK (no print engine) we fall back to the share sheet.
   */
  const handlePrintInvoice = () => {
    if (!selectedInvoice) return;
    if (printSheets(currentPaper.width, currentPaper.height)) return;
    triggerToast('No print dialog on this device — preparing a PDF to share instead.');
    setShowShareModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & M3 Expressive Action Bar */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-[#E8F1FB] text-[#17365D] rounded-2xl">
              <Receipt className="w-5 h-5 text-[#0F8B8D]" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-[#17365D] tracking-tight">Invoices & Billing Register</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete GST outward sales and inward purchase journal with instant multi-template reprinting.
              </p>
            </div>
          </div>
        </div>

        {/* Material 3 Expressive Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToBilling && (
            <button
              type="button"
              onClick={onNavigateToBilling}
              className="flex items-center gap-2 py-2 px-3.5 bg-[#0F8B8D] hover:bg-[#0c7476] active:scale-[0.98] text-white rounded-2xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-teal-300" />
              <span>+ Open Fast Billing (F2)</span>
            </button>
          )}

          {onCreateCustomer && (
            <button
              type="button"
              onClick={() => setShowAddCustomerModal(true)}
              className="flex items-center gap-2 py-2 px-3 bg-[#E8F1FB] hover:bg-[#d5e7f9] active:scale-[0.98] text-[#17365D] border border-blue-200/90 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Add new chemist store directly"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#0F8B8D]" />
              <span>+ New Chemist</span>
            </button>
          )}

          {onCreateSupplier && (
            <button
              type="button"
              onClick={() => setShowAddSupplierModal(true)}
              className="flex items-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] text-emerald-950 border border-emerald-200/90 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Add new supplier directly"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>+ New Supplier</span>
            </button>
          )}

          {onCreateProduct && (
            <button
              type="button"
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center gap-2 py-2 px-3 bg-teal-50 hover:bg-teal-100 active:scale-[0.98] text-teal-950 border border-teal-300/80 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Add new medicine and batch directly"
            >
              <Pill className="w-3.5 h-3.5 text-[#0F8B8D]" />
              <span>+ New Medicine</span>
            </button>
          )}

          {onCreateBatch && (
            <button
              type="button"
              onClick={() => setShowAddBatchModal(true)}
              className="flex items-center gap-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 active:scale-[0.98] text-amber-950 border border-amber-300/80 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Add and register new batch number (Alt+B)"
            >
              <Boxes className="w-3.5 h-3.5 text-amber-700" />
              <span>+ New Batch</span>
              <kbd className="text-[9px] bg-amber-200/70 text-amber-900 px-1 py-0.2 rounded font-mono font-bold">Alt+B</kbd>
            </button>
          )}
        </div>
      </div>

      {/* View Mode Toggle & Pill Search Bar (Screenshot 10) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Pill Search Input */}
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none opacity-60">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoice no, chemist name, GSTIN..."
            className="w-full pl-11 pr-4 py-3 rounded-full text-xs sm:text-sm font-medium border shadow-2xs transition-colors focus:outline-hidden focus:ring-2"
            style={{
              backgroundColor: 'var(--color-surface)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-neutral-text)',
            }}
          />
        </div>

        {/* View Switcher Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl border self-start sm:self-auto"
             style={{ backgroundColor: 'var(--color-m3-surface-container)', borderColor: 'var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'shadow-xs font-black'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={
              viewMode === 'cards'
                ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-m3-primary)' }
                : { color: 'var(--color-neutral-text)' }
            }
          >
            Card View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'shadow-xs font-black'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={
              viewMode === 'table'
                ? { backgroundColor: 'var(--color-surface)', color: 'var(--color-m3-primary)' }
                : { color: 'var(--color-neutral-text)' }
            }
          >
            Table View
          </button>
        </div>
      </div>

      {/* Well-Defined Document Tabs with Material 3 Expressive Segmented Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80 shadow-inner">
        {[
          { id: 'ALL', label: 'All Documents', count: invoices.length },
          { id: 'TAX_INVOICE' as InvoiceType, label: 'Sales Tax Invoices', count: invoices.filter((i) => !i.invoiceType || i.invoiceType === 'TAX_INVOICE').length },
          { id: 'PURCHASE_ORDER' as InvoiceType, label: 'Purchase Orders (PO)', count: invoices.filter((i) => i.invoiceType === 'PURCHASE_ORDER').length },
          { id: 'PURCHASE_INVOICE' as InvoiceType, label: 'Purchase Inward', count: invoices.filter((i) => i.invoiceType === 'PURCHASE_INVOICE').length },
          { id: 'CREDIT_NOTE' as InvoiceType, label: 'Credit Notes', count: invoices.filter((i) => i.invoiceType === 'CREDIT_NOTE').length },
          { id: 'DEBIT_NOTE' as InvoiceType, label: 'Debit Notes', count: invoices.filter((i) => i.invoiceType === 'DEBIT_NOTE').length },
          { id: 'PROFORMA' as InvoiceType, label: 'Proforma', count: invoices.filter((i) => i.invoiceType === 'PROFORMA').length },
          { id: 'DELIVERY_CHALLAN' as InvoiceType, label: 'Challans', count: invoices.filter((i) => i.invoiceType === 'DELIVERY_CHALLAN').length },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedType(f.id as any)}
            className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-[0.98] ${
              selectedType === f.id
                ? 'bg-[#17365D] text-white border-[#17365D] shadow-xs'
                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
            }`}
          >
            <span>{f.label}</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                selectedType === f.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* CARD VIEW MODE: MATCHING SCREENSHOT 10 */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {filteredInvoices.length === 0 ? (
            <div
              className="p-12 text-center rounded-[32px] border space-y-3"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              <Receipt className="w-10 h-10 mx-auto opacity-40" />
              <h3 className="text-base font-extrabold">No Invoices Found</h3>
              <p className="text-xs opacity-75">Try clearing filters or search terms</p>
            </div>
          ) : (
            filteredInvoices.map((inv) => {
              const partyName = inv.partyType === 'SUPPLIER' || inv.invoiceType === 'PURCHASE_INVOICE' || inv.invoiceType === 'DEBIT_NOTE'
                ? (inv.supplierName || inv.customerShopName)
                : inv.customerShopName;
              const isPaid = inv.paymentStatus === 'PAID';
              const isPartial = inv.paymentStatus === 'PARTIAL';

              return (
                <div
                  key={inv.id}
                  onClick={() => handleOpenInvoice(inv)}
                  className="p-5 sm:p-6 rounded-[28px] border shadow-xs transition-all hover:shadow-md cursor-pointer space-y-3.5 hover:border-[#6750A4] group"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-black group-hover:text-[#6750A4] transition-colors"
                              style={{ color: 'var(--color-m3-primary)' }}>
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-sm font-bold text-gray-400">•</span>
                        <h3 className="text-base font-black tracking-tight">{partyName}</h3>
                        {/* Status Chip */}
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                          style={
                            isPaid
                              ? { backgroundColor: '#D8F3E8', color: '#146C43' }
                              : isPartial
                              ? { backgroundColor: '#EADDFF', color: '#21005D' }
                              : { backgroundColor: '#FFDBCF', color: '#733400' }
                          }
                        >
                          {isPaid ? 'Paid' : isPartial ? 'Partially Paid' : 'Unpaid'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs opacity-75 font-medium">
                        <span>GSTIN: <strong className="font-mono">{inv.customerGstin || 'Unregistered'}</strong></span>
                        <span>•</span>
                        <span>Items: <strong>{inv.items?.length || 1} Products</strong> ({inv.items?.[0]?.productName || 'Medicines'}...)</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Date: {inv.invoiceDate}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Quick Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0"
                         style={{ borderColor: 'var(--color-border)' }}>
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] uppercase font-bold opacity-70">Total Amount</div>
                        <div className="text-xl font-black text-emerald-600">
                          ₹{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] opacity-70">
                          inv.isInterState ? `Tax: ₹{(inv.totalTax || 0).toFixed(2)} (IGST)` : `Tax: ₹{(inv.totalTax || 0).toFixed(2)}`
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenInvoice(inv)}
                          className="p-2.5 rounded-2xl border hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                          title="Print Invoice"
                          style={{
                            backgroundColor: 'var(--color-m3-surface-container)',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setShowShareModal(true);
                          }}
                          className="p-2.5 rounded-2xl border hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                          title="Share Invoice (PDF / Image)"
                          style={{
                            backgroundColor: 'var(--color-m3-surface-container)',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          <Share2 className="w-4 h-4 text-emerald-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingInvoice({ ...inv })}
                          className="p-2.5 rounded-2xl border hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                          title="Edit Invoice"
                          style={{
                            backgroundColor: 'var(--color-m3-surface-container)',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          <Edit3 className="w-4 h-4 text-amber-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TABLE VIEW MODE (Fallback) */}
      {viewMode === 'table' && (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F9FC] border-b border-gray-200 text-gray-600 font-semibold">
              <tr>
                <th className="py-2.5 px-3 min-w-[100px] whitespace-nowrap">Doc Type</th>
                <th className="py-2.5 px-3 min-w-[120px] whitespace-nowrap">Invoice No</th>
                <th className="py-2.5 px-3 min-w-[95px] whitespace-nowrap">Date</th>
                <th className="py-2.5 px-3 min-w-[180px]">Chemist / Recipient</th>
                <th className="py-2.5 px-3 min-w-[130px] whitespace-nowrap">GSTIN</th>
                <th className="py-2.5 px-3 min-w-[110px] whitespace-nowrap">Tax Type</th>
                <th className="py-2.5 px-3 text-right min-w-[95px] whitespace-nowrap">Taxable Val</th>
                <th className="py-2.5 px-3 text-right min-w-[85px] whitespace-nowrap">Total Tax</th>
                <th className="py-2.5 px-3 text-right min-w-[100px] whitespace-nowrap">Grand Total</th>
                <th className="py-2.5 px-3 text-center min-w-[85px] whitespace-nowrap">Status</th>
                <th className="py-2.5 px-3 text-center min-w-[95px] whitespace-nowrap sticky right-0 bg-[#F7F9FC] shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-500 font-sans">
                    <Receipt className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-700">No documents in register</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {invoices.length === 0
                        ? "Your database is empty and ready for fresh billing. Press F2 or click below to generate your first invoice."
                        : "No documents match the selected filter or search."}
                    </p>
                    {onNavigateToBilling && invoices.length === 0 && (
                      <button
                        type="button"
                        onClick={onNavigateToBilling}
                        className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 bg-[#6750A4] text-white text-xs font-bold rounded-full hover:bg-[#583F96] shadow-xs transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Create First Bill (F2)</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const docType = inv.invoiceType || 'TAX_INVOICE';
                const partyName = inv.partyType === 'SUPPLIER' || inv.invoiceType === 'PURCHASE_INVOICE' || inv.invoiceType === 'DEBIT_NOTE'
                  ? (inv.supplierName || inv.customerShopName)
                  : inv.customerShopName;
                const isSupplier = inv.partyType === 'SUPPLIER' || inv.invoiceType === 'PURCHASE_INVOICE' || inv.invoiceType === 'DEBIT_NOTE';

                return (
                  <tr
                    key={inv.id}
                    onClick={() => handleOpenInvoice(inv)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    title="Click anywhere on row to view and print invoice document"
                  >
                    <td className="py-2 px-3 font-sans whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          docType === 'PURCHASE_INVOICE'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : docType === 'CREDIT_NOTE'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : docType === 'DEBIT_NOTE'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : docType === 'PROFORMA'
                            ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                            : docType === 'DELIVERY_CHALLAN'
                            ? 'bg-slate-50 text-slate-800 border-slate-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        {docType === 'PURCHASE_INVOICE'
                          ? 'Purchase'
                          : docType === 'CREDIT_NOTE'
                          ? 'Credit Note'
                          : docType === 'DEBIT_NOTE'
                          ? 'Debit Note'
                          : docType === 'PROFORMA'
                          ? 'Proforma'
                          : docType === 'DELIVERY_CHALLAN'
                          ? 'Challan'
                          : 'Sales Tax'}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-gray-900 group-hover:text-[#1A73E8] transition-colors whitespace-nowrap">{inv.invoiceNumber}</td>
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{inv.invoiceDate}</td>
                    <td className="py-2 px-3 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          isSupplier ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {isSupplier ? 'Supplier' : 'Customer'}
                        </span>
                        <span className="text-gray-900 font-semibold truncate max-w-[170px]" title={partyName}>
                          {partyName}
                        </span>
                      </div>
                      <span className="block text-[10px] text-gray-400 font-mono font-normal truncate max-w-[170px]">{inv.customerCity}</span>
                    </td>
                    <td className="py-2 px-3 font-bold text-gray-700 whitespace-nowrap">{inv.customerGstin || 'URP'}</td>
                    <td className="py-2 px-3 font-sans whitespace-nowrap">
                      {inv.isInterState ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          IGST (Interstate)
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          CGST + SGST
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-medium tabular-nums whitespace-nowrap">₹{inv.totalTaxable.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-medium text-gray-700 tabular-nums whitespace-nowrap">₹{inv.totalTax.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-bold text-gray-900 tabular-nums whitespace-nowrap">
                      ₹{inv.grandTotal.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center sticky right-0 bg-white group-hover:bg-blue-50/50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] transition-colors">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInvoice(inv);
                          }}
                          className="px-2 py-1 bg-[#E8F1FB] hover:bg-[#d5e7f9] text-[#17365D] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="View & Print Document"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0F8B8D]" /> View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingInvoice({ ...inv });
                          }}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors cursor-pointer"
                          title="Edit Invoice Details"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
      )}

      {/* FLOATING ACTION BUTTON (+ Create Invoice - Screenshot 10) */}
      {onNavigateToBilling && (
        <button
          type="button"
          onClick={onNavigateToBilling}
          aria-label="Create Invoice"
          title="Create Invoice"
          className="fixed bottom-20 right-6 sm:bottom-24 sm:right-8 z-30 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95"
          style={{
            backgroundColor: '#C5B4E3',
            color: '#28144E',
          }}
        >
          <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.75]" />
        </button>
      )}

      {/* Invoice Document Modal with Live Template Switcher */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Bar */}
            <div className="p-4 bg-[#17365D] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {selectedInvoice.invoiceNumber} • {selectedInvoice.customerShopName}
                </h3>
                <p className="text-xs text-blue-200">
                  Total: ₹{selectedInvoice.grandTotal.toFixed(2)} • Issued: {selectedInvoice.invoiceDate}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-gray-300 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Template Switcher Header inside Modal */}
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700">Display Template:</span>
                <select
                  value={activeTemplateId}
                  onChange={(e) => setActiveTemplateId(e.target.value)}
                  className="text-xs font-semibold p-2 bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#0F8B8D]"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.paperFormat})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingInvoice({ ...selectedInvoice });
                    setSelectedInvoice(null);
                  }}
                  className="flex items-center gap-1.5 py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  title="Edit this invoice"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  title="Share as PNG, JPG, or PDF via native Android sharing menu"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button
                  onClick={handlePrintInvoice}
                  className="flex items-center gap-1.5 py-1.5 px-4 bg-[#0F8B8D] hover:bg-[#0c7476] text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Invoice
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="py-1.5 px-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Rendered Document View */}
            <div className="p-6 bg-gray-200 overflow-y-auto flex-1 flex justify-center items-start">
              <div ref={invoicePrintRef} className="shadow-2xl bg-white rounded-lg">
                <InvoiceRenderer
                  invoice={selectedInvoice}
                  template={currentTemplate}
                  company={company}
                  scale={0.88}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Document Modal */}
      {selectedInvoice && (
        <ShareDocumentModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          documentRef={invoicePrintRef}
          invoice={selectedInvoice}
        />
      )}

      {/* Full-size sheet for the printer — the dialog preview above is scaled
          down and clipped, so it must never be what reaches paper. */}
      {selectedInvoice && (
        <PrintSheet width={currentPaper.width} height={currentPaper.height}>
          <InvoiceRenderer
            invoice={selectedInvoice}
            template={currentTemplate}
            company={company}
          />
        </PrintSheet>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#17365D]">Edit Document Details</h3>
                <p className="text-xs text-gray-500 font-mono">
                  {editingInvoice.invoiceNumber} • {editingInvoice.customerShopName || editingInvoice.supplierName}
                </p>
              </div>
              <button
                onClick={() => setEditingInvoice(null)}
                className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (onUpdateInvoice) {
                  await onUpdateInvoice(editingInvoice);
                }
                triggerToast(`Invoice ${editingInvoice.invoiceNumber} updated successfully.`);
                setEditingInvoice(null);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Invoice / Doc Number</label>
                  <input
                    type="text"
                    value={editingInvoice.invoiceNumber}
                    onChange={(e) =>
                      setEditingInvoice({ ...editingInvoice, invoiceNumber: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Document Type</label>
                  <select
                    value={editingInvoice.invoiceType || 'TAX_INVOICE'}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        invoiceType: e.target.value as any,
                      })
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  >
                    <option value="TAX_INVOICE">Tax Invoice (Sales)</option>
                    <option value="PURCHASE_INVOICE">Purchase Invoice</option>
                    <option value="CREDIT_NOTE">Credit Note (Sales Return)</option>
                    <option value="DEBIT_NOTE">Debit Note (Purchase Return)</option>
                    <option value="PROFORMA">Proforma Invoice</option>
                    <option value="DELIVERY_CHALLAN">Delivery Challan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={editingInvoice.invoiceDate}
                    onChange={(e) =>
                      setEditingInvoice({ ...editingInvoice, invoiceDate: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editingInvoice.dueDate}
                    onChange={(e) =>
                      setEditingInvoice({ ...editingInvoice, dueDate: e.target.value })
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Status</label>
                  <select
                    value={editingInvoice.paymentStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      const received =
                        newStatus === 'PAID'
                          ? editingInvoice.grandTotal
                          : newStatus === 'UNPAID'
                          ? 0
                          : editingInvoice.amountReceived;
                      setEditingInvoice({
                        ...editingInvoice,
                        paymentStatus: newStatus,
                        amountReceived: received,
                        balanceDue: Math.max(0, editingInvoice.grandTotal - received),
                      });
                    }}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  >
                    <option value="PAID">PAID (Full Settlement)</option>
                    <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                    <option value="UNPAID">UNPAID (Credit)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={editingInvoice.paymentMode}
                    onChange={(e) =>
                      setEditingInvoice({
                        ...editingInvoice,
                        paymentMode: e.target.value as any,
                      })
                    }
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-semibold"
                  >
                    <option value="CREDIT">CREDIT (Standard Terms)</option>
                    <option value="NEFT_RTGS">NEFT / RTGS Bank Transfer</option>
                    <option value="UPI">UPI Digital Payment</option>
                    <option value="CASH">CASH Payment</option>
                    <option value="CHEQUE">Cheque / Draft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Grand Total (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingInvoice.grandTotal}
                    onChange={(e) => {
                      const newTotal = Number(e.target.value);
                      setEditingInvoice({
                        ...editingInvoice,
                        grandTotal: newTotal,
                        balanceDue: Math.max(0, newTotal - (editingInvoice.amountReceived || 0)),
                      });
                    }}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Amount Received (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingInvoice.amountReceived || 0}
                    onChange={(e) => {
                      const rec = Number(e.target.value);
                      setEditingInvoice({
                        ...editingInvoice,
                        amountReceived: rec,
                        balanceDue: Math.max(0, editingInvoice.grandTotal - rec),
                        paymentStatus:
                          rec >= editingInvoice.grandTotal
                            ? 'PAID'
                            : rec > 0
                            ? 'PARTIAL'
                            : 'UNPAID',
                      });
                    }}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Balance Due (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingInvoice.balanceDue || 0}
                    readOnly
                    className="w-full p-2 bg-gray-100 border border-gray-300 rounded-lg font-mono font-bold text-amber-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Order / PO Reference</label>
                  <input
                    type="text"
                    value={editingInvoice.orderReference || ''}
                    onChange={(e) =>
                      setEditingInvoice({ ...editingInvoice, orderReference: e.target.value })
                    }
                    placeholder="e.g. PO-2026-99"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">e-Way Bill Number</label>
                  <input
                    type="text"
                    value={editingInvoice.eWayBillNo || ''}
                    onChange={(e) =>
                      setEditingInvoice({ ...editingInvoice, eWayBillNo: e.target.value })
                    }
                    placeholder="e.g. 2489104829"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Invoice Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={editingInvoice.notes || ''}
                  onChange={(e) =>
                    setEditingInvoice({ ...editingInvoice, notes: e.target.value })
                  }
                  placeholder="Terms, batch remark, or special instruction..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                {onCancelInvoice && editingInvoice.status !== 'CANCELLED' ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Cancel invoice ${editingInvoice.invoiceNumber}? This marks the document cancelled.`)) {
                        await onCancelInvoice(editingInvoice.id);
                        triggerToast(`Invoice ${editingInvoice.invoiceNumber} cancelled.`);
                        setEditingInvoice(null);
                      }
                    }}
                    className="py-2 px-3 text-rose-600 hover:bg-rose-50 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Cancel Document
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingInvoice(null)}
                    className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-4 bg-[#0F8B8D] hover:bg-[#0c7476] text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#17365D] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* QUICK ADD MODALS */}
      <QuickAddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        companyStateCode={company.stateCode}
        onSave={onCreateCustomer || (async () => {})}
        onSuccess={(newCust) => {
          triggerToast(`Chemist "${newCust.shopName}" registered successfully!`);
        }}
      />

      <QuickAddSupplierModal
        isOpen={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
        onSave={onCreateSupplier || (async () => {})}
        onSuccess={(newSupp) => {
          triggerToast(`Supplier "${newSupp.companyName}" registered successfully!`);
        }}
      />

      <QuickAddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onSaveProduct={onCreateProduct || (async () => {})}
        onSaveBatch={onCreateBatch}
        onSuccess={(newProd, newBatch) => {
          if (newBatch) {
            triggerToast(`Medicine "${newProd.name}" and Batch "${newBatch.batchNumber}" created!`);
          }
        }}
      />

      <QuickAddBatchModal
        isOpen={showAddBatchModal}
        onClose={() => setShowAddBatchModal(false)}
        products={products || []}
        onSaveBatch={onCreateBatch}
        onSuccess={(newBatch) => {
          triggerToast(`Batch "${newBatch.batchNumber}" registered successfully!`);
        }}
      />
    </div>
  );
};

