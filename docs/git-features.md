# 🔧 Funcionalidades Git

Este documento detalha todas as funcionalidades Git do GhostCommit, como usar cada uma e exemplos práticos.

## 🎯 Visão Geral

GhostCommit oferece uma interface intuitiva para operações avançadas de análise Git, permitindo comparar commits, visualizar diffs e analisar mudanças de forma eficiente.

## 📋 Funcionalidades Implementadas

### 1. 🏠 Dashboard

#### Abertura de Repositório
```typescript
// Funcionalidade principal
- Selecionar pasta do repositório Git
- Validação automática de repositório válido
- Carregamento de informações básicas
- Detecção da branch atual
```

#### Informações do Repositório
- **Nome do repositório**
- **Caminho local**
- **Branch atual**
- **Status básico**

### 2. 🔍 Comparação de Commits

#### Seleção de Referências
```typescript
// Tipos de referência suportados
interface GitRef {
  name: string;
  type: 'branch' | 'tag' | 'commit';
  hash: string;
  display_name: string;
}
```

**Funcionalidades:**
- ✅ Seleção de branches (locais e remotas)
- ✅ Seleção de tags
- ✅ Seleção de commits específicos
- ✅ Busca e filtro em tempo real
- ✅ Auto-complete inteligente

#### Interface de Comparação
```bash
┌─────────────────────────────────────────────────────────┐
│ Branch A: [main ▼]           Branch B: [develop ▼]     │
├─────────────────────────────────────────────────────────┤
│ Commit A: [abc123 - Feature X]  Commit B: [def456...]  │
├─────────────────────────────────────────────────────────┤
│ [🔍 Comparar Commits]                                   │
└─────────────────────────────────────────────────────────┘
```

### 3. 📊 Visualização de Diferenças

#### Estatísticas de Diff
```typescript
interface GitDiffStats {
  total_files: number;
  total_insertions: number;
  total_deletions: number;
  files_changed: number;
}
```

**Exibição:**
- 📈 Número total de arquivos alterados
- ➕ Total de linhas inseridas
- ➖ Total de linhas removidas
- 📊 Gráfico visual das mudanças

#### Lista de Arquivos
```typescript
interface GitFileDiff {
  old_path: string;
  new_path: string;
  status: 'added' | 'deleted' | 'modified' | 'renamed';
  insertions: number;
  deletions: number;
  is_binary: boolean;
}
```

**Funcionalidades:**
- 📁 Lista hierárquica de arquivos
- 🏷️ Status visual (A/D/M/R)
- 🔍 Filtro por nome de arquivo
- 🏷️ Filtro por status de mudança
- 📊 Estatísticas por arquivo

### 4. 📝 Visualizador de Diff

#### Monaco Editor Integration
```typescript
// Configuração do editor
const editorOptions = {
  readOnly: true,
  theme: 'vs-dark',
  language: 'typescript', // Auto-detectado
  minimap: { enabled: true },
  scrollBeyondLastLine: false
};
```

**Funcionalidades:**
- 🎨 Syntax highlighting para 30+ linguagens
- 🔍 Busca e navegação no diff
- 📱 Interface responsiva
- 🌙 Tema dark otimizado
- 📋 Cópia de código
- 🔗 Links para linhas específicas

#### Navegação entre Arquivos
- ⬅️ Voltar para lista de arquivos
- 🔄 Estado preservado ao navegar
- 📍 Breadcrumb navigation
- ⌨️ Atalhos de teclado

### 5. 🔍 Busca e Filtros

#### Filtros de Branches
```typescript
// Implementação de filtro reativo
filterBranches(searchTerm: string): GitRef[] {
  return this.branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}
```

#### Filtros de Commits
```typescript
// Busca em múltiplos campos
filterCommits(searchTerm: string): GitCommit[] {
  return this.commits.filter(commit =>
    commit.hash.includes(searchTerm) ||
    commit.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    commit.author.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
}
```

**Campos de Busca:**
- 🔍 Hash do commit (parcial)
- 📝 Mensagem do commit
- 👤 Nome do autor
- 📧 Email do autor
- 🏷️ Nome da branch

### 6. 💾 Gerenciamento de Estado

#### Estado Persistente
```typescript
interface GitCompareState {
  repository?: GitRepository;
  repositoryPath?: string;
  selectedRefA?: string;
  selectedRefB?: string;
  selectedBranchRefA?: string;
  selectedBranchRefB?: string;
  commitsA?: GitCommit[];
  commitsB?: GitCommit[];
  comparisonResult?: GitComparisonResult;
}
```

**Funcionalidades:**
- 🔄 Estado preservado entre navegações
- 💾 Cache de commits carregados
- 🔙 Restauração automática ao voltar
- 📱 Experiência fluida de navegação

## 🛠️ Comandos Tauri Disponíveis

### Repositório
```rust
#[tauri::command]
pub async fn open_repository(path: String) -> Result<GitRepository, String>

#[tauri::command]
pub async fn get_repository_info(path: String) -> Result<GitRepository, String>
```

### Referências
```rust
#[tauri::command]
pub async fn get_all_refs(repo_path: String) -> Result<Vec<GitRef>, String>

#[tauri::command]
pub async fn get_branches(repo_path: String) -> Result<Vec<GitRef>, String>

#[tauri::command]
pub async fn get_tags(repo_path: String) -> Result<Vec<GitRef>, String>
```

