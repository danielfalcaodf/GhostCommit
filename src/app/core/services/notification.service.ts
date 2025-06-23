import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Notification, NotificationType } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Adiciona uma nova notificação
   */
  addNotification(
    type: NotificationType,
    title: string,
    message: string,
    duration: number = 5000
  ): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      duration,
      timestamp: new Date()
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    // Auto-remove após o tempo especificado
    if (duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    }
  }

  /**
   * Remove uma notificação específica
   */
  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }

  /**
   * Limpa todas as notificações
   */
  clearAll(): void {
    this.notificationsSubject.next([]);
  }

  /**
   * Métodos de conveniência
   */
  success(title: string, message: string, duration?: number): void {
    this.addNotification(NotificationType.SUCCESS, title, message, duration);
  }

  error(title: string, message: string, duration?: number): void {
    this.addNotification(NotificationType.ERROR, title, message, duration);
  }

  warning(title: string, message: string, duration?: number): void {
    this.addNotification(NotificationType.WARNING, title, message, duration);
  }

  info(title: string, message: string, duration?: number): void {
    this.addNotification(NotificationType.INFO, title, message, duration);
  }

  // Métodos alternativos para compatibilidade
  showSuccess(message: string, duration?: number): void {
    this.success('Sucesso', message, duration);
  }

  showError(message: string, duration?: number): void {
    this.error('Erro', message, duration);
  }

  showWarning(message: string, duration?: number): void {
    this.warning('Aviso', message, duration);
  }

  showInfo(message: string, duration?: number): void {
    this.info('Informação', message, duration);
  }
}
