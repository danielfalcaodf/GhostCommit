import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export interface NotificationConfig {
  message: string;
  action?: string;
  duration?: number;
  panelClass?: string[];
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
}

@Injectable({
  providedIn: 'root'
})
export class SnackBarNotificationService {
  
  private defaultConfig: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'end',
    verticalPosition: 'top'
  };

  constructor(private snackBar: MatSnackBar) {}

  /**
   * Exibe notificação de sucesso
   */
  showSuccess(message: string, action: string = 'Fechar', duration: number = 4000): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      duration,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Exibe notificação de erro
   */
  showError(message: string, action: string = 'Fechar', duration: number = 6000): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      duration,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Exibe notificação de aviso
   */
  showWarning(message: string, action: string = 'Fechar', duration: number = 5000): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      duration,
      panelClass: ['warning-snackbar']
    });
  }

  /**
   * Exibe notificação informativa
   */
  showInfo(message: string, action: string = 'Fechar', duration: number = 3000): void {
    this.snackBar.open(message, action, {
      ...this.defaultConfig,
      duration,
      panelClass: ['info-snackbar']
    });
  }

  /**
   * Exibe notificação personalizada
   */
  show(config: NotificationConfig): void {
    const snackBarConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      duration: config.duration,
      panelClass: config.panelClass,
      horizontalPosition: config.horizontalPosition,
      verticalPosition: config.verticalPosition
    };

    this.snackBar.open(config.message, config.action || 'Fechar', snackBarConfig);
  }

  /**
   * Fecha todas as notificações ativas
   */
  dismiss(): void {
    this.snackBar.dismiss();
  }
}
