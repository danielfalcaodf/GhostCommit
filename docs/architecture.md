# 🏗️ Arquitetura do Projeto

Este documento descreve a arquitetura técnica do GhostCommit, padrões de design utilizados e como os componentes interagem.

## 📋 Visão Geral da Arquitetura

GhostCommit segue uma arquitetura híbrida que combina:
- **Frontend**: SPA Angular com componentes standalone
- **Backend**: Aplicação Rust com Tauri para operações nativas
- **Comunicação**: IPC (Inter-Process Communication) via Tauri

```
┌─────────────────────┐    IPC     ┌─────────────────────┐
│                     │ Commands   │                     │
│    Angular SPA      │◄──────────►│   Rust Backend      │
│                     │  Events    │                     │
│ • Components        │            │ • Git Operations    │
│ • Services          │            │ • File System      │
│ • State Management  │            │ • Native APIs       │
└─────────────────────┘            └─────────────────────┘
```

## 🎯 Princípios de Design

### 1. **Separação de Responsabilidades**
- **Frontend**: UI, UX, estado da aplicação
- **Backend**: Operações Git, I/O, lógica de negócio pesada

### 2. **Reatividade**
- Uso extensivo de RxJS para programação reativa
- Estado centralizado com BehaviorSubject
- Comunicação assíncrona entre componentes

### 3. **Modularidade**
- Componentes standalone do Angular 19
- Modules bem definidos e organizados
- Reutilização de código maximizada

### 4. **Type Safety**
- TypeScript no frontend com strict mode
- Rust com tipagem estática no backend
- Interfaces compartilhadas entre frontend/backend

## 📁 Estrutura de Diretórios

```
ghostcommit/
├── src/                          # Frontend Angular
│   ├── app/
│   │   ├── core/                # Serviços principais
│   │   │   ├── services/        # Lógica de negócio
│   │   │   └── guards/          # Route guards
│   │   ├── shared/              # Código compartilhado
│   │   │   ├── models/          # Interfaces e tipos
│   │   │   ├── components/      # Componentes reutilizáveis
│   │   │   └── utils/           # Utilitários
│   │   ├── pages/               # Páginas/rotas principais
│   │   │   ├── git-compare/     # Comparação de commits
│   │   │   └── git-diff/        # Visualização de diff
│   │   └── layout/              # Layout da aplicação
│   ├── assets/                  # Recursos estáticos
│   └── styles/                  # Estilos globais SCSS
├── src-tauri/                   # Backend Rust
│   ├── src/
│   │   ├── commands/            # Comandos Tauri
│   │   ├── git/                 # Operações Git
│   │   ├── models/              # Estruturas de dados
│   │   └── utils/               # Utilitários Rust
│   ├── icons/                   # Ícones da aplicação
│   └── Cargo.toml               # Dependências Rust
├── docs/                        # Documentação
└── .github/                     # GitHub Actions e templates
```

## 🔧 Camadas da Aplicação

### 1. **Presentation Layer (Angular)**

#### Components
```typescript
// Componentes standalone com injeção de dependências
@Component({
  selector: 'app-git-compare',
  standalone: true,
  imports: [CommonModule, MatCardModule, ...],
  templateUrl: './git-compare.component.html'
})
export class GitCompareComponent {
  constructor(
    private gitService: GitService,
    private stateService: GitCompareStateService
  ) {}
}
```

#### Services
```typescript
// Serviços com padrão Singleton
@Injectable({ providedIn: 'root' })
export class GitService {
  private readonly commands = new Map<string, (...args: any[]) => Promise<any>>();
  
  async compareCommits(fromRef: string, toRef: string): Promise<GitComparisonResult> {
    return invoke<GitComparisonResult>('compare_commits', { fromRef, toRef });
  }
}
```

### 2. **Business Logic Layer (Services)**

#### State Management
```typescript
// Estado centralizado com RxJS
@Injectable({ providedIn: 'root' })
export class GitCompareStateService {
  private stateSubject = new BehaviorSubject<GitCompareState>({});
  public state$ = this.stateSubject.asObservable();
  
  updateState(partialState: Partial<GitCompareState>): void {
    const newState = { ...this.stateSubject.value, ...partialState };
    this.stateSubject.next(newState);
  }
}
```

### 3. **Data Layer (Tauri/Rust)**

#### Commands
```rust
// Comandos expostos para o frontend
#[tauri::command]
pub async fn get_repository_info(path: String) -> Result<GitRepository, String> {
    let repo = Repository::open(&path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;
    
    Ok(GitRepository::from_git2_repo(&repo)?)
}
```

#### Models
```rust
// Estruturas de dados compartilhadas
#[derive(Debug, Serialize, Deserialize)]
pub struct GitCommit {
    pub hash: String,
    pub message: String,
    pub author: GitAuthor,
    pub date: String,
}
```

## 🔄 Fluxo de Dados

### 1. **User Interaction Flow**
```
User Action → Component → Service → Tauri Command → Rust Logic
     ↓           ↓          ↓            ↓             ↓
   Event → State Update → IPC Call → Git Operation → Response
     ↑           ↑          ↑            ↑             ↑
UI Update ← Observable ← Service ← Tauri Event ← Result
```

