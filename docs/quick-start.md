# GhostCommit - Guia de Início Rápido

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 18+)
- npm ou yarn
- Rust (para Tauri)

### Instalação
```bash
# Clone o repositório
git clone <seu-repositorio>
cd GhostCommit

# Instale as dependências
npm install

# Para desenvolvimento Tauri, instale as dependências Rust
npm run tauri dev
```

## 🛠️ Comandos Principais

### Desenvolvimento Web
```bash
# Inicia o servidor de desenvolvimento Angular
npm start
# ou
npm run dev

# Aplicação estará disponível em: http://localhost:4200
```

### Desenvolvimento Desktop (Tauri)
```bash
# Inicia a aplicação Tauri em modo desenvolvimento
npm run tauri dev
```

### Build para Produção
```bash
# Build web
npm run build

# Build desktop
npm run tauri build
```

## 🎯 Navegação na Aplicação

### Páginas Disponíveis
1. **Dashboard** (`/dashboard`) - Página inicial com visão geral
2. **Editor** (`/editor`) - Editor de código completo com Monaco Editor

### Recursos do Editor
- **Múltiplas linguagens**: JavaScript, TypeScript, Python, Rust, JSON, HTML, CSS, SCSS
- **Temas**: Tema dark otimizado
- **Funcionalidades**:
  - Syntax highlighting
  - Auto-completion
  - Bracket matching
  - Code folding
  - Minimap
  - Busca e substituição

## 🎨 Personalização do Tema

### Alterando Cores
Edite o arquivo `src/styles/_variables.scss`:

```scss
// Cores primárias
--primary-color: #1e88e5;        // Azul principal
--accent-color: #03dac6;         // Verde água

// Cores de superfície
--surface-color: #1a1a1a;       // Cinza escuro
--background-color: #121212;     // Preto suave
```

### Modificando Tipografia
```scss
// Fontes
--font-family-primary: 'Roboto', sans-serif;
--font-family-mono: 'Roboto Mono', monospace;
```

## 🧩 Adicionando Novos Componentes

### 1. Feature Component
```bash
# Criar nova feature
mkdir src/app/features/nova-feature
touch src/app/features/nova-feature/nova-feature.component.ts
```

### 2. Shared Component
```bash
# Criar componente compartilhado
touch src/app/shared/components/novo-componente.component.ts
# Adicionar ao index.ts
echo "export * from './novo-componente.component';" >> src/app/shared/components/index.ts
```

### 3. Adicionando Rotas
Edite `src/app/app.routes.ts`:
```typescript
{
  path: 'nova-rota',
  loadComponent: () => import('./features/nova-feature/nova-feature.component').then(m => m.NovaFeatureComponent)
}
```

## 📱 Layout Responsivo

### Breakpoints Bootstrap
- `xs`: < 576px
- `sm`: ≥ 576px
- `md`: ≥ 768px
- `lg`: ≥ 992px
- `xl`: ≥ 1200px
- `xxl`: ≥ 1400px

### Uso do Grid
```html
<div class="container-fluid">
  <div class="row">
    <div class="col-md-6 col-lg-4">
      <!-- Conteúdo -->
    </div>
  </div>
</div>
```

## 🔧 Serviços Disponíveis

### NotificationService
```typescript
constructor(private notificationService: NotificationService) {}

// Usar notificações
this.notificationService.showSuccess('Sucesso!');
this.notificationService.showError('Erro!');
this.notificationService.showWarning('Aviso!');
this.notificationService.showInfo('Informação!');
```

### TauriService
```typescript
constructor(private tauriService: TauriService) {}

// Verificar se está em Tauri
if (this.tauriService.isTauri()) {
  // Código específico para desktop
}

// Usar comandos Tauri
this.tauriService.greet('Nome').subscribe(response => {
  console.log(response);
});
```

## 🎭 Monaco Editor

### Configuração Básica
```typescript
// No seu componente
editorOptions = {
  theme: 'vs-dark',
  language: 'javascript',
  automaticLayout: true,
  fontSize: 14,
  wordWrap: 'on'
};

// No template
<app-monaco-editor
  [language]="selectedLanguage"
  [code]="currentCode"
  [theme]="'vs-dark'"
  [options]="editorOptions"
  (codeChange)="onCodeChange($event)">
</app-monaco-editor>
```

### Linguagens Suportadas
- `javascript`
- `typescript`
- `python`
- `rust`
- `json`
- `html`
- `css`
- `scss`
- `markdown`
- E muitas outras...

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Monaco Editor não carrega
- Verifique se o CDN está acessível
- Confirme que os scripts estão no `index.html`
- Verifique console do navegador por erros

#### 2. Estilos não aplicados
- Verifique se os arquivos SCSS estão sendo importados
- Confirme que as variáveis CSS estão definidas
- Verifique se não há conflitos de especificidade

#### 3. Componentes não encontrados
- Verifique se o componente está no array `imports`
- Confirme que o caminho de importação está correto
- Para componentes standalone, não esqueça de exportá-los

#### 4. Erros de Build
```bash
# Limpar cache
rm -rf node_modules package-lock.json
npm install

# Verificar versões
npm list @angular/core
npm list @tauri-apps/cli
```

## 📚 Recursos Úteis

### Documentação
- [Angular](https://angular.io/docs)
- [Tauri](https://tauri.app/develop/)
- [Angular Material](https://material.angular.io/)
- [Bootstrap](https://getbootstrap.com/docs/5.3/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)

### Ferramentas de Desenvolvimento
- **Angular DevTools**: Chrome extension para debug
- **Tauri DevTools**: Debug da aplicação desktop
- **VS Code Extensions**: Angular Language Service, Tauri

### Comunidade
- [Angular Discord](https://discord.gg/angular)
- [Tauri Discord](https://discord.gg/tauri)
- [GitHub Issues](https://github.com/seu-usuario/GhostCommit/issues)

---

**Happy Coding! 🚀**
