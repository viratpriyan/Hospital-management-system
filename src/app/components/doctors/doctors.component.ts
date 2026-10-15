import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalDataService } from '../../services/hospital-data.service';
import { ToastService } from '../../services/toast.service';
import { Doctor } from '../../models/hospital.models';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="doctors-page">
      <!-- Header Controls -->
      <div class="page-action-bar">
        <div class="search-filter-group">
          <!-- Search box -->
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input 
              type="text" 
              placeholder="Search Doctor by name or specialty..." 
              [(ngModel)]="searchQuery" 
              class="form-control search-input"
            />
            <button *ngIf="searchQuery" class="clear-search" (click)="searchQuery = ''">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Department Filter -->
          <select [(ngModel)]="selectedDepartment" class="form-control select-filter">
            <option value="ALL">All Departments</option>
            <option *ngFor="let dept of departments" [value]="dept">{{ dept }}</option>
          </select>
        </div>

        <div class="action-buttons-group">
          <div class="view-toggle">
            <button 
              class="toggle-btn" 
              [class.active]="viewMode === 'grid'" 
              (click)="viewMode = 'grid'" 
              title="Card View"
            >
              <i class="fa-solid fa-border-all"></i>
            </button>
            <button 
              class="toggle-btn" 
              [class.active]="viewMode === 'table'" 
              (click)="viewMode = 'table'" 
              title="Table View"
            >
              <i class="fa-solid fa-list"></i>
            </button>
          </div>
          <button class="btn btn-primary" (click)="openAddModal()">
            <i class="fa-solid fa-user-plus"></i> Add Doctor
          </button>
        </div>
      </div>

      <!-- Department Quick Pills -->
      <div class="dept-pills-bar">
        <button 
          class="dept-pill" 
          [class.active]="selectedDepartment === 'ALL'" 
          (click)="selectedDepartment = 'ALL'"
        >
          All Departments ({{ dataService.doctors().length }})
        </button>
        <button 
          *ngFor="let dept of departments" 
          class="dept-pill" 
          [class.active]="selectedDepartment === dept" 
          (click)="selectedDepartment = dept"
        >
          {{ dept }} ({{ getDeptCount(dept) }})
        </button>
      </div>

      <!-- View 1: Grid Cards -->
      <div class="doctors-grid" *ngIf="viewMode === 'grid'">
        <div *ngFor="let doctor of filteredDoctors()" class="doctor-card">
          <div class="doc-card-header">
            <div class="doc-avatar">
              <i class="fa-solid fa-user-doctor"></i>
            </div>
            <div class="doc-status-col">
              <span 
                class="badge" 
                [ngClass]="{
                  'badge-available': doctor.status === 'Available',
                  'badge-consultation': doctor.status === 'In Consultation',
                  'badge-leave': doctor.status === 'On Leave',
                  'badge-surgery': doctor.status === 'In Surgery'
                }"
              >
                {{ doctor.status }}
              </span>
              <span class="doc-id">{{ doctor.id }}</span>
            </div>
          </div>

          <div class="doc-card-body">
            <h3 class="doc-name">{{ doctor.name }}</h3>
            <span class="doc-specialty">{{ doctor.specialization }}</span>
            <div class="doc-qualification">{{ doctor.qualification }}</div>

            <div class="doc-info-list">
              <div class="doc-info-item">
                <i class="fa-solid fa-building text-blue"></i>
                <span>{{ doctor.department }} • {{ doctor.roomNo }}</span>
              </div>
              <div class="doc-info-item">
                <i class="fa-solid fa-award text-amber"></i>
                <span>{{ doctor.experienceYears }} Years Experience</span>
              </div>
              <div class="doc-info-item">
                <i class="fa-solid fa-money-bill-wave text-emerald"></i>
                <span>Fee: ₹{{ doctor.consultationFee }} / consultation</span>
              </div>
              <div class="doc-info-item">
                <i class="fa-regular fa-calendar-days text-subtle"></i>
                <span>{{ doctor.availableDays.join(', ') }}</span>
              </div>
              <div class="doc-info-item">
                <i class="fa-regular fa-clock text-subtle"></i>
                <span>{{ doctor.availableHours }}</span>
              </div>
            </div>
          </div>

          <div class="doc-card-footer">
            <div class="doc-contact-snippet">
              <i class="fa-solid fa-phone"></i> {{ doctor.phone }}
            </div>
            <div class="doc-actions">
              <button class="btn-icon" (click)="openEditModal(doctor)" title="Edit Doctor Profile">
                <i class="fa-regular fa-pen-to-square"></i>
              </button>
              <button class="btn-icon btn-icon-danger" (click)="openDeleteConfirm(doctor)" title="Remove Doctor">
                <i class="fa-regular fa-trash-can"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- View 2: Table View -->
      <div class="hms-card" *ngIf="viewMode === 'table'">
        <div class="table-responsive">
          <table class="hms-table">
            <thead>
              <tr>
                <th>Doctor ID</th>
                <th>Doctor Profile</th>
                <th>Department & Specialty</th>
                <th>Experience</th>
                <th>Consultation Fee</th>
                <th>Schedule</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let doc of filteredDoctors()">
                <td><span class="patient-id-badge">{{ doc.id }}</span></td>
                <td>
                  <strong>{{ doc.name }}</strong>
                  <div class="text-xs text-muted">{{ doc.qualification }}</div>
                  <div class="text-xs text-muted">{{ doc.email }}</div>
                </td>
                <td>
                  <span class="font-semibold">{{ doc.department }}</span>
                  <div class="text-xs text-muted">{{ doc.specialization }}</div>
                  <div class="text-xs text-muted">{{ doc.roomNo }}</div>
                </td>
                <td>{{ doc.experienceYears }} yrs</td>
                <td><strong class="text-emerald">₹{{ doc.consultationFee }}</strong></td>
                <td>
                  <div class="text-xs font-semibold">{{ doc.availableDays.join(', ') }}</div>
                  <div class="text-xs text-muted">{{ doc.availableHours }}</div>
                </td>
                <td>
                  <span 
                    class="badge" 
                    [ngClass]="{
                      'badge-available': doc.status === 'Available',
                      'badge-consultation': doc.status === 'In Consultation',
                      'badge-leave': doc.status === 'On Leave',
                      'badge-surgery': doc.status === 'In Surgery'
                    }"
                  >
                    {{ doc.status }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="actions-wrapper">
                    <button class="btn-icon" (click)="openEditModal(doc)" title="Edit Doctor Profile">
                      <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                    <button class="btn-icon btn-icon-danger" (click)="openDeleteConfirm(doc)" title="Remove Doctor">
                      <i class="fa-regular fa-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state-box" *ngIf="filteredDoctors().length === 0">
        <i class="fa-solid fa-user-doctor"></i>
        <h4>No doctors found matching filters</h4>
        <p>Try clearing your search or add a new doctor profile.</p>
      </div>

      <!-- ========================================== -->
      <!-- MODAL: ADD / EDIT DOCTOR -->
      <!-- ========================================== -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>
              <i class="fa-solid fa-user-doctor text-blue"></i>
              {{ isEditing ? 'Edit Doctor Details' : 'Add New Medical Consultant' }}
            </h3>
            <button class="btn-icon" (click)="closeModal()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <form (ngSubmit)="saveDoctor()" #doctorForm="ngForm">
            <div class="modal-body">
              <div class="grid grid-cols-2 gap-4">
                <!-- Name -->
                <div class="form-group">
                  <label class="form-label">Doctor Name (with title) *</label>
                  <input 
                    type="text" 
                    name="name" 
                    [(ngModel)]="formData.name" 
                    required 
                    placeholder="e.g. Dr. Robert House" 
                    class="form-control"
                    #docName="ngModel"
                    [class.is-invalid]="docName.invalid && docName.touched"
                  />
                </div>

                <!-- Department -->
                <div class="form-group">
                  <label class="form-label">Department *</label>
                  <select name="department" [(ngModel)]="formData.department" required class="form-control">
                    <option *ngFor="let dept of departments" [value]="dept">{{ dept }}</option>
                  </select>
                </div>

                <!-- Specialization -->
                <div class="form-group">
                  <label class="form-label">Specialization Designation *</label>
                  <input 
                    type="text" 
                    name="specialization" 
                    [(ngModel)]="formData.specialization" 
                    required 
                    placeholder="e.g. Consultant Interventional Cardiologist" 
                    class="form-control"
                  />
                </div>

                <!-- Qualification -->
                <div class="form-group">
                  <label class="form-label">Qualifications & Degrees *</label>
                  <input 
                    type="text" 
                    name="qualification" 
                    [(ngModel)]="formData.qualification" 
                    required 
                    placeholder="e.g. MD, DM, FACC" 
                    class="form-control"
                  />
                </div>

                <!-- Experience -->
                <div class="form-group">
                  <label class="form-label">Experience (Years) *</label>
                  <input 
                    type="number" 
                    name="experienceYears" 
                    [(ngModel)]="formData.experienceYears" 
                    required 
                    min="1" 
                    max="60" 
                    class="form-control"
                  />
                </div>

                <!-- Consultation Fee -->
                <div class="form-group">
                  <label class="form-label">Consultation Fee (₹) *</label>
                  <input 
                    type="number" 
                    name="consultationFee" 
                    [(ngModel)]="formData.consultationFee" 
                    required 
                    min="0" 
                    class="form-control"
                  />
                </div>

                <!-- Phone -->
                <div class="form-group">
                  <label class="form-label">Contact Phone *</label>
                  <input 
                    type="tel" 
                    name="phone" 
                    [(ngModel)]="formData.phone" 
                    required 
                    placeholder="+91 98401 00000" 
                    class="form-control"
                  />
                </div>

                <!-- Email -->
                <div class="form-group">
                  <label class="form-label">Official Email *</label>
                  <input 
                    type="email" 
                    name="email" 
                    [(ngModel)]="formData.email" 
                    required 
                    placeholder="doctor@praveenclinic.in" 
                    class="form-control"
                  />
                </div>

                <!-- Room / Office -->
                <div class="form-group">
                  <label class="form-label">Clinic Suite / Room No. *</label>
                  <input 
                    type="text" 
                    name="roomNo" 
                    [(ngModel)]="formData.roomNo" 
                    required 
                    placeholder="Suite 302 - West Wing" 
                    class="form-control"
                  />
                </div>

                <!-- Status -->
                <div class="form-group">
                  <label class="form-label">Current Clinical Status *</label>
                  <select name="status" [(ngModel)]="formData.status" required class="form-control">
                    <option value="Available">Available</option>
                    <option value="In Consultation">In Consultation</option>
                    <option value="On Leave">On Leave</option>
                    <option value="In Surgery">In Surgery</option>
                  </select>
                </div>

                <!-- Available Hours -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Consultation Timings *</label>
                  <input 
                    type="text" 
                    name="availableHours" 
                    [(ngModel)]="formData.availableHours" 
                    required 
                    placeholder="e.g. 09:00 AM - 02:00 PM" 
                    class="form-control"
                  />
                </div>

                <!-- Available Days -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Working Days</label>
                  <div class="days-checkbox-grid">
                    <label *ngFor="let day of allDays" class="day-checkbox-label">
                      <input 
                        type="checkbox" 
                        [checked]="formData.availableDays.includes(day)" 
                        (change)="toggleDay(day)"
                      />
                      <span>{{ day }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="doctorForm.invalid">
                <i class="fa-solid fa-check"></i>
                {{ isEditing ? 'Save Changes' : 'Add Doctor' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal-overlay" *ngIf="doctorToDelete" (click)="doctorToDelete = null">
        <div class="modal-content modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Remove Doctor</h3>
            <button class="btn-icon" (click)="doctorToDelete = null"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to remove <strong>{{ doctorToDelete.name }}</strong> ({{ doctorToDelete.id }}) from the hospital staff directory?</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="doctorToDelete = null">Cancel</button>
            <button class="btn btn-danger" (click)="confirmDelete()">
              <i class="fa-solid fa-trash-can"></i> Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .doctors-page {
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
      max-width: 700px;
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
    .action-buttons-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .view-toggle {
      display: flex;
      background: var(--bg-card-subtle);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .toggle-btn {
      padding: 0.5rem 0.75rem;
      color: var(--text-muted);
      transition: all 0.15s;
    }
    .toggle-btn.active {
      background: var(--primary-600);
      color: #ffffff;
    }
    /* Department pills */
    .dept-pills-bar {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }
    .dept-pill {
      white-space: nowrap;
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-full);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.15s;
    }
    .dept-pill:hover {
      background: var(--bg-card-subtle);
      color: var(--text-main);
    }
    .dept-pill.active {
      background: var(--primary-600);
      border-color: var(--primary-600);
      color: #ffffff;
    }
    /* Doctor Grid */
    .doctors-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .doctor-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .doctor-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .doc-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    .doc-avatar {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
    }
    .doc-status-col {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }
    .doc-id {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .doc-card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .doc-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 0.15rem;
    }
    .doc-specialty {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--primary-600);
      margin-bottom: 0.2rem;
    }
    .doc-qualification {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.875rem;
    }
    .doc-info-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      background: var(--bg-card-subtle);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      font-size: 0.775rem;
    }
    .doc-info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-main);
    }
    .doc-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-light);
    }
    .doc-contact-snippet {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .doc-actions {
      display: flex;
      gap: 0.35rem;
    }
    .days-checkbox-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }
    .day-checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8125rem;
      background: var(--bg-card-subtle);
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      cursor: pointer;
    }
    .font-semibold { font-weight: 600; }
    .text-xs { font-size: 0.725rem; }
    .text-emerald { color: #10b981; }
    .text-blue { color: #2563eb; }
    .text-amber { color: #f59e0b; }
    .text-subtle { color: var(--text-subtle); }
    .text-danger { color: #ef4444; }
  `]
})
export class DoctorsComponent {
  public readonly dataService = inject(HospitalDataService);
  private readonly toastService = inject(ToastService);

  public searchQuery = '';
  public selectedDepartment = 'ALL';
  public viewMode: 'grid' | 'table' = 'grid';

  public departments = [
    'Cardiology',
    'Neurology',
    'Pediatrics',
    'Orthopedics',
    'Dermatology',
    'General Medicine'
  ];

  public allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  public showModal = false;
  public isEditing = false;
  public doctorToDelete: Doctor | null = null;

  public formData: any = this.getEmptyDoctor();

  private getEmptyDoctor() {
    return {
      name: '',
      specialization: '',
      department: 'Cardiology',
      qualification: '',
      phone: '',
      email: '',
      experienceYears: 5,
      consultationFee: 120,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      availableHours: '09:00 AM - 02:00 PM',
      status: 'Available',
      roomNo: 'Suite 101'
    };
  }

  filteredDoctors(): Doctor[] {
    return this.dataService.doctors().filter(doc => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        doc.name.toLowerCase().includes(q) || 
        doc.specialization.toLowerCase().includes(q) ||
        doc.id.toLowerCase().includes(q);

      const matchesDept = this.selectedDepartment === 'ALL' || doc.department === this.selectedDepartment;

      return matchesSearch && matchesDept;
    });
  }

  getDeptCount(dept: string): number {
    return this.dataService.doctors().filter(d => d.department === dept).length;
  }

  toggleDay(day: string): void {
    if (this.formData.availableDays.includes(day)) {
      this.formData.availableDays = this.formData.availableDays.filter((d: string) => d !== day);
    } else {
      this.formData.availableDays.push(day);
    }
  }

  openAddModal(): void {
    this.isEditing = false;
    this.formData = this.getEmptyDoctor();
    this.showModal = true;
  }

  openEditModal(doctor: Doctor): void {
    this.isEditing = true;
    this.formData = { 
      ...doctor, 
      availableDays: [...doctor.availableDays] 
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveDoctor(): void {
    if (this.isEditing) {
      this.dataService.updateDoctor(this.formData as Doctor);
      this.toastService.success('Doctor Updated', `Profile for ${this.formData.name} updated.`);
    } else {
      const created = this.dataService.addDoctor(this.formData);
      this.toastService.success('Doctor Added', `Dr. ${created.name} registered under ID ${created.id}.`);
    }
    this.closeModal();
  }

  openDeleteConfirm(doctor: Doctor): void {
    this.doctorToDelete = doctor;
  }

  confirmDelete(): void {
    if (this.doctorToDelete) {
      const name = this.doctorToDelete.name;
      this.dataService.deleteDoctor(this.doctorToDelete.id);
      this.toastService.warning('Doctor Removed', `${name} has been removed from staff.`);
      this.doctorToDelete = null;
    }
  }
}
