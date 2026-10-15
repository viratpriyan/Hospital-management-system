import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PatientsComponent } from './components/patients/patients.component';
import { DoctorsComponent } from './components/doctors/doctors.component';
import { AppointmentsComponent } from './components/appointments/appointments.component';
import { RecordsComponent } from './components/records/records.component';
import { BillingComponent } from './components/billing/billing.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, title: 'Dashboard | Praveen Clinic' },
  { path: 'patients', component: PatientsComponent, title: 'Patients | Praveen Clinic' },
  { path: 'doctors', component: DoctorsComponent, title: 'Doctors | Praveen Clinic' },
  { path: 'appointments', component: AppointmentsComponent, title: 'Appointments | Praveen Clinic' },
  { path: 'records', component: RecordsComponent, title: 'Medical Records | Praveen Clinic' },
  { path: 'billing', component: BillingComponent, title: 'Billing & Payments | Praveen Clinic' },
  { path: '**', redirectTo: 'dashboard' }
];