### 2. **State Management Flow**
```typescript
// Exemplo de fluxo de comparação de commits
async compareCommits(): Promise<void> {
  // 1. Update UI state
  this.stateService.updateState({ loading: true });
  
  try {
    // 2. Call Tauri command
    const result = await this.gitService.compareCommits(refA, refB);
    
    // 3. Update state with result
    this.stateService.setComparisonResult(result);
    
    // 4. Navigate to diff view
    this.router.navigate(['/git-diff', ...params]);
  } catch (error) {
    // 5. Handle error state
    this.stateService.updateState({ error: error.message });
  } finally {
    // 6. Reset loading state
    this.stateService.updateState({ loading: false });
  }
}
```

## 📦 Módulos e Dependências

### Frontend Dependencies
```json
{
  "dependencies": {
    "@angular/core": "^19.2.14",          // Framework principal
    "@angular/material": "^19.2.18",      // UI components
    "@tauri-apps/api": "^2",              // Tauri integration
    "monaco-editor": "^0.52.2",           // Code editor
    "rxjs": "~7.8.2"                      // Reactive programming
  }
}
```

### Backend Dependencies
```toml
[dependencies]
tauri = { version = "2.0", features = ["..."] }  # Desktop framework
git2 = "0.18"                                    # Git operations
serde = { version = "1.0", features = ["derive"] } # Serialization
tokio = { version = "1", features = ["full"] }   # Async runtime
```

## 🎨 Padrões de Design Utilizados

### 1. **Observer Pattern**
- RxJS Observables para comunicação reativa
- BehaviorSubject para estado compartilhado

### 2. **Command Pattern**
- Tauri commands para operações do backend
- Encapsulamento de operações Git

### 3. **Facade Pattern**
- Services Angular como facade para Tauri commands
- Abstração da complexidade do backend

### 4. **Singleton Pattern**
- Services Angular com `providedIn: 'root'`
- Estado global da aplicação

### 5. **Strategy Pattern**
- Diferentes estratégias de diff (unified, side-by-side)
- Múltiplos formatadores de export

## 🔐 Segurança e Validação

### 1. **Input Validation**
```rust
// Validação no backend Rust
pub fn validate_repository_path(path: &str) -> Result<PathBuf, String> {
    let path_buf = PathBuf::from(path);
    
    if !path_buf.exists() {
        return Err("Path does not exist".to_string());
    }
    
    if !path_buf.is_dir() {
        return Err("Path is not a directory".to_string());
    }
    
    Ok(path_buf)
}
```

### 2. **Type Safety**
```typescript
// Interfaces compartilhadas entre frontend/backend
export interface GitComparisonResult {
  repository: GitRepository;
  diff: GitDiff;
  stats: GitDiffStats;
}
```

### 3. **Error Handling**
```typescript
// Tratamento padronizado de erros
export class ErrorHandlingService {
  handleError(error: any): Observable<never> {
    console.error('Operation failed:', error);
    this.notificationService.showError(error.message);
    return EMPTY;
  }
}
```

## 🚀 Performance e Otimizações

### 1. **Lazy Loading**
```typescript
// Carregamento tardio de rotas
const routes: Routes = [
  {
    path: 'git-compare',
    loadComponent: () => import('./pages/git-compare/git-compare.component')
      .then(m => m.GitCompareComponent)
  }
];
```

### 2. **Change Detection Strategy**
```typescript
// OnPush strategy para performance
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GitDiffComponent {
  // Usa observables para mudanças de estado
}
```

### 3. **Rust Optimizations**
```rust
// Operações assíncronas para não bloquear UI
#[tauri::command]
pub async fn get_large_diff(repo_path: String) -> Result<GitDiff, String> {
    tokio::task::spawn_blocking(move || {
        // Operação pesada em thread separada
        compute_diff(repo_path)
    }).await.map_err(|e| e.to_string())?
}
```

## 🧪 Testabilidade

### 1. **Dependency Injection**
```typescript
// Serviços injetáveis para facilitar mocking
@Injectable()
export class GitService {
  constructor(private http: HttpClient) {}
}

// Test
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [
      { provide: GitService, useValue: mockGitService }
    ]
  });
});
```

### 2. **Pure Functions**
```rust
// Funções puras em Rust para fácil teste
pub fn format_commit_message(message: &str, max_length: usize) -> String {
    if message.len() <= max_length {
        message.to_string()
    } else {
        format!("{}...", &message[..max_length])
    }
}
```

## 📈 Escalabilidade

### 1. **Modular Architecture**
- Cada funcionalidade em módulos separados
- Interfaces bem definidas entre módulos
- Facilita adição de novas funcionalidades

### 2. **Plugin System** (Planejado)
```typescript
// Interface para plugins futuros
export interface GitPlugin {
  name: string;
  version: string;
  initialize(context: PluginContext): Promise<void>;
  execute(command: string, args: any[]): Promise<any>;
}
```

---

*Este documento é atualizado conforme a evolução da arquitetura do projeto.*
