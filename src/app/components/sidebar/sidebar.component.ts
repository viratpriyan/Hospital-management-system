import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HospitalDataService } from '../../services/hospital-data.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.open]="isOpen()">
      <!-- Brand Logo -->
      <div class="sidebar-brand">
        <div class="brand-icon">
          <i class="fa-solid fa-notes-medical"></i>
        </div>
        <div class="brand-info">
          <span class="brand-title">Praveen Clinic</span>
          <span class="brand-subtitle">Health Care Center</span>
        </div>
        <button class="close-btn mobile-only" (click)="closeSidebar.emit()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Navigation Links -->
      <nav class="sidebar-nav">
        <div class="nav-section-label">CLINICAL CORE</div>

        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <i class="fa-solid fa-chart-pie"></i>
          <span>Dashboard</span>
        </a>

        <a routerLink="/patients" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <i class="fa-solid fa-hospital-user"></i>
          <span>Patients</span>
          <span class="nav-badge" *ngIf="dataService.patients().length > 0">
            {{ dataService.patients().length }}
          </span>
        </a>

        <a routerLink="/doctors" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <i class="fa-solid fa-user-doctor"></i>
          <span>Doctors</span>
          <span class="nav-badge doc-badge" *ngIf="dataService.doctors().length > 0">
            {{ dataService.doctors().length }}
          </span>
        </a>

        <a routerLink="/appointments" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <i class="fa-solid fa-calendar-check"></i>
          <span>Appointments</span>
          <span class="nav-badge appt-badge" *ngIf="dataService.stats().todayAppointments > 0">
            {{ dataService.stats().todayAppointments }} Today
          </span>
        </a>

        <div class="nav-section-label">RECORDS & FINANCE</div>

        <a routerLink="/records" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <i class="fa-solid fa-clipboard-prescription"></i>
          <span>Patient Records</span>
          <span class="nav-badge" *ngIf="dataService.records().length > 0">
            {{ dataService.records().length }}
          </span>
        </a>

        <a routerLink="/billing" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <i class="fa-solid fa-file-invoice-dollar"></i>
          <span>Billing & Payments</span>
          <span class="nav-badge bill-badge" *ngIf="pendingBillsCount() > 0">
            {{ pendingBillsCount() }} Due
          </span>
        </a>
      </nav>

      <!-- Hospital Quick Info Box -->
      <div class="sidebar-footer">
        <div class="hospital-status-card">
          <div class="status-indicator">
            <span class="pulse-dot"></span>
            <span>Emergency Dept. 24/7</span>
          </div>
          <div class="status-detail">Trauma & ICU Active</div>
          <div class="status-contact">
            <i class="fa-solid fa-phone"></i> +91 98400 12345
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background: #0f172a;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 100;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sidebar-brand {
      height: 70px;
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      gap: 0.875rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    }
    .brand-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .brand-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .brand-subtitle {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #38bdf8;
      font-weight: 600;
    }
    .mobile-only {
      display: none;
    }
    .close-btn {
      color: #94a3b8;
      font-size: 1.25rem;
    }
    .sidebar-nav {
      flex: 1;
      padding: 1.25rem 0.875rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .nav-section-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #475569;
      padding: 0.75rem 0.75rem 0.35rem;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.75rem 1rem;
      color: #94a3b8;
      border-radius: var(--radius-md);
      font-weight: 500;
      font-size: 0.875rem;
      transition: all 0.2s;
      position: relative;
    }
    .nav-item i {
      font-size: 1.1rem;
      width: 20px;
      text-align: center;
      transition: transform 0.2s;
    }
    .nav-item:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.06);
    }
    .nav-item:hover i {
      transform: scale(1.1);
    }
    .nav-item.active {
      color: #ffffff;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }
    .nav-badge {
      margin-left: auto;
      font-size: 0.7rem;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      font-weight: 700;
    }
    .appt-badge {
      background: #0284c7;
    }
    .bill-badge {
      background: #f59e0b;
    }
    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .hospital-status-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-md);
      padding: 0.875rem;
      font-size: 0.75rem;
    }
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #34d399;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
      animation: pulse 1.8s infinite;
    }
    .status-detail {
      color: #cbd5e1;
      font-size: 0.7rem;
      margin-bottom: 0.4rem;
    }
    .status-contact {
      color: #38bdf8;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    @media (max-width: 992px) {
      .sidebar {
        transform: translateX(-100%);
      }
      .sidebar.open {
        transform: translateX(0);
      }
      .mobile-only {
        display: block;
      }
    }
  `]
})
export class SidebarComponent {
  public readonly dataService = inject(HospitalDataService);
  public isOpen = input<boolean>(false);
  public closeSidebar = output<void>();

  pendingBillsCount(): number {
    return this.dataService.bills().filter(b => b.paymentStatus !== 'Paid').length;
  }

  onNavClick(): void {
    this.closeSidebar.emit();
  }
}
