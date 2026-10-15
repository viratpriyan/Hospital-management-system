import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalDataService } from '../../services/hospital-data.service';
import { ToastService } from '../../services/toast.service';
import { Patient, MedicalRecord, Appointment, Bill } from '../../models/hospital.models';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="patients-page">
      <!-- Top Action Bar -->
      <div class="page-action-bar">
        <div class="search-filter-group">
          <!-- Search input -->
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input 
              type="text" 
              placeholder="Search by Patient Name, ID, Phone..." 
              [(ngModel)]="searchQuery" 
              class="form-control search-input"
            />
            <button *ngIf="searchQuery" class="clear-search" (click)="searchQuery = ''">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Gender Filter -->
          <select [(ngModel)]="selectedGender" class="form-control select-filter">
            <option value="ALL">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <!-- Blood Group Filter -->
          <select [(ngModel)]="selectedBloodGroup" class="form-control select-filter">
            <option value="ALL">All Blood Groups</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>

        <div class="action-buttons-group">
          <button class="btn btn-secondary" (click)="exportToCSV()" title="Export Patient Directory">
            <i class="fa-solid fa-file-csv"></i> Export CSV
          </button>
          <button class="btn btn-primary" (click)="openRegisterModal()">
            <i class="fa-solid fa-user-plus"></i> Register Patient
          </button>
        </div>
      </div>

      <!-- Patients Data Table -->
      <div class="hms-card">
        <div class="table-responsive">
          <table class="hms-table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Patient Name</th>
                <th>Age / Gender</th>
                <th>Contact</th>
                <th>Blood Group</th>
                <th>Address</th>
                <th>Registered</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let patient of filteredPatients()">
                <td>
                  <span class="patient-id-badge">{{ patient.id }}</span>
                </td>
                <td>
                  <div class="patient-cell-profile">
                    <div class="patient-avatar" [ngClass]="patient.gender === 'Female' ? 'avatar-female' : 'avatar-male'">
                      {{ getInitials(patient.name) }}
                    </div>
                    <div class="patient-meta">
                      <strong class="patient-name-link" (click)="openProfileModal(patient)">
                        {{ patient.name }}
                      </strong>
                      <span class="patient-email">{{ patient.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="age-gender">
                    <span>{{ patient.age }} yrs</span>
                    <span class="gender-pill">{{ patient.gender }}</span>
                  </div>
                </td>
                <td>
                  <div class="contact-details">
                    <span><i class="fa-solid fa-phone text-subtle"></i> {{ patient.phone }}</span>
                  </div>
                </td>
                <td>
                  <span class="blood-badge">{{ patient.bloodGroup }}</span>
                </td>
                <td>
                  <span class="address-text" [title]="patient.address">{{ patient.address }}</span>
                </td>
                <td>
                  <span class="date-text">{{ patient.registeredDate }}</span>
                </td>
                <td style="text-align: right;">
                  <div class="actions-wrapper">
                    <button class="btn-icon" (click)="openProfileModal(patient)" title="View Medical Profile">
                      <i class="fa-regular fa-eye"></i>
                    </button>
                    <button class="btn-icon" (click)="openEditModal(patient)" title="Edit Patient Details">
                      <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon btn-icon-danger" (click)="openDeleteConfirm(patient)" title="Delete Patient">
                      <i class="fa-regular fa-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredPatients().length === 0">
                <td colspan="8" class="empty-table-cell">
                  <div class="empty-state">
                    <i class="fa-solid fa-user-slash"></i>
                    <h4>No patients match your search criteria</h4>
                    <p>Try clearing filters or register a new patient.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL 1: REGISTER / EDIT PATIENT -->
      <!-- ========================================== -->
      <div class="modal-overlay" *ngIf="showFormModal" (click)="closeFormModal()">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>
              <i class="fa-solid" [ngClass]="isEditing ? 'fa-user-pen text-blue' : 'fa-user-plus text-blue'"></i>
              {{ isEditing ? 'Edit Patient Details' : 'Register New Patient' }}
            </h3>
            <button class="btn-icon" (click)="closeFormModal()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form (ngSubmit)="savePatient()" #patientForm="ngForm">
            <div class="modal-body">
              <div class="grid grid-cols-2 gap-4">
                <!-- Full Name -->
                <div class="form-group">
                  <label class="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    [(ngModel)]="formData.name" 
                    required 
                    placeholder="e.g. John Doe" 
                    class="form-control"
                    #nameCtrl="ngModel"
                    [class.is-invalid]="nameCtrl.invalid && nameCtrl.touched"
                  />
                  <div class="invalid-feedback" *ngIf="nameCtrl.invalid && nameCtrl.touched">
                    Patient full name is required.
                  </div>
                </div>

                <!-- Age -->
                <div class="form-group">
                  <label class="form-label">Age (Years) *</label>
                  <input 
                    type="number" 
                    name="age" 
                    [(ngModel)]="formData.age" 
                    required 
                    min="1" 
                    max="125" 
                    placeholder="e.g. 35" 
                    class="form-control"
                    #ageCtrl="ngModel"
                    [class.is-invalid]="ageCtrl.invalid && ageCtrl.touched"
                  />
                  <div class="invalid-feedback" *ngIf="ageCtrl.invalid && ageCtrl.touched">
                    Please provide a valid age (1-125).
                  </div>
                </div>

                <!-- Gender -->
                <div class="form-group">
                  <label class="form-label">Gender *</label>
                  <select name="gender" [(ngModel)]="formData.gender" required class="form-control">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <!-- Blood Group -->
                <div class="form-group">
                  <label class="form-label">Blood Group *</label>
                  <select name="bloodGroup" [(ngModel)]="formData.bloodGroup" required class="form-control">
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <!-- Phone -->
                <div class="form-group">
                  <label class="form-label">Contact Number *</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    [(ngModel)]="formData.phone" 
                    required 
                    placeholder="e.g. +91 98765 43210" 
                    class="form-control"
                    #phoneCtrl="ngModel"
                    [class.is-invalid]="phoneCtrl.invalid && phoneCtrl.touched"
                  />
                  <div class="invalid-feedback" *ngIf="phoneCtrl.invalid && phoneCtrl.touched">
                    Valid contact number is required.
                  </div>
                </div>

                <!-- Email -->
                <div class="form-group">
                  <label class="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    name="email" 
                    [(ngModel)]="formData.email" 
                    required 
                    placeholder="patient@gmail.com" 
                    class="form-control"
                    #emailCtrl="ngModel"
                    [class.is-invalid]="emailCtrl.invalid && emailCtrl.touched"
                  />
                  <div class="invalid-feedback" *ngIf="emailCtrl.invalid && emailCtrl.touched">
                    Valid email address is required.
                  </div>
                </div>

                <!-- Address -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Residential Address (with City & State) *</label>
                  <input 
                    type="text" 
                    name="address" 
                    [(ngModel)]="formData.address" 
                    required 
                    placeholder="e.g. No. 45, Anna Nagar, Chennai, Tamil Nadu - 600040" 
                    class="form-control"
                    #addrCtrl="ngModel"
                    [class.is-invalid]="addrCtrl.invalid && addrCtrl.touched"
                  />
                  <div class="invalid-feedback" *ngIf="addrCtrl.invalid && addrCtrl.touched">
                    Address is required.
                  </div>
                </div>

                <!-- Emergency Contact -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Emergency Contact Person & Phone *</label>
                  <input 
                    type="text" 
                    name="emergencyContact" 
                    [(ngModel)]="formData.emergencyContact" 
                    required 
                    placeholder="e.g. Pooja Sharma (Spouse) - +91 98765 11223" 
                    class="form-control"
                  />
                </div>

                <!-- Allergies -->
                <div class="form-group">
                  <label class="form-label">Known Allergies (Optional)</label>
                  <input 
                    type="text" 
                    name="allergies" 
                    [(ngModel)]="formData.allergies" 
                    placeholder="e.g. Penicillin, Peanuts (or 'None')" 
                    class="form-control"
                  />
                </div>

                <!-- Pre-existing conditions -->
                <div class="form-group">
                  <label class="form-label">Pre-existing Medical Conditions</label>
                  <input 
                    type="text" 
                    name="medicalConditions" 
                    [(ngModel)]="formData.medicalConditions" 
                    placeholder="e.g. Hypertension, Asthma" 
                    class="form-control"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeFormModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="patientForm.invalid">
                <i class="fa-solid fa-check"></i>
                {{ isEditing ? 'Update Patient' : 'Save & Register' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL 2: PATIENT FULL CLINICAL PROFILE -->
      <!-- ========================================== -->
      <div class="modal-overlay" *ngIf="selectedProfile" (click)="selectedProfile = null">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="profile-header-summary">
              <div class="patient-avatar avatar-large">
                {{ getInitials(selectedProfile.name) }}
              </div>
              <div>
                <h3>{{ selectedProfile.name }}</h3>
                <span class="patient-id-badge">{{ selectedProfile.id }}</span>
                <span class="blood-badge ml-2">{{ selectedProfile.bloodGroup }}</span>
              </div>
            </div>
            <button class="btn-icon" (click)="selectedProfile = null">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="modal-body profile-tabs-body">
            <!-- Details Grid -->
            <div class="details-section">
              <h4 class="section-title">Personal & Contact Information</h4>
              <div class="grid grid-cols-3 gap-3 info-box">
                <div>
                  <label>Age & Gender</label>
                  <strong>{{ selectedProfile.age }} yrs, {{ selectedProfile.gender }}</strong>
                </div>
                <div>
                  <label>Phone Number</label>
                  <strong>{{ selectedProfile.phone }}</strong>
                </div>
                <div>
                  <label>Email</label>
                  <strong>{{ selectedProfile.email }}</strong>
                </div>
                <div style="grid-column: span 2;">
                  <label>Address</label>
                  <strong>{{ selectedProfile.address }}</strong>
                </div>
                <div>
                  <label>Registered Date</label>
                  <strong>{{ selectedProfile.registeredDate }}</strong>
                </div>
              </div>

              <h4 class="section-title mt-4">Clinical Profile</h4>
              <div class="grid grid-cols-3 gap-3 info-box">
                <div>
                  <label>Emergency Contact</label>
                  <strong>{{ selectedProfile.emergencyContact }}</strong>
                </div>
                <div>
                  <label>Known Allergies</label>
                  <strong class="text-danger">{{ selectedProfile.allergies || 'None documented' }}</strong>
                </div>
                <div>
                  <label>Pre-existing Conditions</label>
                  <strong>{{ selectedProfile.medicalConditions || 'None documented' }}</strong>
                </div>
              </div>

              <!-- Medical Records Associated -->
              <h4 class="section-title mt-4">
                Clinical Visit History ({{ getPatientRecords(selectedProfile.id).length }})
              </h4>
              <div class="patient-records-list" *ngIf="getPatientRecords(selectedProfile.id).length > 0; else noRecs">
                <div *ngFor="let rec of getPatientRecords(selectedProfile.id)" class="record-card-sub">
                  <div class="flex justify-between items-center mb-1">
                    <strong class="text-blue">{{ rec.diagnosis }}</strong>
                    <span class="date-text">{{ rec.date }} • {{ rec.doctorName }}</span>
                  </div>
                  <p class="rec-notes"><strong>Treatment:</strong> {{ rec.treatmentNotes }}</p>
                  <div class="vitals-pill-row">
                    <span>BP: {{ rec.vitals.bloodPressure }}</span>
                    <span>HR: {{ rec.vitals.heartRate }} bpm</span>
                    <span>Temp: {{ rec.vitals.temperature }}°F</span>
                    <span>Wt: {{ rec.vitals.weight }} kg</span>
                  </div>
                </div>
              </div>
              <ng-template #noRecs>
                <div class="empty-sub">No medical records filed yet for this patient.</div>
              </ng-template>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedProfile = null">Close</button>
            <button class="btn btn-primary" (click)="openEditModal(selectedProfile); selectedProfile = null">
              <i class="fa-regular fa-pen-to-square"></i> Edit Patient
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL 3: DELETE CONFIRMATION -->
      <!-- ========================================== -->
      <div class="modal-overlay" *ngIf="patientToDelete" (click)="patientToDelete = null">
        <div class="modal-content modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="text-danger">
              <i class="fa-solid fa-triangle-exclamation"></i> Confirm Delete
            </h3>
            <button class="btn-icon" (click)="patientToDelete = null">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <p>
              Are you sure you want to permanently delete patient 
              <strong>{{ patientToDelete.name }}</strong> ({{ patientToDelete.id }})?
            </p>
            <p class="text-muted text-sm mt-2">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="patientToDelete = null">Cancel</button>
            <button class="btn btn-danger" (click)="confirmDelete()">
              <i class="fa-solid fa-trash-can"></i> Delete Patient
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .patients-page {
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
      flex-wrap: wrap;
      flex: 1;
      max-width: 800px;
    }
    .search-box {
      position: relative;
      flex: 1;
      min-width: 250px;
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
      min-width: 150px;
    }
    .action-buttons-group {
      display: flex;
      gap: 0.75rem;
    }
    .patient-id-badge {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.75rem;
      background: var(--bg-card-subtle);
      color: var(--primary-600);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      display: inline-block;
    }
    .patient-cell-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .patient-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
      color: #ffffff;
    }
    .avatar-female {
      background: linear-gradient(135deg, #ec4899, #be185d);
    }
    .avatar-male {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    }
    .avatar-large {
      width: 52px;
      height: 52px;
      font-size: 1.15rem;
      background: linear-gradient(135deg, #0284c7, #2563eb);
    }
    .patient-meta {
      display: flex;
      flex-direction: column;
    }
    .patient-name-link {
      color: var(--text-main);
      cursor: pointer;
      transition: color 0.15s;
    }
    .patient-name-link:hover {
      color: var(--primary-600);
      text-decoration: underline;
    }
    .patient-email {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .age-gender {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .gender-pill {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .blood-badge {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.75rem;
      background: #fee2e2;
      color: #b91c1c;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      border: 1px solid #fecaca;
    }
    .address-text {
      max-width: 180px;
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
    .date-text {
      font-size: 0.8125rem;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .actions-wrapper {
      display: inline-flex;
      gap: 0.35rem;
    }
    .profile-header-summary {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .ml-2 { margin-left: 0.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .text-sm { font-size: 0.85rem; }
    .text-danger { color: #ef4444; }
    .text-subtle { color: var(--text-subtle); }
    .section-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-light);
      padding-bottom: 0.25rem;
    }
    .info-box {
      background: var(--bg-card-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.875rem;
      font-size: 0.8125rem;
    }
    .info-box label {
      display: block;
      color: var(--text-muted);
      font-size: 0.7rem;
      margin-bottom: 0.15rem;
    }
    .record-card-sub {
      background: var(--bg-card-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .rec-notes {
      font-size: 0.8rem;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }
    .vitals-pill-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .vitals-pill-row span {
      font-size: 0.7rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      padding: 0.15rem 0.4rem;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
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
    .empty-sub {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-style: italic;
      padding: 0.5rem 0;
    }
  `]
})
export class PatientsComponent {
  public readonly dataService = inject(HospitalDataService);
  private readonly toastService = inject(ToastService);

  public searchQuery = '';
  public selectedGender = 'ALL';
  public selectedBloodGroup = 'ALL';

  // Modals state
  public showFormModal = false;
  public isEditing = false;
  public selectedProfile: Patient | null = null;
  public patientToDelete: Patient | null = null;

  public formData: any = this.getEmptyFormData();

  private getEmptyFormData() {
    return {
      name: '',
      age: null,
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '',
      email: '',
      address: '',
      emergencyContact: '',
      allergies: '',
      medicalConditions: ''
    };
  }

  filteredPatients(): Patient[] {
    return this.dataService.patients().filter(p => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.id.toLowerCase().includes(q) || 
        p.phone.includes(q);

      const matchesGender = this.selectedGender === 'ALL' || p.gender === this.selectedGender;
      const matchesBlood = this.selectedBloodGroup === 'ALL' || p.bloodGroup === this.selectedBloodGroup;

      return matchesSearch && matchesGender && matchesBlood;
    });
  }

  getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getPatientRecords(patientId: string): MedicalRecord[] {
    return this.dataService.getRecordsByPatient(patientId);
  }

  openRegisterModal(): void {
    this.isEditing = false;
    this.formData = this.getEmptyFormData();
    this.showFormModal = true;
  }

  openEditModal(patient: Patient): void {
    this.isEditing = true;
    this.formData = { ...patient };
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
  }

  savePatient(): void {
    if (this.isEditing) {
      this.dataService.updatePatient(this.formData as Patient);
      this.toastService.success('Patient Updated', `Record for ${this.formData.name} was successfully updated.`);
    } else {
      const created = this.dataService.addPatient(this.formData);
      this.toastService.success('Patient Registered', `Assigned ID ${created.id} to ${created.name}.`);
    }
    this.closeFormModal();
  }

  openProfileModal(patient: Patient): void {
    this.selectedProfile = patient;
  }

  openDeleteConfirm(patient: Patient): void {
    this.patientToDelete = patient;
  }

  confirmDelete(): void {
    if (this.patientToDelete) {
      const name = this.patientToDelete.name;
      this.dataService.deletePatient(this.patientToDelete.id);
      this.toastService.warning('Patient Deleted', `Patient ${name} removed from registry.`);
      this.patientToDelete = null;
    }
  }

  exportToCSV(): void {
    const list = this.filteredPatients();
    if (list.length === 0) {
      this.toastService.warning('Export', 'No patient records to export.');
      return;
    }

    const headers = ['ID', 'Name', 'Age', 'Gender', 'Phone', 'Email', 'Blood Group', 'Address', 'Emergency Contact', 'Registered Date'];
    const rows = list.map(p => [
      p.id,
      `"${p.name}"`,
      p.age,
      p.gender,
      `"${p.phone}"`,
      `"${p.email}"`,
      p.bloodGroup,
      `"${p.address}"`,
      `"${p.emergencyContact}"`,
      p.registeredDate
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Patients_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.info('Export Completed', 'Patient directory downloaded as CSV.');
  }
}
