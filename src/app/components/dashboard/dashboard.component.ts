import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HospitalDataService } from '../../services/hospital-data.service';
import { ToastService } from '../../services/toast.service';
import { Appointment } from '../../models/hospital.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-page">
      <!-- Welcome Hero Banner -->
      <div class="hero-banner">
        <div class="hero-content">
          <h2>Welcome back, Dr. Praveen Kumar 👋</h2>
          <p>Here is your daily clinical snapshot and operational summary across all hospital wings.</p>
        </div>
        <div class="hero-quick-actions">
          <a routerLink="/patients" class="btn btn-primary">
            <i class="fa-solid fa-user-plus"></i> New Patient
          </a>
          <a routerLink="/appointments" class="btn btn-secondary">
            <i class="fa-solid fa-calendar-plus"></i> Schedule Visit
          </a>
        </div>
      </div>

      <!-- KPI Stat Cards -->
      <div class="metrics-grid">
        <!-- Card 1: Patients -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Total Patients</span>
            <div class="metric-icon icon-blue">
              <i class="fa-solid fa-hospital-user"></i>
            </div>
          </div>
          <div class="metric-value">{{ dataService.stats().totalPatients }}</div>
          <div class="metric-trend text-emerald">
            <i class="fa-solid fa-arrow-trend-up"></i>
            <span>Active registered profiles</span>
          </div>
        </div>

        <!-- Card 2: Doctors -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Consultant Doctors</span>
            <div class="metric-icon icon-teal">
              <i class="fa-solid fa-user-doctor"></i>
            </div>
          </div>
          <div class="metric-value">{{ dataService.stats().totalDoctors }}</div>
          <div class="metric-trend text-cyan">
            <i class="fa-solid fa-stethoscope"></i>
            <span>Across 6 Specialties</span>
          </div>
        </div>

        <!-- Card 3: Appointments -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Today's Appointments</span>
            <div class="metric-icon icon-amber">
              <i class="fa-solid fa-calendar-check"></i>
            </div>
          </div>
          <div class="metric-value">{{ dataService.stats().todayAppointments }}</div>
          <div class="metric-trend text-amber">
            <i class="fa-regular fa-clock"></i>
            <span>{{ dataService.stats().scheduledAppointments }} pending / scheduled</span>
          </div>
        </div>

        <!-- Card 4: Revenue & Dues -->
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-title">Revenue Collected</span>
            <div class="metric-icon icon-emerald">
              <i class="fa-solid fa-wallet"></i>
            </div>
          </div>
          <div class="metric-value">₹{{ dataService.stats().totalRevenue | number:'1.2-2' }}</div>
          <div class="metric-trend text-muted">
            <span>Pending dues: ₹{{ dataService.stats().pendingDues | number:'1.2-2' }}</span>
          </div>
        </div>
      </div>

      <!-- Main Operational Grid -->
      <div class="dashboard-grid">
        <!-- Left Column: Today's Appointments -->
        <div class="hms-card">
          <div class="hms-card-header">
            <div class="hms-card-title">
              <i class="fa-solid fa-calendar-day text-blue"></i>
              <span>Today's Clinical Schedule</span>
            </div>
            <a routerLink="/appointments" class="view-all-link">View All</a>
          </div>

          <div class="appointments-list" *ngIf="todayAppointments().length > 0; else noTodayAppts">
            <div *ngFor="let appt of todayAppointments()" class="appt-item">
              <div class="appt-time">
                <i class="fa-regular fa-clock"></i>
                <span>{{ appt.timeSlot }}</span>
              </div>
              <div class="appt-patient">
                <div class="patient-name">{{ appt.patientName }}</div>
                <div class="appt-reason">{{ appt.reason }}</div>
              </div>
              <div class="appt-doctor">
                <span class="doctor-badge"><i class="fa-solid fa-user-doctor"></i> {{ appt.doctorName }}</span>
                <span class="dept-name">{{ appt.department }}</span>
              </div>
              <div class="appt-actions">
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
                <button 
                  *ngIf="appt.status === 'Scheduled'" 
                  class="btn-icon" 
                  title="Mark as Completed"
                  (click)="completeAppointment(appt)"
                >
                  <i class="fa-solid fa-check text-emerald"></i>
                </button>
              </div>
            </div>
          </div>

          <ng-template #noTodayAppts>
            <div class="empty-state-box">
              <i class="fa-solid fa-calendar-xmark"></i>
              <p>No appointments booked for today yet.</p>
              <a routerLink="/appointments" class="btn btn-primary btn-sm">Schedule Now</a>
            </div>
          </ng-template>
        </div>

        <!-- Right Column: Departments & Fast Overview -->
        <div class="dashboard-sidebar-column">
          <!-- Hospital Department Workload -->
          <div class="hms-card">
            <div class="hms-card-header">
              <div class="hms-card-title">
                <i class="fa-solid fa-hospital text-teal"></i>
                <span>Specialty Departments</span>
              </div>
              <a routerLink="/doctors" class="view-all-link">Staff</a>
            </div>

            <div class="dept-list">
              <div class="dept-item" *ngFor="let dept of departments">
                <div class="dept-icon" [style.background]="dept.bg" [style.color]="dept.color">
                  <i [class]="dept.icon"></i>
                </div>
                <div class="dept-info">
                  <span class="dept-title">{{ dept.name }}</span>
                  <span class="dept-doctors">{{ dept.doctorsCount }} Specialists</span>
                </div>
                <div class="dept-badge">{{ dept.status }}</div>
              </div>
            </div>
          </div>

          <!-- Recent Invoices Widget -->
          <div class="hms-card">
            <div class="hms-card-header">
              <div class="hms-card-title">
                <i class="fa-solid fa-receipt text-amber"></i>
                <span>Recent Billing Activity</span>
              </div>
              <a routerLink="/billing" class="view-all-link">All Invoices</a>
            </div>

            <div class="recent-bills-list">
              <div *ngFor="let bill of recentBills()" class="bill-row">
                <div class="bill-patient">
                  <strong>{{ bill.patientName }}</strong>
                  <span class="bill-id">{{ bill.id }} • {{ bill.issueDate }}</span>
                </div>
                <div class="bill-amount">
                  <span class="amount-val">₹{{ bill.totalAmount | number:'1.2-2' }}</span>
                  <span class="badge" [ngClass]="bill.paymentStatus === 'Paid' ? 'badge-paid' : 'badge-pending'">
                    {{ bill.paymentStatus }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .hero-banner {
      background: linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%);
      border-radius: var(--radius-xl);
      padding: 1.75rem 2rem;
      color: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.25rem;
      box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.3);
    }
    .hero-content h2 {
      font-size: 1.6rem;
      font-weight: 800;
      margin-bottom: 0.35rem;
      letter-spacing: -0.02em;
    }
    .hero-content p {
      font-size: 0.95rem;
      color: #e0f2fe;
      max-width: 600px;
    }
    .hero-quick-actions {
      display: flex;
      gap: 0.75rem;
    }
    .hero-quick-actions .btn-secondary {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(4px);
    }
    .hero-quick-actions .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    /* Metrics */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }
    .metric-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .metric-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-icon {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    .icon-blue { background: #dbeafe; color: #2563eb; }
    .icon-teal { background: #ccfbf1; color: #0d9488; }
    .icon-amber { background: #fef3c7; color: #d97706; }
    .icon-emerald { background: #d1fae5; color: #059669; }

    .metric-value {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.2;
      margin-bottom: 0.4rem;
    }
    .metric-trend {
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .text-emerald { color: #10b981; }
    .text-cyan { color: #06b6d4; }
    .text-amber { color: #f59e0b; }
    .text-blue { color: #2563eb; }
    .text-teal { color: #0d9488; }

    /* Operational layout */
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 1.5rem;
    }
    .dashboard-sidebar-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .view-all-link {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--primary-600);
      transition: color 0.15s;
    }
    .view-all-link:hover {
      text-decoration: underline;
    }
    /* Appointment List */
    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }
    .appt-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.875rem 1rem;
      background: var(--bg-card-subtle);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      transition: background 0.15s;
    }
    .appt-item:hover {
      background: var(--border-light);
    }
    .appt-time {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary-600);
      background: var(--bg-card);
      padding: 0.4rem 0.6rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 0.35rem;
      white-space: nowrap;
    }
    .appt-patient {
      flex: 1;
      min-width: 0;
    }
    .patient-name {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-main);
    }
    .appt-reason {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .appt-doctor {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      font-size: 0.75rem;
    }
    .doctor-badge {
      font-weight: 600;
      color: var(--text-main);
    }
    .dept-name {
      color: var(--text-muted);
      font-size: 0.7rem;
    }
    .appt-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Department cards */
    .dept-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .dept-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.65rem 0.75rem;
      border-radius: var(--radius-md);
      background: var(--bg-card-subtle);
      border: 1px solid var(--border-color);
    }
    .dept-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
    .dept-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .dept-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .dept-doctors {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .dept-badge {
      font-size: 0.7rem;
      font-weight: 700;
      color: #10b981;
      background: #ecfdf5;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-full);
    }

    /* Recent Bills */
    .recent-bills-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .bill-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--bg-card-subtle);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .bill-patient {
      display: flex;
      flex-direction: column;
    }
    .bill-id {
      font-size: 0.7rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }
    .bill-amount {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.2rem;
    }
    .amount-val {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-main);
    }

    .empty-state-box {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }
    .empty-state-box i {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      color: var(--text-subtle);
    }
    .empty-state-box p {
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    @media (max-width: 1024px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent {
  public readonly dataService = inject(HospitalDataService);
  private readonly toastService = inject(ToastService);

  public readonly departments = [
    { name: 'Cardiology', doctorsCount: 2, icon: 'fa-solid fa-heart-pulse', bg: '#fee2e2', color: '#dc2626', status: 'Online' },
    { name: 'Neurology', doctorsCount: 2, icon: 'fa-solid fa-brain', bg: '#f3e8ff', color: '#7e22ce', status: 'Online' },
    { name: 'Pediatrics', doctorsCount: 1, icon: 'fa-solid fa-baby', bg: '#e0f2fe', color: '#0284c7', status: 'Active' },
    { name: 'Orthopedics', doctorsCount: 1, icon: 'fa-solid fa-bone', bg: '#fef3c7', color: '#d97706', status: 'In Surgery' },
    { name: 'Dermatology', doctorsCount: 1, icon: 'fa-solid fa-hand-dots', bg: '#fce7f3', color: '#db2777', status: 'Online' },
    { name: 'General Medicine', doctorsCount: 2, icon: 'fa-solid fa-stethoscope', bg: '#dcfce7', color: '#16a34a', status: 'Online' },
  ];

  todayAppointments(): Appointment[] {
    const today = new Date().toISOString().split('T')[0];
    return this.dataService.appointments().filter(a => a.date === today);
  }

  recentBills() {
    return this.dataService.bills().slice(0, 4);
  }

  completeAppointment(appt: Appointment): void {
    this.dataService.updateAppointmentStatus(appt.id, 'Completed');
    this.toastService.success('Status Updated', `Appointment ${appt.id} for ${appt.patientName} marked completed.`);
  }
}
