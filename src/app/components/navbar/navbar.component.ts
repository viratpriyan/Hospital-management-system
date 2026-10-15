import { Component, inject, OnInit, OnDestroy, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { HospitalDataService } from '../../services/hospital-data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="navbar">
      <!-- Left side: Hamburger + Breadcrumb -->
      <div class="navbar-left">
        <button class="menu-toggle-btn" (click)="toggleSidebar.emit()" title="Toggle Menu">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="page-title-box">
          <h1 class="page-title">{{ currentTitle() }}</h1>
          <span class="breadcrumb-sub">Praveen Clinic Portal</span>
        </div>
      </div>

      <!-- Right side actions -->
      <div class="navbar-right">
        <!-- Live System Clock -->
        <div class="live-clock">
          <i class="fa-regular fa-clock"></i>
          <span>{{ currentTimeString }}</span>
        </div>

        <!-- Reset Demo Data Button -->
        <button 
          class="btn btn-secondary action-pill-btn" 
          (click)="onResetDemoData()" 
          title="Restore standard sample data"
        >
          <i class="fa-solid fa-rotate-left"></i>
          <span class="btn-text">Reset Demo</span>
        </button>

        <!-- Theme Toggle Button -->
        <button class="btn-icon theme-toggle" (click)="toggleTheme()" [title]="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
          <i class="fa-solid" [ngClass]="isDarkMode ? 'fa-sun' : 'fa-moon'"></i>
        </button>

        <!-- User Profile Pill -->
        <div class="user-profile">
          <div class="avatar-circle">
            <span>PK</span>
          </div>
          <div class="user-meta">
            <span class="user-name">Dr. Praveen Kumar</span>
            <span class="user-role">Chief Medical Officer & Director</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      height: 70px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.75rem;
      position: sticky;
      top: 0;
      z-index: 90;
      box-shadow: var(--shadow-xs);
    }
    .navbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .menu-toggle-btn {
      display: none;
      width: 40px;
      height: 40px;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      background: var(--bg-card-subtle);
      font-size: 1.1rem;
    }
    .page-title-box {
      display: flex;
      flex-direction: column;
    }
    .page-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      line-height: 1.2;
    }
    .breadcrumb-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .navbar-right {
      display: flex;
      align-items: center;
      gap: 0.875rem;
    }
    .live-clock {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      color: var(--text-muted);
      background: var(--bg-card-subtle);
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .action-pill-btn {
      padding: 0.45rem 0.875rem;
      font-size: 0.8125rem;
    }
    .theme-toggle {
      width: 38px;
      height: 38px;
      color: var(--accent-amber);
    }
    .user-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-left: 0.75rem;
      border-left: 1px solid var(--border-color);
    }
    .avatar-circle {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
    }
    .user-meta {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .user-role {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    @media (max-width: 992px) {
      .menu-toggle-btn {
        display: flex;
      }
      .live-clock, .user-meta {
        display: none;
      }
      .navbar {
        padding: 0 1rem;
      }
    }
    @media (max-width: 576px) {
      .btn-text {
        display: none;
      }
      .action-pill-btn {
        padding: 0.5rem;
      }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly dataService = inject(HospitalDataService);
  private readonly toastService = inject(ToastService);

  public toggleSidebar = output<void>();

  private readonly currentUrl = signal(this.router.url);

  public readonly currentTitle = computed(() => {
    const url = this.currentUrl();
    if (url.includes('patients')) return 'Patient Registration & Directory';
    if (url.includes('doctors')) return 'Doctor Management & Directory';
    if (url.includes('appointments')) return 'Appointment Scheduling';
    if (url.includes('records')) return 'Clinical Patient Records';
    if (url.includes('billing')) return 'Billing, Invoicing & Payments';
    return 'Hospital Clinical Dashboard';
  });

  public currentTimeString = '';
  public isDarkMode = false;
  private timer: any;

  ngOnInit(): void {
    this.updateClock();
    this.timer = setInterval(() => this.updateClock(), 1000);

    // Watch router events to update page title
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl.set(event.urlAfterRedirects || event.url);
    });

    this.currentUrl.set(this.router.url);

    // Check system / local dark mode
    const savedTheme = localStorage.getItem('apex_theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private updateClock(): void {
    const now = new Date();
    this.currentTimeString = now.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  public toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('apex_theme', 'dark');
      this.toastService.info('Dark Mode Enabled', 'Interface switched to dark theme.');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('apex_theme', 'light');
      this.toastService.info('Light Mode Enabled', 'Interface switched to light theme.');
    }
  }

  public onResetDemoData(): void {
    if (confirm('Are you sure you want to restore the demo dataset? All manual entries will be refreshed.')) {
      this.dataService.resetToDefaults();
      this.toastService.success('Data Reset', 'Hospital demo records have been successfully restored.');
    }
  }
}
