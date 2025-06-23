# Componentes UI Angular Material

Este documento descreve os componentes UI criados e melhorados para o GhostCommit, seguindo as especificações do Angular Material e padrões de design moderno.

## 🏗️ Arquitetura dos Componentes

Todos os componentes foram desenvolvidos como **standalone components** usando Angular 19, facilitando a reutilização e reduzindo a complexidade de imports.

## 📋 Componentes Implementados

### 1. 🧭 Navigation Shell (`navigation-shell.component.ts`)

**Funcionalidade:** Shell de navegação principal com mat-sidenav + mat-toolbar

**Características:**
- **mat-sidenav** com modo side/over/push responsivo
- **mat-toolbar** principal com título dinâmico
- **Informações do repositório** com status visual
- **Menu de navegação** hierárquico com badges
- **Quick actions** na toolbar
- **Responsivo** com breakpoints para mobile

**Inputs:**
- `currentRepository`: GitRepository | null
- `navigationItems`: NavigationItem[]
- `quickActions`: NavigationItem[]
- `pageTitle`: string
- `pageSubtitle`: string
- `sidenavMode`: 'over' | 'push' | 'side'
- `sidenavOpened`: boolean

**Outputs:**
- `navigationChange`: EventEmitter<NavigationItem>
- `sidenavToggle`: EventEmitter<boolean>

**Exemplo de uso:**
```typescript
<app-navigation-shell
  [currentRepository]="currentRepository"
  [navigationItems]="navigationItems"
  [quickActions]="quickActions"
  [pageTitle]="pageTitle"
  [pageSubtitle]="pageSubtitle"
  (navigationChange)="onNavigationChange($event)"
  (sidenavToggle)="onSidenavToggle($event)">
  
  <div slot="toolbar-actions">
    <!-- Ações customizadas da toolbar -->
  </div>

  <!-- Conteúdo da página -->
  <router-outlet></router-outlet>
</app-navigation-shell>
```

### 2. 📁 Repo Selector (`repo-selector.component.ts`)

**Funcionalidade:** Autocomplete (mat-autocomplete) para seleção de caminho local de repositório

**Características:**
- **mat-autocomplete** com filtragem inteligente
- **Chips de repositórios recentes** com mat-chip-listbox
- **Validação** de caminho de repositório
- **Browse folder** com integração Tauri
- **Debounce** na busca para performance

**Features:**
- Autocomplete com sugestões baseadas em histórico
- Validação automática de repositórios Git
- Interface para navegar em pastas
- Cache de repositórios recentes
- Indicadores visuais de status (válido/inválido)

### 3. 🎯 Commit Picker (`commit-picker.component.ts`)

**Funcionalidade:** mat-form-field + mat-select com chips para seleção de commits A/B

**Características:**
- **Seleção dupla** para comparação A vs B
- **mat-chips** com indicadores visuais A/B
- **Agrupamento** por tipo (commits, branches, tags)
- **Quick actions** para seleções comuns
- **Validação** de seleção para comparação

**Features:**
- Chips coloridos para identificar A (base) e B (target)
- Agrupamento inteligente de referências Git
- Ações rápidas (HEAD vs branch, tag vs tag, etc.)
- Validação para evitar comparações inválidas
- Interface clara com ícones por tipo de referência

### 4. 🌳 File Tree (`file-tree.component.ts`)

**Funcionalidade:** mat-tree (nested) + status badges para navegação em arquivos modificados

**Características:**
- **mat-tree aninhada** com estrutura hierárquica
- **Status badges** coloridos (success/danger/warning)
- **Filtros** por tipo de modificação
- **Estatísticas** de inserções/deleções
- **Expansão/colapso** inteligente

**Features:**
- Badges de status: Adicionado (verde), Modificado (azul), Removido (vermelho)
- Contadores de linhas adicionadas/removidas por arquivo
- Filtros: Todos, Adicionados, Modificados, Removidos
- Ícones específicos por tipo de arquivo
- Indicadores para arquivos binários

