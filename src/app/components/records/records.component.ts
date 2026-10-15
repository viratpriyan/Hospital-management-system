import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalDataService } from '../../services/hospital-data.service';
import { ToastService } from '../../services/toast.service';
import { MedicalRecord, PrescriptionItem } from '../../models/hospital.models';

@Component({
  selector: 'app-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="records-page">
      <!-- Toolbar -->
      <div class="page-action-bar">
        <div class="search-filter-group">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input 
              type="text" 
              placeholder="Search by Patient Name, Diagnosis, or Record ID..." 
              [(ngModel)]="searchQuery" 
              class="form-control search-input"
            />
            <button *ngIf="searchQuery" class="clear-search" (click)="searchQuery = ''">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <button class="btn btn-primary" (click)="openAddModal()">
          <i class="fa-solid fa-file-circle-plus"></i> New Clinical Record
        </button>
      </div>

      <!-- Records Table -->
      <div class="hms-card">
        <div class="table-responsive">
          <table class="hms-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Patient Details</th>
                <th>Attending Doctor</th>
                <th>Visit Date</th>
                <th>Primary Diagnosis</th>
                <th>Patient Vitals</th>
                <th>Prescription Items</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let rec of filteredRecords()">
                <td>
                  <span class="patient-id-badge">{{ rec.id }}</span>
                </td>
                <td>
                  <strong>{{ rec.patientName }}</strong>
                  <div class="text-xs text-muted">{{ rec.patientId }}</div>
                </td>
                <td>
                  <div class="font-semibold">{{ rec.doctorName }}</div>
                </td>
                <td>
                  <span class="date-text">{{ rec.date }}</span>
                </td>
                <td>
                  <strong class="text-blue">{{ rec.diagnosis }}</strong>
                  <div class="text-xs text-muted" [title]="rec.symptoms">
                    {{ rec.symptoms | slice:0:45 }}{{ rec.symptoms.length > 45 ? '...' : '' }}
                  </div>
                </td>
                <td>
                  <div class="vitals-micro-badges">
                    <span class="vital-badge" title="Blood Pressure">BP: {{ rec.vitals.bloodPressure }}</span>
                    <span class="vital-badge" title="Heart Rate">HR: {{ rec.vitals.heartRate }} bpm</span>
                    <span class="vital-badge" title="SpO2">SpO2: {{ rec.vitals.spo2 || 98 }}%</span>
                  </div>
                </td>
                <td>
                  <span class="badge badge-info">
                    <i class="fa-solid fa-pills"></i> {{ rec.prescriptions.length }} Meds
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="actions-wrapper">
                    <button class="btn-icon" (click)="viewClinicalChart(rec)" title="View & Print Clinical Chart">
                      <i class="fa-solid fa-print"></i>
                    </button>
                    <button class="btn-icon" (click)="openEditModal(rec)" title="Edit Record">
                      <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon btn-icon-danger" (click)="openDeleteConfirm(rec)" title="Delete Record">
                      <i class="fa-regular fa-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredRecords().length === 0">
                <td colspan="8" class="empty-table-cell">
                  <div class="empty-state">
                    <i class="fa-solid fa-file-medical"></i>
                    <h4>No clinical records found</h4>
                    <p>Create a new record after consulting a patient.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL 1: ADD / EDIT CLINICAL RECORD -->
      <!-- ========================================== -->
      <div class="modal-overlay" *ngIf="showFormModal" (click)="closeFormModal()">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>
              <i class="fa-solid fa-notes-medical text-blue"></i>
              {{ isEditing ? 'Edit Clinical Record' : 'Create Clinical Patient Record' }}
            </h3>
            <button class="btn-icon" (click)="closeFormModal()"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <form (ngSubmit)="saveRecord()" #recordForm="ngForm">
            <div class="modal-body">
              <!-- Basic Info -->
              <div class="grid grid-cols-3 gap-3 mb-3">
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
                  <label class="form-label">Consulting Doctor *</label>
                  <select 
                    name="doctorId" 
                    [(ngModel)]="formData.doctorId" 
                    (change)="onDoctorSelected()" 
                    required 
                    class="form-control"
                  >
                    <option value="" disabled>-- Select Doctor --</option>
                    <option *ngFor="let d of dataService.doctors()" [value]="d.id">
                      {{ d.name }} ({{ d.department }})
                    </option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Visit Date *</label>
                  <input type="date" name="date" [(ngModel)]="formData.date" required class="form-control" />
                </div>
              </div>

              <!-- Vitals Row -->
              <div class="section-divider">
                <span>PATIENT VITALS & MEASUREMENTS</span>
              </div>
              <div class="grid grid-cols-4 gap-3 mb-3">
                <div class="form-group">
                  <label class="form-label">Blood Pressure *</label>
                  <input 
                    type="text" 
                    name="bp" 
                    [(ngModel)]="formData.vitals.bloodPressure" 
                    placeholder="120/80 mmHg" 
                    required 
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Heart Rate (bpm) *</label>
                  <input 
                    type="number" 
                    name="hr" 
                    [(ngModel)]="formData.vitals.heartRate" 
                    required 
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Temperature (°F) *</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="temp" 
                    [(ngModel)]="formData.vitals.temperature" 
                    required 
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Weight (kg) *</label>
                  <input 
                    type="number" 
                    name="weight" 
                    [(ngModel)]="formData.vitals.weight" 
                    required 
                    class="form-control"
                  />
                </div>
              </div>

              <!-- Symptoms & Diagnosis -->
              <div class="section-divider">
                <span>ASSESSMENT & DIAGNOSIS</span>
              </div>
              <div class="form-group">
                <label class="form-label">Chief Complaint & Presenting Symptoms *</label>
                <textarea 
                  name="symptoms" 
                  [(ngModel)]="formData.symptoms" 
                  rows="2" 
                  required 
                  placeholder="Describe reported symptoms, onset, and duration..." 
                  class="form-control"
                ></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Primary Clinical Diagnosis *</label>
                <input 
                  type="text" 
                  name="diagnosis" 
                  [(ngModel)]="formData.diagnosis" 
                  required 
                  placeholder="e.g. Type 2 Diabetes Mellitus with Peripheral Neuropathy" 
                  class="form-control"
                />
              </div>

              <!-- Prescriptions Builder -->
              <div class="section-divider flex justify-between items-center">
                <span>RX - MEDICATIONS & PRESCRIPTIONS</span>
                <button type="button" class="btn btn-secondary btn-sm" (click)="addPrescriptionRow()">
                  <i class="fa-solid fa-plus"></i> Add Medicine
                </button>
              </div>

              <div class="prescriptions-list mb-3">
                <div *ngFor="let item of formData.prescriptions; let i = index" class="rx-row">
                  <input 
                    type="text" 
                    placeholder="Medicine Name (e.g. Amoxicillin 500mg)" 
                    [(ngModel)]="item.medicine" 
                    [name]="'med_' + i" 
                    required 
                    class="form-control flex-2"
                  />
                  <input 
                    type="text" 
                    placeholder="Dosage (1 tab)" 
                    [(ngModel)]="item.dosage" 
                    [name]="'dos_' + i" 
                    class="form-control"
                  />
                  <input 
                    type="text" 
                    placeholder="Frequency (1-0-1 After Food)" 
                    [(ngModel)]="item.frequency" 
                    [name]="'freq_' + i" 
                    class="form-control flex-2"
                  />
                  <input 
                    type="text" 
                    placeholder="Duration (5 Days)" 
                    [(ngModel)]="item.duration" 
                    [name]="'dur_' + i" 
                    class="form-control"
                  />
                  <button 
                    type="button" 
                    class="btn-icon btn-icon-danger" 
                    (click)="removePrescriptionRow(i)" 
                    [disabled]="formData.prescriptions.length <= 1"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>

              <!-- Lab Tests & Treatment Plan -->
              <div class="grid grid-cols-2 gap-3">
                <div class="form-group">
                  <label class="form-label">Ordered Diagnostic / Lab Tests (Comma separated)</label>
                  <input 
                    type="text" 
                    name="labTestsStr" 
                    [(ngModel)]="labTestsString" 
                    placeholder="e.g. CBC, Serum Creatinine, HbA1c" 
                    class="form-control"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Recommended Follow-up Date</label>
                  <input type="date" name="followUpDate" [(ngModel)]="formData.followUpDate" class="form-control" />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Treatment Plan & Lifestyle Advice *</label>
                <textarea 
                  name="treatmentNotes" 
                  [(ngModel)]="formData.treatmentNotes" 
                  rows="2" 
                  required 
                  placeholder="Dietary precautions, rest, exercise, therapy instructions..." 
                  class="form-control"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeFormModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="recordForm.invalid">
                <i class="fa-solid fa-floppy-disk"></i>
                {{ isEditing ? 'Update Medical Record' : 'Save Clinical Record' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL 2: PRINTABLE CLINICAL CHART / RX -->
      <!-- ========================================== -->
      <div class="modal-overlay" *ngIf="selectedChart" (click)="selectedChart = null">
        <div class="modal-content modal-lg print-prescription-wrapper" (click)="$event.stopPropagation()">
          <div class="modal-header no-print">
            <h3><i class="fa-solid fa-file-waveform text-blue"></i> Official Clinical Chart</h3>
            <button class="btn-icon" (click)="selectedChart = null"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <!-- Printable Document Container -->
          <div class="modal-body clinical-print-sheet" id="print-sheet">
            <!-- Header -->
            <div class="hospital-letterhead">
              <div class="brand-left">
                <div class="logo-circle"><i class="fa-solid fa-notes-medical"></i></div>
                <div>
                  <h2 class="hospital-name">PRAVEEN CLINIC & HEALTH CARE</h2>
                  <p class="hospital-sub">Department of Clinical Medicine & Patient Care</p>
                  <p class="hospital-contact">No. 45, Anna Salai, T. Nagar, Chennai - 600017 • Tel: +91 98400 12345</p>
                </div>
              </div>
              <div class="chart-meta">
                <div class="chart-no">RECORD #{{ selectedChart.id }}</div>
                <div class="chart-date">Date: {{ selectedChart.date }}</div>
              </div>
            </div>

            <hr class="chart-divider" />

            <!-- Patient and Doctor Info Row -->
            <div class="chart-patient-grid">
              <div>
                <span class="lbl">Patient Name:</span>
                <strong>{{ selectedChart.patientName }} ({{ selectedChart.patientId }})</strong>
              </div>
              <div>
                <span class="lbl">Attending Physician:</span>
                <strong>{{ selectedChart.doctorName }}</strong>
              </div>
            </div>

            <!-- Vitals Bar -->
            <div class="chart-vitals-strip">
              <div class="v-box"><span>BP:</span> <strong>{{ selectedChart.vitals.bloodPressure }}</strong></div>
              <div class="v-box"><span>Pulse:</span> <strong>{{ selectedChart.vitals.heartRate }} bpm</strong></div>
              <div class="v-box"><span>Temp:</span> <strong>{{ selectedChart.vitals.temperature }} °F</strong></div>
              <div class="v-box"><span>Weight:</span> <strong>{{ selectedChart.vitals.weight }} kg</strong></div>
              <div class="v-box"><span>SpO2:</span> <strong>{{ selectedChart.vitals.spo2 || 98 }}%</strong></div>
            </div>

            <!-- Symptoms & Diagnosis -->
            <div class="chart-section">
              <div class="section-heading">CLINICAL OBSERVATION & DIAGNOSIS</div>
              <div class="content-text">
                <p><strong>Chief Complaint:</strong> {{ selectedChart.symptoms }}</p>
                <p class="mt-1"><strong>Primary Diagnosis:</strong> <span class="highlight-diag">{{ selectedChart.diagnosis }}</span></p>
              </div>
            </div>

            <!-- Prescriptions Rx Table -->
            <div class="chart-section">
              <div class="section-heading flex items-center gap-1">
                <span class="rx-symbol">℞</span> PRESCRIPTION & DOSAGE SCHEDULE
              </div>
              <table class="rx-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medication Name</th>
                    <th>Dosage</th>
                    <th>Frequency / Timing</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let rx of selectedChart.prescriptions; let i = index">
                    <td>{{ i + 1 }}</td>
                    <td><strong>{{ rx.medicine }}</strong></td>
                    <td>{{ rx.dosage }}</td>
                    <td>{{ rx.frequency }}</td>
                    <td>{{ rx.duration }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Lab tests & treatment -->
            <div class="chart-section">
              <div class="section-heading">TREATMENT PLAN & LAB INVESTIGATIONS</div>
              <div class="content-text">
                <p *ngIf="selectedChart.labTests.length > 0">
                  <strong>Recommended Lab Tests:</strong> {{ selectedChart.labTests.join(', ') }}
                </p>
                <p class="mt-1"><strong>Treatment Notes:</strong> {{ selectedChart.treatmentNotes }}</p>
                <p class="mt-1" *ngIf="selectedChart.followUpDate">
                  <strong>Next Review / Follow-up:</strong> {{ selectedChart.followUpDate }}
                </p>
              </div>
            </div>

            <!-- Doctor Signature Area -->
            <div class="chart-signature-area">
              <div class="sig-box">
                <div class="sig-line"></div>
                <div class="doc-sig-name">{{ selectedChart.doctorName }}</div>
                <div class="doc-sig-cred">Authorized Clinical Signature</div>
              </div>
            </div>
          </div>

          <div class="modal-footer no-print">
            <button class="btn btn-secondary" (click)="selectedChart = null">Close</button>
            <button class="btn btn-primary" (click)="printChart()">
              <i class="fa-solid fa-print"></i> Print Clinical Chart
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal-overlay" *ngIf="recordToDelete" (click)="recordToDelete = null">
        <div class="modal-content modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Delete Record</h3>
            <button class="btn-icon" (click)="recordToDelete = null"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <p>Delete clinical record <strong>{{ recordToDelete.id }}</strong> for {{ recordToDelete.patientName }}?</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="recordToDelete = null">Cancel</button>
            <button class="btn btn-danger" (click)="confirmDelete()">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .records-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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
      flex: 1;
      max-width: 600px;
    }
    .search-box {
      position: relative;
      flex: 1;
      min-width: 280px;
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
    .vitals-micro-badges {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .vital-badge {
      font-size: 0.7rem;
      font-family: var(--font-mono);
      background: var(--bg-card-subtle);
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      white-space: nowrap;
    }
    .actions-wrapper {
      display: inline-flex;
      gap: 0.35rem;
    }
    .section-divider {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--primary-600);
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.5rem 0;
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 0.75rem;
      margin-top: 0.5rem;
    }
    .btn-sm {
      padding: 0.35rem 0.75rem;
      font-size: 0.75rem;
    }
    .rx-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .flex-2 { flex: 2; }
    .font-semibold { font-weight: 600; }
    .text-xs { font-size: 0.725rem; }
    .text-blue { color: #2563eb; }
    .text-danger { color: #ef4444; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mt-1 { margin-top: 0.35rem; }

    /* Printable Chart styles */
    .clinical-print-sheet {
      background: #ffffff;
      color: #0f172a;
      padding: 2rem;
      font-family: var(--font-sans);
    }
    .hospital-letterhead {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
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
      letter-spacing: -0.01em;
      color: #1e3a8a;
    }
    .hospital-sub {
      font-size: 0.8rem;
      color: #475569;
    }
    .hospital-contact {
      font-size: 0.75rem;
      color: #64748b;
    }
    .chart-meta {
      text-align: right;
    }
    .chart-no {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.95rem;
      color: #2563eb;
    }
    .chart-date {
      font-size: 0.8rem;
      color: #64748b;
    }
    .chart-divider {
      border: 0;
      height: 2px;
      background: #e2e8f0;
      margin-bottom: 1.25rem;
    }
    .chart-patient-grid {
      display: flex;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 0.875rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
    .lbl {
      color: #64748b;
      margin-right: 0.5rem;
    }
    .chart-vitals-strip {
      display: flex;
      gap: 1rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.65rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.25rem;
      font-size: 0.8rem;
    }
    .v-box span { color: #1e40af; margin-right: 0.25rem; }
    .chart-section {
      margin-bottom: 1.25rem;
    }
    .section-heading {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #1e40af;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 0.25rem;
      margin-bottom: 0.5rem;
    }
    .rx-symbol {
      font-size: 1.2rem;
      font-family: serif;
      font-weight: 900;
      color: #2563eb;
    }
    .content-text {
      font-size: 0.85rem;
      line-height: 1.5;
    }
    .highlight-diag {
      color: #1d4ed8;
      font-weight: 700;
      background: #dbeafe;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .rx-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.825rem;
      margin-top: 0.5rem;
    }
    .rx-table th {
      background: #f1f5f9;
      padding: 0.5rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid #cbd5e1;
    }
    .rx-table td {
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .chart-signature-area {
      display: flex;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 1rem;
    }
    .sig-box {
      width: 220px;
      text-align: center;
    }
    .sig-line {
      border-bottom: 1px solid #0f172a;
      margin-bottom: 0.5rem;
    }
    .doc-sig-name {
      font-weight: 700;
      font-size: 0.875rem;
    }
    .doc-sig-cred {
      font-size: 0.75rem;
      color: #64748b;
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
export class RecordsComponent {
  public readonly dataService = inject(HospitalDataService);
  private readonly toastService = inject(ToastService);

  public searchQuery = '';
  public showFormModal = false;
  public isEditing = false;
  public selectedChart: MedicalRecord | null = null;
  public recordToDelete: MedicalRecord | null = null;

  public labTestsString = '';
  public formData: any = this.getEmptyRecord();

  private getEmptyRecord() {
    const today = new Date().toISOString().split('T')[0];
    return {
      patientId: '',
      patientName: '',
      doctorId: '',
      doctorName: '',
      date: today,
      vitals: {
        bloodPressure: '120/80 mmHg',
        heartRate: 72,
        temperature: 98.6,
        weight: 70,
        spo2: 98
      },
      symptoms: '',
      diagnosis: '',
      prescriptions: [
        { medicine: '', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days' }
      ],
      labTests: [],
      treatmentNotes: '',
      followUpDate: ''
    };
  }

  filteredRecords(): MedicalRecord[] {
    return this.dataService.records().filter(rec => {
      const q = this.searchQuery.toLowerCase().trim();
      return !q ||
        rec.patientName.toLowerCase().includes(q) ||
        rec.diagnosis.toLowerCase().includes(q) ||
        rec.doctorName.toLowerCase().includes(q) ||
        rec.id.toLowerCase().includes(q);
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
    }
  }

  addPrescriptionRow(): void {
    this.formData.prescriptions.push({
      medicine: '',
      dosage: '1 tablet',
      frequency: 'Once daily',
      duration: '7 days'
    });
  }

  removePrescriptionRow(index: number): void {
    if (this.formData.prescriptions.length > 1) {
      this.formData.prescriptions.splice(index, 1);
    }
  }

  openAddModal(): void {
    this.isEditing = false;
    this.formData = this.getEmptyRecord();
    this.labTestsString = '';

    if (this.dataService.patients().length > 0) {
      this.formData.patientId = this.dataService.patients()[0].id;
      this.formData.patientName = this.dataService.patients()[0].name;
    }
    if (this.dataService.doctors().length > 0) {
      this.formData.doctorId = this.dataService.doctors()[0].id;
      this.formData.doctorName = this.dataService.doctors()[0].name;
    }
    this.showFormModal = true;
  }

  openEditModal(rec: MedicalRecord): void {
    this.isEditing = true;
    this.formData = JSON.parse(JSON.stringify(rec));
    this.labTestsString = (rec.labTests || []).join(', ');
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
  }

  saveRecord(): void {
    // Process lab tests
    this.formData.labTests = this.labTestsString
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    // Filter prescriptions that have medicine filled
    this.formData.prescriptions = this.formData.prescriptions.filter(
      (p: PrescriptionItem) => p.medicine.trim().length > 0
    );

    if (this.isEditing) {
      this.dataService.updateRecord(this.formData as MedicalRecord);
      this.toastService.success('Record Updated', `Medical record ${this.formData.id} updated.`);
    } else {
      const created = this.dataService.addRecord(this.formData);
      this.toastService.success('Record Created', `Created clinical record ${created.id} for ${created.patientName}.`);
    }
    this.closeFormModal();
  }

  viewClinicalChart(rec: MedicalRecord): void {
    this.selectedChart = rec;
  }

  printChart(): void {
    window.print();
  }

  openDeleteConfirm(rec: MedicalRecord): void {
    this.recordToDelete = rec;
  }

  confirmDelete(): void {
    if (this.recordToDelete) {
      this.dataService.deleteRecord(this.recordToDelete.id);
      this.toastService.warning('Record Deleted', 'Clinical visit record deleted.');
      this.recordToDelete = null;
    }
  }
}