### Commits
```rust
#[tauri::command]
pub async fn get_commits(
    repo_path: String,
    limit: usize,
    offset: usize,
    ref_name: Option<String>
) -> Result<Vec<GitCommit>, String>

#[tauri::command]
pub async fn get_commit_details(
    repo_path: String,
    commit_hash: String
) -> Result<GitCommit, String>
```

### Comparação
```rust
#[tauri::command]
pub async fn compare_commits(
    repo_path: String,
    from_ref: String,
    to_ref: String
) -> Result<GitComparisonResult, String>

#[tauri::command]
pub async fn get_file_diff(
    repo_path: String,
    file_path: String,
    from_ref: String,
    to_ref: String
) -> Result<GitFileDiff, String>
```

## 🎯 Casos de Uso Práticos

### 1. Comparar Feature Branch com Main
```bash
# Cenário: Analisar mudanças antes de merge
1. Abrir repositório do projeto
2. Selecionar Branch A: main
3. Selecionar Branch B: feature/nova-funcionalidade
4. Comparar commits
5. Analisar arquivos alterados
6. Visualizar diffs específicos
```

### 2. Auditoria de Release
```bash
# Cenário: Verificar mudanças entre versões
1. Selecionar Tag A: v1.0.0
2. Selecionar Tag B: v1.1.0
3. Exportar relatório de mudanças
4. Analisar impacto por arquivo
```

### 3. Debug de Problema
```bash
# Cenário: Identificar quando bug foi introduzido
1. Selecionar commit conhecido bom
2. Selecionar commit com problema
3. Analisar mudanças suspeitas
4. Focar em arquivos específicos
```

### 4. Code Review
```bash
# Cenário: Revisar Pull Request
1. Comparar branch do PR com main
2. Usar filtros para focar em arquivos relevantes
3. Analisar linha por linha
4. Usar Monaco Editor para contexto
```

## 📈 Funcionalidades Planejadas

### 🚧 Em Desenvolvimento
- **📤 Exportação de Relatórios**
  - HTML com styling personalizado
  - Markdown para documentação
  - CSV para análise de dados
  - PDF para apresentações

- **📍 Anotação de Origem (Git Blame)**
  - Para cada linha ± exibir commit, autor, data de introdução/remoção
  - Interface visual com hover tooltips
  - Cores diferentes por autor
  - Cache otimizado para performance
  - Timeline visual das mudanças

### 📋 Roadmap Futuro
- **🔍 Busca Avançada**
  - Busca por data de commit
  - Filtro por tipo de arquivo
  - Busca em conteúdo de diff
  - Pesquisa histórica (pickaxe -S/-G)

- **� Anotação de Origem Avançada**
  - Painel lateral de blame detalhado
  - Navegação por histórico de linha
  - Comparação de blame entre commits
  - Métricas de autoria por arquivo
  - Heatmap de contribuições

- **�📊 Análise Estatística**
  - Métricas de contribuidor
  - Análise de hotspots
  - Gráficos de atividade
  - Distribuição por tipo de arquivo

- **🤝 Integração com Plataformas**
  - GitHub Pull Requests
  - GitLab Merge Requests
  - Bitbucket integrations

- **⚡ Otimizações de Performance**
  - Lazy loading de commits
  - Virtual scrolling
  - Cache inteligente de blame
  - Processamento em background

## 🐛 Limitações Conhecidas

### Atual (v0.1.0-dev)
- ⚠️ Apenas repositórios locais suportados
- ⚠️ Limite de 1000 commits por branch
- ⚠️ Arquivos binários não são analisados
- ⚠️ Diff de arquivos muito grandes pode ser lento

### Workarounds
```bash
# Para repositórios grandes
git config diff.algorithm patience

# Para arquivos binários
git config diff.binary true

# Para melhor performance
git config core.preloadindex true
```

## 🔧 Configurações Avançadas

### Git Configuration
```bash
# Melhor algoritmo de diff
git config --global diff.algorithm histogram

# Melhor performance
git config --global core.preloadindex true
git config --global core.fscache true

# Melhor visualização
git config --global diff.colorMoved zebra
```

### Tauri Configuration
```json
{
  "tauri": {
    "allowlist": {
      "fs": {
        "all": false,
        "readFile": true,
        "readDir": true
      }
    }
  }
}
```

## 📚 Exemplos de Código

### Comparação Programática
```typescript
// Exemplo de uso da API
const result = await this.gitService.compareCommits(
  'HEAD~5',  // 5 commits atrás
  'HEAD'     // Commit atual
);

console.log(`${result.diff.stats.total_files} arquivos alterados`);
console.log(`+${result.diff.stats.total_insertions} linhas`);
console.log(`-${result.diff.stats.total_deletions} linhas`);
```

### Filtro Personalizado
```typescript
// Filtrar apenas arquivos TypeScript
const tsFiles = result.diff.files.filter(file => 
  file.new_path.endsWith('.ts') || file.new_path.endsWith('.tsx')
);
```

---

*Para mais detalhes técnicos, consulte a [Arquitetura do Projeto](architecture.md)*
