import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HospitalDataService } from '../../services/hospital-data.service';
import { ToastService } from '../../services/toast.service';
import { Appointment, Patient, Doctor } from '../../models/hospital.models';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="appointments-page">
      <!-- Filter and Actions Toolbar -->
      <div class="page-action-bar">
        <div class="search-filter-group">
          <!-- Search box -->
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input 
              type="text" 
              placeholder="Search by Patient, Doctor or Reason..." 
              [(ngModel)]="searchQuery" 
              class="form-control search-input"
            />
            <button *ngIf="searchQuery" class="clear-search" (click)="searchQuery = ''">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Status Filter -->
          <select [(ngModel)]="selectedStatus" class="form-control select-filter">
            <option value="ALL">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <!-- Date Filter -->
          <select [(ngModel)]="dateFilter" class="form-control select-filter">
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today Only</option>
            <option value="UPCOMING">Upcoming / Future</option>
          </select>
        </div>

        <button class="btn btn-primary" (click)="openScheduleModal()">
          <i class="fa-solid fa-calendar-plus"></i> Book Appointment
        </button>
      </div>

      <!-- Appointments Table -->
      <div class="hms-card">
        <div class="table-responsive">
          <table class="hms-table">
            <thead>
              <tr>
                <th>Appt ID</th>
                <th>Patient Details</th>
                <th>Doctor & Dept</th>
                <th>Schedule</th>
                <th>Type</th>
                <th>Clinical Reason</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let appt of filteredAppointments()">
                <td>
                  <span class="patient-id-badge">{{ appt.id }}</span>
                </td>
                <td>
                  <strong>{{ appt.patientName }}</strong>
                  <div class="text-xs text-muted">{{ appt.patientId }}</div>
                </td>
                <td>
                  <div class="font-semibold">{{ appt.doctorName }}</div>
                  <div class="text-xs text-muted">{{ appt.department }}</div>
                </td>
                <td>
                  <div class="schedule-cell">
                    <span class="date-str"><i class="fa-regular fa-calendar text-blue"></i> {{ appt.date }}</span>
                    <span class="time-str"><i class="fa-regular fa-clock text-amber"></i> {{ appt.timeSlot }}</span>
                  </div>
                </td>
                <td>
                  <span class="type-pill">{{ appt.type }}</span>
                </td>
                <td>
                  <span class="reason-text" [title]="appt.reason">{{ appt.reason }}</span>
                </td>
                <td>
                  <span 
                    class="badge" 
                    [ngClass]="{
                      'badge-scheduled': appt.status === 'Scheduled',
                      'badge-completed': appt.status === 'Completed',
                      'badge-cancelled': appt.status === 'Cancelled'
                    }"
                  >
                    {{ appt.status }}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="actions-wrapper">
                    <!-- Quick Complete -->
                    <button 
                      *ngIf="appt.status === 'Scheduled'" 
                      class="btn-icon" 
                      (click)="setStatus(appt, 'Completed')" 
                      title="Mark as Completed"
                    >
                      <i class="fa-solid fa-check text-emerald"></i>
                    </button>
                    <!-- Quick Cancel -->
                    <button 
                      *ngIf="appt.status === 'Scheduled'" 
                      class="btn-icon" 
                      (click)="setStatus(appt, 'Cancelled')" 
                      title="Cancel Appointment"
                    >
                      <i class="fa-solid fa-ban text-danger"></i>
                    </button>
                    <!-- Edit -->
                    <button class="btn-icon" (click)="openEditModal(appt)" title="Reschedule / Edit">
                      <i class="fa-regular fa-pen-to-square"></i>
                    </button>
                    <!-- Delete -->
                    <button class="btn-icon btn-icon-danger" (click)="openDeleteConfirm(appt)" title="Delete Entry">
                      <i class="fa-regular fa-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredAppointments().length === 0">
                <td colspan="8" class="empty-table-cell">
                  <div class="empty-state">
                    <i class="fa-solid fa-calendar-xmark"></i>
                    <h4>No appointments found matching filters</h4>
                    <p>Schedule a new visit or adjust your criteria.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL: SCHEDULE / EDIT APPOINTMENT -->
      <!-- ========================================== -->
      <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>
              <i class="fa-solid fa-calendar-check text-blue"></i>
              {{ isEditing ? 'Reschedule / Edit Appointment' : 'Schedule New Patient Appointment' }}
            </h3>
            <button class="btn-icon" (click)="closeModal()"><i class="fa-solid fa-xmark"></i></button>
          </div>

          <form (ngSubmit)="saveAppointment()" #apptForm="ngForm">
            <div class="modal-body">
              <div class="grid grid-cols-2 gap-4">
                <!-- Patient Selector -->
                <div class="form-group">
                  <label class="form-label">Select Patient *</label>
                  <select 
                    name="patientId" 
                    [(ngModel)]="formData.patientId" 
                    (change)="onPatientSelected()" 
                    required 
                    class="form-control"
                  >
                    <option value="" disabled>-- Choose Registered Patient --</option>
                    <option *ngFor="let p of dataService.patients()" [value]="p.id">
                      {{ p.name }} ({{ p.id }}) - {{ p.phone }}
                    </option>
                  </select>
                </div>

                <!-- Doctor Selector -->
                <div class="form-group">
                  <label class="form-label">Consultant Doctor *</label>
                  <select 
                    name="doctorId" 
                    [(ngModel)]="formData.doctorId" 
                    (change)="onDoctorSelected()" 
                    required 
                    class="form-control"
                  >
                    <option value="" disabled>-- Choose Doctor --</option>
                    <option *ngFor="let doc of dataService.doctors()" [value]="doc.id">
                      {{ doc.name }} - {{ doc.department }} (₹{{ doc.consultationFee }})
                    </option>
                  </select>
                </div>

                <!-- Date -->
                <div class="form-group">
                  <label class="form-label">Appointment Date *</label>
                  <input 
                    type="date" 
                    name="date" 
                    [(ngModel)]="formData.date" 
                    required 
                    class="form-control"
                  />
                </div>

                <!-- Time Slot -->
                <div class="form-group">
                  <label class="form-label">Available Time Slot *</label>
                  <select name="timeSlot" [(ngModel)]="formData.timeSlot" required class="form-control">
                    <option *ngFor="let slot of availableTimeSlots" [value]="slot">{{ slot }}</option>
                  </select>
                </div>

                <!-- Type -->
                <div class="form-group">
                  <label class="form-label">Visit Nature / Priority *</label>
                  <select name="type" [(ngModel)]="formData.type" required class="form-control">
                    <option value="General Checkup">General Checkup</option>
                    <option value="Specialist Consultation">Specialist Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <!-- Status -->
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select name="status" [(ngModel)]="formData.status" required class="form-control">
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <!-- Reason / Chief Complaint -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Reason for Visit / Symptoms *</label>
                  <input 
                    type="text" 
                    name="reason" 
                    [(ngModel)]="formData.reason" 
                    required 
                    placeholder="e.g. Chronic back pain, shortness of breath, routine annual review" 
                    class="form-control"
                  />
                </div>

                <!-- Notes -->
                <div class="form-group" style="grid-column: span 2;">
                  <label class="form-label">Clinical / Admin Notes (Optional)</label>
                  <textarea 
                    name="notes" 
                    [(ngModel)]="formData.notes" 
                    rows="2" 
                    placeholder="Patient instructed to fast for 8 hours if blood work needed." 
                    class="form-control"
                  ></textarea>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="apptForm.invalid">
                <i class="fa-solid fa-calendar-check"></i>
                {{ isEditing ? 'Update Schedule' : 'Confirm Appointment' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div class="modal-overlay" *ngIf="apptToDelete" (click)="apptToDelete = null">
        <div class="modal-content modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Delete Appointment</h3>
            <button class="btn-icon" (click)="apptToDelete = null"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <p>
              Are you sure you want to permanently delete appointment 
              <strong>{{ apptToDelete.id }}</strong> for {{ apptToDelete.patientName }}?
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="apptToDelete = null">Cancel</button>
            <button class="btn btn-danger" (click)="confirmDelete()">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .appointments-page {
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
    .schedule-cell {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.8rem;
    }
    .date-str {
      font-weight: 600;
      color: var(--text-main);
    }
    .time-str {
      color: var(--text-muted);
      font-size: 0.75rem;
    }
    .type-pill {
      font-size: 0.725rem;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      background: var(--bg-card-subtle);
      border: 1px solid var(--border-color);
      font-weight: 600;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .reason-text {
      max-width: 220px;
      display: inline-block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
    .actions-wrapper {
      display: inline-flex;
      gap: 0.35rem;
    }
    .font-semibold { font-weight: 600; }
    .text-xs { font-size: 0.725rem; }
    .text-emerald { color: #10b981; }
    .text-blue { color: #2563eb; }
    .text-amber { color: #f59e0b; }
    .text-danger { color: #ef4444; }
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
export class AppointmentsComponent {
  public readonly dataService = inject(HospitalDataService);
  private readonly toastService = inject(ToastService);

  public searchQuery = '';
  public selectedStatus = 'ALL';
  public dateFilter = 'ALL';

  public availableTimeSlots = [
    '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', 
    '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'
  ];

  public showModal = false;
  public isEditing = false;
  public apptToDelete: Appointment | null = null;

  public formData: any = this.getEmptyAppointment();

  private getEmptyAppointment() {
    const today = new Date().toISOString().split('T')[0];
    return {
      patientId: '',
      patientName: '',
      doctorId: '',
      doctorName: '',
      department: '',
      date: today,
      timeSlot: '10:00 AM',
      type: 'General Checkup',
      reason: '',
      status: 'Scheduled',
      notes: ''
    };
  }

  filteredAppointments(): Appointment[] {
    const today = new Date().toISOString().split('T')[0];

    return this.dataService.appointments().filter(a => {
      const q = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        a.patientName.toLowerCase().includes(q) ||
        a.doctorName.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q);

      const matchesStatus = this.selectedStatus === 'ALL' || a.status === this.selectedStatus;

      let matchesDate = true;
      if (this.dateFilter === 'TODAY') {
        matchesDate = a.date === today;
      } else if (this.dateFilter === 'UPCOMING') {
        matchesDate = a.date >= today;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }

  onPatientSelected(): void {
    const p = this.dataService.getPatientById(this.formData.patientId);
    if (p) {
      this.formData.patientName = p.name;
    }
  }

  onDoctorSelected(): void {
    const doc = this.dataService.getDoctorById(this.formData.doctorId);
    if (doc) {
      this.formData.doctorName = doc.name;
      this.formData.department = doc.department;
    }
  }

  openScheduleModal(): void {
    this.isEditing = false;
    this.formData = this.getEmptyAppointment();
    // Default to first patient & doctor if available
    if (this.dataService.patients().length > 0) {
      this.formData.patientId = this.dataService.patients()[0].id;
      this.formData.patientName = this.dataService.patients()[0].name;
    }
    if (this.dataService.doctors().length > 0) {
      this.formData.doctorId = this.dataService.doctors()[0].id;
      this.formData.doctorName = this.dataService.doctors()[0].name;
      this.formData.department = this.dataService.doctors()[0].department;
    }
    this.showModal = true;
  }

  openEditModal(appt: Appointment): void {
    this.isEditing = true;
    this.formData = { ...appt };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveAppointment(): void {
    if (this.isEditing) {
      this.dataService.updateAppointment(this.formData as Appointment);
      this.toastService.success('Schedule Updated', `Appointment ${this.formData.id} was updated.`);
    } else {
      const created = this.dataService.addAppointment(this.formData);
      this.toastService.success('Appointment Scheduled', `Booked ${created.id} for ${created.patientName} on ${created.date} at ${created.timeSlot}.`);
    }
    this.closeModal();
  }

  setStatus(appt: Appointment, status: 'Scheduled' | 'Completed' | 'Cancelled'): void {
    this.dataService.updateAppointmentStatus(appt.id, status);
    this.toastService.info('Status Changed', `Appointment marked ${status}.`);
  }

  openDeleteConfirm(appt: Appointment): void {
    this.apptToDelete = appt;
  }

  confirmDelete(): void {
    if (this.apptToDelete) {
      this.dataService.deleteAppointment(this.apptToDelete.id);
      this.toastService.warning('Appointment Deleted', 'Appointment has been cancelled and removed.');
      this.apptToDelete = null;
    }
  }
}
