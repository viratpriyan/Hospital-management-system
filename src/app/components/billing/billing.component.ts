import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalDataService } from '../../services/hospital-data.service';
import { ToastService } from '../../services/toast.service';
import { Bill } from '../../models/hospital.models';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="billing-page">
      <!-- Financial Summary Cards -->
      <div class="billing-kpis">
        <div class="kpi-box">
          <div class="kpi-icon icon-emerald"><i class="fa-solid fa-circle-check"></i></div>
          <div class="kpi-data">
            <span class="kpi-label">Paid Revenue</span>
            <span class="kpi-val text-emerald">₹{{ dataService.stats().totalRevenue | number:'1.2-2' }}</span>
          </div>
        </div>
        <div class="kpi-box">
          <div class="kpi-icon icon-amber"><i class="fa-solid fa-clock-rotate-left"></i></div>
          <div class="kpi-data">
            <span class="kpi-label">Pending / Unpaid Dues</span>
            <span class="kpi-val text-amber">₹{{ dataService.stats().pendingDues | number:'1.2-2' }}</span>
          </div>
        </div>
        <div class="kpi-box">
          <div class="kpi-icon icon-blue"><i class="fa-solid fa-file-invoice"></i></div>
          <div class="kpi-data">
            <span class="kpi-label">Total Invoices</span>
            <span class="kpi-val">{{ dataService.bills().length }}</span>
          </div>
        </div>
      </div>

      <!-- Action & Filter Bar -->
      <div class="page-action-bar">
        <div class="search-filter-group">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input 
              type="text" 
              placeholder="Search by Patient Name or Invoice ID..." 
              [(ngModel)]="searchQuery" 
              class="form-control search-input"
            />
            <button *ngIf="searchQuery" class="clear-search" (click)="searchQuery = ''">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <select [(ngModel)]="selectedStatus" class="form-control select-filter">
            <option value="ALL">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Partially Paid">Partially Paid</option>
          </select>
        </div>

        <button class="btn btn-primary" (click)="openCreateModal()">
          <i class="fa-solid fa-receipt"></i> Generate New Bill
        </button>
      </div>

      <!-- Invoices Table -->
      <div class="hms-card">
        <div class="table-responsive">
          <table class="hms-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Patient Details</th>
                <th>Consultant</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Subtotal</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let bill of filteredBills()">
                <td>
                  <span class="patient-id-badge">{{ bill.id }}</span>
                </td>
                <td>
                  <strong>{{ bill.patientName }}</strong>
                  <div class="text-xs text-muted">{{ bill.patientId }}</div>
                </td>
                <td>
                  <span class="font-semibold">{{ bill.doctorName || 'General Ward' }}</span>
                </td>
                <td><span class="date-text">{{ bill.issueDate }}</span></td>
                <td><span class="date-text">{{ bill.dueDate }}</span></td>
                <td>₹{{ bill.subtotal | number:'1.2-2' }}</td>
                <td>
                  <strong class="total-amount-cell">₹{{ bill.totalAmount | number:'1.2-2' }}</strong>
                  <div class="text-xs text-muted" *ngIf="bill.paymentMethod">via {{ bill.paymentMethod }}</div>
                </td>
                <td>
                  <span 
                    class="badge" 
                    [ngClass]="bill.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-pending'"
                  >
                    {{ bill.paymentStatus }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="actions-wrapper">
                    <!-- Quick Mark Paid -->
                    <button 
                      *ngIf="bill.paymentStatus !== 'Paid'" 
                      class="btn-icon" 
                      (click)="markPaid(bill)" 
                      title="Settle Bill (Mark as Paid)"
                    >
                      <i class="fa-solid fa-indian-rupee-sign text-emerald"></i>
                    </button>
                    <!-- View / Print Invoice -->
                    <button class="btn-icon" (click)="viewInvoice(bill)" title="View & Print Official Invoice">
                      <i class="fa-solid fa-file-invoice"></i>
                    </button>
                    <!-- Edit -->
                    <button class="btn-icon" (click)="openEditModal(bill)" title="Edit Invoice Details">
                      <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                    <!-- Delete -->
                    <button class="btn-icon btn-icon-danger" (click)="openDeleteConfirm(bill)" title="Delete Invoice">
                      <i class="fa-regular fa-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredBills().length === 0">
                <td colspan="9" class="empty-table-cell">
                  <div class="empty-state">
                    <i class="fa-solid fa-receipt"></i>
                    <h4>No invoices found matching criteria</h4>
                    <p>Create a new hospital invoice to bill a patient.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL 1: GENERATE / EDIT BILL -->
      <!-- ========================================== -->
      <div class="modal-overlay" *ngIf="showFormModal" (click)="closeFormModal()">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>
              <i class="fa-solid fa-receipt text-blue"></i>
              {{ isEditing ? 'Edit Hospital Invoice' : 'Generate Patient Hospital Bill' }}
            </h3>
            <button class="btn-icon" (click)="closeFormModal()"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <form (ngSubmit)="saveBill()" #billForm="ngForm">
            <div class="modal-body">
              <!-- Basic selectors -->
              <div class="grid grid-cols-2 gap-4 mb-3">
                <div class="form-group">
                  <label class="form-label">Patient *</label>
                  <select 
                    name="patientId" 
                    [(ngModel)]="formData.patientId" 
                    (change)="onPatientSelected()" 
                    required 
                    class="form-control"
                  >
                    <option value="" disabled>-- Select Patient --</option>
                    <option *ngFor="let p of dataService.patients()" [value]="p.id">
                      {{ p.name }} ({{ p.id }})
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Attending Doctor</label>
                  <select 
                    name="doctorId" 
                    [(ngModel)]="formData.doctorId" 
                    (change)="onDoctorSelected()" 
                    class="form-control"
                  >
                    <option value="">-- None / Facility Charges Only --</option>
                    <option *ngFor="let d of dataService.doctors()" [value]="d.id">
                      {{ d.name }} - Fee ₹{{ d.consultationFee }}
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Invoice Date *</label>
                  <input type="date" name="issueDate" [(ngModel)]="formData.issueDate" required class="form-control" />
                </div>

                <div class="form-group">
                  <label class="form-label">Payment Due Date *</label>
                  <input type="date" name="dueDate" [(ngModel)]="formData.dueDate" required class="form-control" />
                </div>
              </div>

              <!-- Itemized Charge Inputs -->
              <div class="section-divider">
                <span>ITEMIZED CLINICAL & HOSPITAL CHARGES</span>
              </div>

              <div class="grid grid-cols-3 gap-3 mb-3">
                <div class="form-group">
                  <label class="form-label">Doctor Consultation Fee (₹)</label>
                  <input 
                    type="number" 
                    name="consultationFee" 
                    [(ngModel)]="formData.consultationFee" 
                    min="0" 
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Treatment / Procedure (₹)</label>
                  <input 
                    type="number" 
                    name="treatmentCharges" 
                    [(ngModel)]="formData.treatmentCharges" 
                    min="0" 
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Laboratory & Diagnostics (₹)</label>
                  <input 
                    type="number" 
                    name="labCharges" 
                    [(ngModel)]="formData.labCharges" 
                    min="0" 
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Pharmacy & Medicines (₹)</label>
                  <input 
                    type="number" 
                    name="pharmacyCharges" 
                    [(ngModel)]="formData.pharmacyCharges" 
                    min="0" 
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Room & Nursing Care (₹)</label>
                  <input 
                    type="number" 
                    name="roomCharges" 
                    [(ngModel)]="formData.roomCharges" 
                    min="0" 
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Clinic Discount (₹)</label>
                  <input 
                    type="number" 
                    name="discount" 
                    [(ngModel)]="formData.discount" 
                    min="0" 
                    class="form-control"
                  />
                </div>
              </div>

              <!-- Realtime summary preview -->
              <div class="bill-calculation-preview">
                <div class="calc-row">
                  <span>Subtotal Charges:</span>
                  <strong>₹{{ computeSubtotal() | number:'1.2-2' }}</strong>
                </div>
                <div class="calc-row">
                  <span>Hospital Tax ({{ formData.taxPercent }}%):</span>
                  <strong>+ ₹{{ computeTax() | number:'1.2-2' }}</strong>
                </div>
                <div class="calc-row text-danger" *ngIf="formData.discount > 0">
                  <span>Discount Applied:</span>
                  <strong>- ₹{{ formData.discount | number:'1.2-2' }}</strong>
                </div>
                <div class="calc-row net-total-row">
                  <span>Net Grand Total:</span>
                  <span class="grand-total-val">₹{{ computeTotal() | number:'1.2-2' }}</span>
                </div>
              </div>

              <!-- Payment Status & Method -->
              <div class="section-divider mt-3">
                <span>PAYMENT SETTLEMENT STATUS</span>
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div class="form-group">
                  <label class="form-label">Payment Status *</label>
                  <select name="paymentStatus" [(ngModel)]="formData.paymentStatus" required class="form-control">
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partially Paid">Partially Paid</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Payment Method</label>
                  <select name="paymentMethod" [(ngModel)]="formData.paymentMethod" class="form-control">
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="Insurance">Health Insurance</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Insurance Provider / Policy #</label>
                  <input 
                    type="text" 
                    name="insuranceProvider" 
                    [(ngModel)]="formData.insuranceProvider" 
                    placeholder="e.g. BlueCross #9921" 
                    class="form-control"
                  />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Billing Notes (Optional)</label>
                <input 
                  type="text" 
                  name="notes" 
                  [(ngModel)]="formData.notes" 
                  placeholder="e.g. Outpatient reception invoice, insurance claim pre-authorized." 
                  class="form-control"
                />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeFormModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="billForm.invalid">
                <i class="fa-solid fa-check"></i>
                {{ isEditing ? 'Update Invoice' : 'Generate & Issue Invoice' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL 2: PRINTABLE OFFICIAL TAX INVOICE -->
      <!-- ========================================== -->
      <div class="modal-overlay" *ngIf="selectedInvoice" (click)="selectedInvoice = null">
        <div class="modal-content modal-lg print-prescription-wrapper" (click)="$event.stopPropagation()">
          <div class="modal-header no-print">
            <h3><i class="fa-solid fa-receipt text-blue"></i> Official Hospital Tax Invoice</h3>
            <button class="btn-icon" (click)="selectedInvoice = null"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <div class="modal-body invoice-print-sheet" id="invoice-sheet">
            <!-- Header -->
            <div class="invoice-letterhead">
              <div class="brand-left">
                <div class="logo-circle"><i class="fa-solid fa-notes-medical"></i></div>
                <div>
                  <h2 class="hospital-name">PRAVEEN CLINIC & HEALTH CARE</h2>
                  <p class="hospital-sub">Medical Billing & Patient Accounting Bureau</p>
                  <p class="hospital-contact">No. 45, Anna Salai, T. Nagar, Chennai - 600017 • GSTIN: 33AAACP1234F1Z5</p>
                </div>
              </div>
              <div class="invoice-status-stamp" [class.stamp-paid]="selectedInvoice.paymentStatus === 'Paid'">
                {{ selectedInvoice.paymentStatus }}
              </div>
            </div>

            <hr class="chart-divider" />

            <!-- Invoice Details Bar -->
            <div class="invoice-details-grid">
              <div>
                <span class="lbl">Billed To:</span>
                <strong>{{ selectedInvoice.patientName }} ({{ selectedInvoice.patientId }})</strong>
                <div class="text-xs text-muted" *ngIf="selectedInvoice.insuranceProvider">
                  Insurance: {{ selectedInvoice.insuranceProvider }}
                </div>
              </div>
              <div>
                <span class="lbl">Attending Physician:</span>
                <strong>{{ selectedInvoice.doctorName || 'Hospital General' }}</strong>
              </div>
              <div class="text-right">
                <div><span class="lbl">Invoice Number:</span> <strong class="text-blue">{{ selectedInvoice.id }}</strong></div>
                <div><span class="lbl">Issue Date:</span> {{ selectedInvoice.issueDate }}</div>
                <div><span class="lbl">Due Date:</span> {{ selectedInvoice.dueDate }}</div>
              </div>
            </div>

            <!-- Itemized Table -->
            <table class="invoice-items-table">
              <thead>
                <tr>
                  <th>Description / Clinical Service Category</th>
                  <th class="text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngIf="selectedInvoice.consultationFee > 0">
                  <td>
                    <strong>Doctor Consultation & Clinical Evaluation</strong>
                    <div class="text-xs text-muted">Specialist doctor outpatient consultation fee</div>
                  </td>
                  <td class="text-right">₹{{ selectedInvoice.consultationFee | number:'1.2-2' }}</td>
                </tr>
                <tr *ngIf="selectedInvoice.treatmentCharges > 0">
                  <td>
                    <strong>Treatment, Nursing & Clinical Procedures</strong>
                    <div class="text-xs text-muted">Minor interventions, sterilization, nursing care</div>
                  </td>
                  <td class="text-right">₹{{ selectedInvoice.treatmentCharges | number:'1.2-2' }}</td>
                </tr>
                <tr *ngIf="selectedInvoice.labCharges > 0">
                  <td>
                    <strong>Laboratory, Diagnostics & Imaging Tests</strong>
                    <div class="text-xs text-muted">Pathology, radiology, and biochemistry investigations</div>
                  </td>
                  <td class="text-right">₹{{ selectedInvoice.labCharges | number:'1.2-2' }}</td>
                </tr>
                <tr *ngIf="selectedInvoice.pharmacyCharges > 0">
                  <td>
                    <strong>Hospital Pharmacy & Dispensed Medications</strong>
                    <div class="text-xs text-muted">Prescribed therapeutic medicines and consumables</div>
                  </td>
                  <td class="text-right">₹{{ selectedInvoice.pharmacyCharges | number:'1.2-2' }}</td>
                </tr>
                <tr *ngIf="selectedInvoice.roomCharges > 0">
                  <td>
                    <strong>Room, Ward & Inpatient Day Charges</strong>
                    <div class="text-xs text-muted">Recovery suite / observation bed allocation</div>
                  </td>
                  <td class="text-right">₹{{ selectedInvoice.roomCharges | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Financial Summary -->
            <div class="invoice-summary-grid">
              <div class="payment-notes">
                <p><strong>Payment Status:</strong> {{ selectedInvoice.paymentStatus }}</p>
                <p *ngIf="selectedInvoice.paymentMethod"><strong>Payment Mode:</strong> {{ selectedInvoice.paymentMethod }}</p>
                <p class="text-muted text-xs mt-1" *ngIf="selectedInvoice.notes">Note: {{ selectedInvoice.notes }}</p>
              </div>

              <div class="totals-table">
                <div class="t-row">
                  <span>Subtotal:</span>
                  <strong>₹{{ selectedInvoice.subtotal | number:'1.2-2' }}</strong>
                </div>
                <div class="t-row">
                  <span>Hospital Surcharge / Tax ({{ selectedInvoice.taxPercent }}%):</span>
                  <strong>₹{{ selectedInvoice.taxAmount | number:'1.2-2' }}</strong>
                </div>
                <div class="t-row text-danger" *ngIf="selectedInvoice.discount > 0">
                  <span>Institutional Discount:</span>
                  <strong>- ₹{{ selectedInvoice.discount | number:'1.2-2' }}</strong>
                </div>
                <div class="t-row grand-row">
                  <span>Total Payable:</span>
                  <strong class="grand-val">₹{{ selectedInvoice.totalAmount | number:'1.2-2' }}</strong>
                </div>
              </div>
            </div>

            <!-- Footer terms -->
            <div class="invoice-footer-terms">
              <div class="terms-text">
                <p>Thank you for choosing Praveen Clinic. All payments are subject to hospital accounting rules.</p>
                <p>For billing inquiries, contact billing&#64;praveenclinic.in or +91 98400 12345.</p>
              </div>
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="doc-sig-name">Authorized Cashier / Finance</div>
              </div>
            </div>
          </div>

          <div class="modal-footer no-print">
            <button class="btn btn-secondary" (click)="selectedInvoice = null">Close</button>
            <button class="btn btn-primary" (click)="printInvoice()">
              <i class="fa-solid fa-print"></i> Print Official Invoice
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal-overlay" *ngIf="billToDelete" (click)="billToDelete = null">
        <div class="modal-content modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Delete Invoice</h3>
            <button class="btn-icon" (click)="billToDelete = null"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <p>Delete invoice <strong>{{ billToDelete.id }}</strong> for {{ billToDelete.patientName }}?</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="billToDelete = null">Cancel</button>
            <button class="btn btn-danger" (click)="confirmDelete()">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .billing-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .billing-kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .kpi-box {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: var(--shadow-sm);
    }
    .kpi-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .icon-emerald { background: #d1fae5; color: #059669; }
    .icon-amber { background: #fef3c7; color: #d97706; }
    .icon-blue { background: #dbeafe; color: #2563eb; }
    .kpi-data {
      display: flex;
      flex-direction: column;
    }
    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .kpi-val {
      font-size: 1.45rem;
      font-weight: 800;
      color: var(--text-main);
    }
    .page-action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .search-filter-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      flex: 1;
      max-width: 600px;
    }
    .search-box {
      position: relative;
      flex: 1;
      min-width: 260px;
    }
    .search-box i {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-subtle);
    }
    .search-input {
      padding-left: 2.5rem;
      padding-right: 2rem;
    }
    .clear-search {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-subtle);
    }
    .select-filter {
      width: auto;
      min-width: 170px;
    }
    .total-amount-cell {
      font-size: 0.95rem;
      color: var(--text-main);
    }
    .actions-wrapper {
      display: inline-flex;
      gap: 0.35rem;
    }
    .font-semibold { font-weight: 600; }
    .text-xs { font-size: 0.725rem; }
    .text-emerald { color: #10b981; }
    .text-amber { color: #f59e0b; }
    .text-blue { color: #2563eb; }
    .text-danger { color: #ef4444; }
    .text-right { text-align: right; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-3 { margin-top: 0.75rem; }

    .section-divider {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--primary-600);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.5rem 0;
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 0.75rem;
    }
    .bill-calculation-preview {
      background: var(--bg-card-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.85rem;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      color: var(--text-main);
    }
    .net-total-row {
      border-top: 1px dashed var(--border-color);
      padding-top: 0.5rem;
      margin-top: 0.25rem;
      font-weight: 700;
      font-size: 1rem;
    }
    .grand-total-val {
      color: var(--primary-600);
      font-size: 1.15rem;
    }

    /* Printable invoice styles */
    .invoice-print-sheet {
      background: #ffffff;
      color: #0f172a;
      padding: 2.25rem;
      font-family: var(--font-sans);
    }
    .invoice-letterhead {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .brand-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .logo-circle {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #2563eb;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .hospital-name {
      font-size: 1.15rem;
      font-weight: 800;
      color: #1e3a8a;
    }
    .hospital-sub { font-size: 0.8rem; color: #475569; }
    .hospital-contact { font-size: 0.75rem; color: #64748b; }
    .invoice-status-stamp {
      font-size: 1.25rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border: 3px solid #f59e0b;
      color: #f59e0b;
      padding: 0.35rem 1rem;
      border-radius: 6px;
      transform: rotate(-5deg);
    }
    .stamp-paid {
      border-color: #10b981;
      color: #10b981;
    }
    .invoice-details-grid {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      font-size: 0.85rem;
    }
    .lbl { color: #64748b; margin-right: 0.35rem; }
    .invoice-items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }
    .invoice-items-table th {
      background: #f1f5f9;
      padding: 0.65rem 0.875rem;
      text-align: left;
      border-bottom: 2px solid #cbd5e1;
      font-size: 0.775rem;
      text-transform: uppercase;
    }
    .invoice-items-table td {
      padding: 0.875rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .invoice-summary-grid {
      display: flex;
      justify-content: space-between;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    .payment-notes {
      flex: 1;
      font-size: 0.825rem;
      background: #f8fafc;
      padding: 0.875rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .totals-table {
      width: 280px;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.85rem;
    }
    .t-row {
      display: flex;
      justify-content: space-between;
    }
    .grand-row {
      border-top: 2px solid #0f172a;
      padding-top: 0.5rem;
      font-size: 1.05rem;
      font-weight: 800;
    }
    .grand-val {
      color: #2563eb;
    }
    .invoice-footer-terms {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #e2e8f0;
      padding-top: 1.25rem;
    }
    .terms-text {
      font-size: 0.75rem;
      color: #64748b;
      max-width: 440px;
    }
    .sig-box {
      width: 180px;
      text-align: center;
    }
    .sig-line {
      border-bottom: 1px solid #0f172a;
      margin-bottom: 0.4rem;
    }
    .doc-sig-name {
      font-size: 0.75rem;
      font-weight: 700;
    }
    .empty-table-cell {
      padding: 3rem 1rem !important;
      text-align: center;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
    }
    .empty-state i {
      font-size: 2.2rem;
      color: var(--text-subtle);
    }
  `]
})
export class BillingComponent {
  public readonly dataService = inject(HospitalDataService);
  private readonly toastService = inject(ToastService);

  public searchQuery = '';
  public selectedStatus = 'ALL';

  public showFormModal = false;
  public isEditing = false;
  public selectedInvoice: Bill | null = null;
  public billToDelete: Bill | null = null;

  public formData: any = this.getEmptyBill();

  private getEmptyBill() {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    return {
      patientId: '',
      patientName: '',
      doctorId: '',
      doctorName: '',
      issueDate: today,
      dueDate: dueDate.toISOString().split('T')[0],
      consultationFee: 100,
      treatmentCharges: 0,
      labCharges: 0,
      pharmacyCharges: 0,
      roomCharges: 0,
      taxPercent: 5,
      discount: 0,
      paymentStatus: 'Paid',
      paymentMethod: 'Credit Card',
      insuranceProvider: '',
      notes: ''
    };
  }

  filteredBills(): Bill[] {
    return this.dataService.bills().filter(b => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        b.patientName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (b.doctorName && b.doctorName.toLowerCase().includes(q));

      const matchesStatus = this.selectedStatus === 'ALL' || b.paymentStatus === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  onPatientSelected(): void {
    const p = this.dataService.getPatientById(this.formData.patientId);
    if (p) {
      this.formData.patientName = p.name;
    }
  }

  onDoctorSelected(): void {
    const d = this.dataService.getDoctorById(this.formData.doctorId);
    if (d) {
      this.formData.doctorName = d.name;
      this.formData.consultationFee = d.consultationFee;
    } else {
      this.formData.doctorName = '';
    }
  }

  computeSubtotal(): number {
    return (Number(this.formData.consultationFee) || 0) +
           (Number(this.formData.treatmentCharges) || 0) +
           (Number(this.formData.labCharges) || 0) +
           (Number(this.formData.pharmacyCharges) || 0) +
           (Number(this.formData.roomCharges) || 0);
  }

  computeTax(): number {
    const sub = this.computeSubtotal();
    const rate = Number(this.formData.taxPercent) || 5;
    return Math.round((sub * (rate / 100)) * 100) / 100;
  }

  computeTotal(): number {
    const sub = this.computeSubtotal();
    const tax = this.computeTax();
    const disc = Number(this.formData.discount) || 0;
    return Math.max(0, Math.round((sub + tax - disc) * 100) / 100);
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.formData = this.getEmptyBill();
    if (this.dataService.patients().length > 0) {
      this.formData.patientId = this.dataService.patients()[0].id;
      this.formData.patientName = this.dataService.patients()[0].name;
    }
    if (this.dataService.doctors().length > 0) {
      this.formData.doctorId = this.dataService.doctors()[0].id;
      this.formData.doctorName = this.dataService.doctors()[0].name;
      this.formData.consultationFee = this.dataService.doctors()[0].consultationFee;
    }
    this.showFormModal = true;
  }

  openEditModal(bill: Bill): void {
    this.isEditing = true;
    this.formData = { ...bill };
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
  }

  saveBill(): void {
    if (this.isEditing) {
      this.dataService.updateBill(this.formData as Bill);
      this.toastService.success('Invoice Updated', `Bill ${this.formData.id} has been recalculated.`);
    } else {
      const created = this.dataService.addBill(this.formData);
      this.toastService.success('Invoice Generated', `Issued ${created.id} for ${created.patientName} (₹${created.totalAmount}).`);
    }
    this.closeFormModal();
  }

  markPaid(bill: Bill): void {
    this.dataService.markBillPaid(bill.id, 'Credit Card');
    this.toastService.success('Payment Settled', `Invoice ${bill.id} marked as Paid in full.`);
  }

  viewInvoice(bill: Bill): void {
    this.selectedInvoice = bill;
  }

  printInvoice(): void {
    window.print();
  }

  openDeleteConfirm(bill: Bill): void {
    this.billToDelete = bill;
  }

  confirmDelete(): void {
    if (this.billToDelete) {
      this.dataService.deleteBill(this.billToDelete.id);
      this.toastService.warning('Invoice Deleted', `Bill ${this.billToDelete.id} removed.`);
      this.billToDelete = null;
    }
  }
}