### 5. 🔍 Diff Viewer (`diff-viewer.component.ts`)

**Funcionalidade:** Visualizador de diferenças com Monaco Editor e overlay de blame

**Características:**
- **Três modos de visualização:** Unificado, Side-by-Side, Por Seções
- **Monaco Editor** integrado com syntax highlighting
- **Overlay de blame** usando mat-tooltip
- **Controles de visualização** (quebra de linha, whitespace, blame)
- **Download de diff** em formato patch

**Features:**
- **Tab "Diff Unificado":** Visualização tradicional de diff
- **Tab "Side by Side":** Comparação lado a lado
- **Tab "Por Seções":** Visualização por hunks/seções
- **Mat-tooltip para blame:** SHA, autor, data, mensagem do commit
- **Controles visuais:** Toggle blame, quebra de linha, espaços em branco
- **Syntax highlighting** baseado na extensão do arquivo

**Overlay de Blame:**
- Usa **mat-tooltip** nativo do Angular Material
- Exibe informações detalhadas: commit SHA, autor, data, mensagem
- Ativado/desativado via toggle no menu de configurações
- Tooltip formatado com fonte mono para melhor legibilidade

## 🎨 Tema e Estilo

### Variáveis SCSS Utilizadas:
- `--surface-color`: Cor de fundo dos componentes
- `--primary-color`: Cor primária do tema
- `--success-color`: Verde para adições
- `--error-color`: Vermelho para remoções
- `--warning-color`: Amarelo para modificações
- `--outline-color`: Bordas e divisores

### Classes de Status:
- `.status-added`: Cor verde para arquivos adicionados
- `.status-modified`: Cor azul para arquivos modificados
- `.status-deleted`: Cor vermelha para arquivos removidos
- `.status-renamed`: Cor amarela para arquivos renomeados

## 🔗 Integração entre Componentes

### Fluxo de Dados:
1. **Navigation Shell** → Fornece contexto geral da aplicação
2. **Repo Selector** → Seleciona repositório → Atualiza Navigation Shell
3. **Commit Picker** → Seleciona commits A/B → Dispara comparação
4. **File Tree** → Lista arquivos modificados → Seleciona arquivo
5. **Diff Viewer** → Exibe diferenças do arquivo selecionado

### Comunicação:
- **@Input/@Output** para comunicação pai-filho
- **Services** para estado compartilhado (GitService)
- **EventEmitters** para ações do usuário

## 📱 Responsividade

### Breakpoints:
- **Desktop (>768px):** Sidenav sempre visível, layout completo
- **Tablet (<=768px):** Sidenav como overlay, controles adaptados
- **Mobile (<=480px):** Interface compacta, tooltips reduzidos

### Adaptações:
- Navigation shell com modo overlay em mobile
- File tree com layout vertical compacto
- Diff viewer com tabs responsivas
- Toolbar com ações priorizadas

## 🧪 Testes e Validação

### Build Status:
✅ **Build bem-sucedido** sem erros de compilação
✅ **Todos os componentes** exportados corretamente
✅ **Standalone components** funcionando independentemente
✅ **Material Design** seguindo as guidelines oficiais

### Warnings:
⚠️ Bundle size warnings (dentro do esperado para aplicação Angular Material)
⚠️ CSS budget warnings (estilos ricos para interface profissional)

## 🚀 Próximos Passos

### Funcionalidades Pendentes:
1. **Integração Tauri**: Implementar comandos Git reais no backend Rust
2. **Blame real**: Carregar informações de blame via GitService
3. **Performance**: Otimizar carregamento de arquivos grandes
4. **Testes unitários**: Implementar testes para todos os componentes
5. **Documentação de API**: Expandir documentação técnica

### Melhorias Planejadas:
- Drag & drop para repositórios
- Syntax highlighting avançado (Prism.js)
- Comparação de múltiplos commits
- Export de relatórios de comparação
- Integração com GitHub/GitLab APIs

---

*Documentação gerada para GhostCommit v0.1.0 - Angular 19 + Material Design*
