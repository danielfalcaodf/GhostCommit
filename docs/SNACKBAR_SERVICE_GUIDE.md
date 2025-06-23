# Service de Notificações com MatSnackBar - Guia de Uso

## ✅ **Service Implementado com Sucesso!**

### 📁 **Arquivo Criado:**
- `/src/app/core/services/snackbar-notification.service.ts`

### 🎯 **Como Usar em Qualquer Componente:**

#### **1. Importar o Service:**
```typescript
import { SnackBarNotificationService } from '../../core/services/snackbar-notification.service';

@Component({
  selector: 'app-qualquer-componente',
  // ...
})
export class QualquerComponent {
  constructor(
    private snackBarNotification: SnackBarNotificationService
  ) {}
}
```

#### **2. Usar os Métodos:**
```typescript
// ✅ Notificação de sucesso
this.snackBarNotification.showSuccess('Operação realizada com sucesso!');

// ❌ Notificação de erro
this.snackBarNotification.showError('Erro ao processar dados');

// ⚠️ Notificação de aviso
this.snackBarNotification.showWarning('Atenção: verifique os dados');

// ℹ️ Notificação informativa
this.snackBarNotification.showInfo('Informação importante');

// 🎨 Notificação personalizada
this.snackBarNotification.show({
  message: 'Mensagem customizada',
  action: 'OK',
  duration: 5000,
  panelClass: ['custom-snackbar'],
  horizontalPosition: 'center',
  verticalPosition: 'bottom'
});

// ❌ Fechar todas as notificações
this.snackBarNotification.dismiss();
```

### 🎨 **Estilos Disponíveis (já configurados globalmente):**

#### **Classes CSS no `styles.scss`:**
```scss
.success-snackbar {
  background-color: #4caf50 !important; // Verde
  color: white !important;
}

.error-snackbar {
  background-color: #f44336 !important; // Vermelho
  color: white !important;
}

.warning-snackbar {
  background-color: #ff9800 !important; // Laranja
  color: white !important;
}

.info-snackbar {
  background-color: #2196f3 !important; // Azul
  color: white !important;
}
```

### 🚀 **Vantagens do Service:**

#### **✅ Reutilização:**
- Um service para toda a aplicação
- Métodos consistentes em todos os componentes
- Configuração centralizada

#### **✅ Flexibilidade:**
- Durações personalizáveis por tipo
- Posicionamento configurável
- Estilos temáticos

#### **✅ Manutenibilidade:**
- Mudanças centralizadas no service
- Tipagem TypeScript completa
- Interface limpa e intuitiva

### 📋 **Exemplo Prático - Dashboard Component:**

```typescript
import { Component } from '@angular/core';
import { SnackBarNotificationService } from '../core/services/snackbar-notification.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  
  constructor(private snackBarNotification: SnackBarNotificationService) {}

  async saveData(): Promise<void> {
    try {
      // Simular operação async
      await this.dataService.save();
      this.snackBarNotification.showSuccess('Dados salvos com sucesso!');
    } catch (error) {
      this.snackBarNotification.showError('Erro ao salvar dados');
    }
  }

  loadRepository(): void {
    this.snackBarNotification.showInfo('Carregando repositório...');
    // ... lógica de carregamento
  }

  validateForm(): void {
    if (!this.isFormValid) {
      this.snackBarNotification.showWarning('Preencha todos os campos obrigatórios');
    }
  }
}
```

### 🎉 **Resultado Final:**

**✅ Service implementado e funcionando**  
**✅ Notificações push nativas do Material**  
**✅ Estilos coloridos por tipo**  
**✅ Reutilizável em toda aplicação**  
**✅ Configuração flexível**  
**✅ Build bem-sucedido**  

**Agora todos os componentes podem usar notificações push elegantes e consistentes!** 🚀

---

**Implementado em**: 22 de junho de 2025  
**Status**: ✅ **CONCLUÍDO**
