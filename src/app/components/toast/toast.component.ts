import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toastService.toasts().length > 0">
      <div 
        *ngFor="let toast of toastService.toasts()" 
        class="toast-item"
        [ngClass]="'toast-' + toast.type"
      >
        <div class="toast-icon">
          <i class="fa-solid fa-circle-check" *ngIf="toast.type === 'success'"></i>
          <i class="fa-solid fa-circle-xmark" *ngIf="toast.type === 'error'"></i>
          <i class="fa-solid fa-circle-info" *ngIf="toast.type === 'info'"></i>
          <i class="fa-solid fa-triangle-exclamation" *ngIf="toast.type === 'warning'"></i>
        </div>
        <div class="toast-body">
          <div class="toast-title">{{ toast.title }}</div>
          <div class="toast-msg">{{ toast.message }}</div>
        </div>
        <button class="toast-close" (click)="toastService.remove(toast.id)" title="Dismiss">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 380px;
      pointer-events: none;
    }
    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.875rem;
      padding: 1rem 1.125rem;
      border-radius: var(--radius-lg);
      background: var(--bg-card);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border: 1px solid var(--border-color);
      animation: toastSlide 0.25s ease-out;
      border-left: 4px solid;
    }
    .toast-success { border-left-color: #10b981; }
    .toast-success .toast-icon { color: #10b981; }
    
    .toast-error { border-left-color: #ef4444; }
    .toast-error .toast-icon { color: #ef4444; }

    .toast-info { border-left-color: #3b82f6; }
    .toast-info .toast-icon { color: #3b82f6; }

    .toast-warning { border-left-color: #f59e0b; }
    .toast-warning .toast-icon { color: #f59e0b; }

    .toast-icon {
      font-size: 1.25rem;
      margin-top: 0.1rem;
    }
    .toast-body {
      flex: 1;
    }
    .toast-title {
      font-weight: 700;
      font-size: 0.875rem;
      color: var(--text-main);
      margin-bottom: 0.15rem;
    }
    .toast-msg {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.35;
    }
    .toast-close {
      color: var(--text-subtle);
      font-size: 0.875rem;
      padding: 0.2rem;
      transition: color 0.15s;
    }
    .toast-close:hover {
      color: var(--text-main);
    }
    @keyframes toastSlide {
      from { transform: translateX(40px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  public readonly toastService = inject(ToastService);
}
