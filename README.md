# 👻 GhostCommit

<div align="center">

![GhostCommit Logo](https://img.shields.io/badge/👻-GhostCommit-blue?style=for-the-badge)
[![Version](https://img.shields.io/badge/version-0.1.0--dev-orange?style=for-the-badge)](https://github.com/danielfalcaodf/GhostCommit/releases)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-19-red?style=for-the-badge&logo=angular)](https://angular.io)
[![Tauri](https://img.shields.io/badge/Tauri-v2-blue?style=for-the-badge&logo=tauri)](https://tauri.app)

**Aplicativo desktop multiplataforma para análise avançada de repositórios Git**

[📖 Documentação](docs/README.md) • [🚀 Instalação](docs/installation.md) • [🤝 Contribuir](docs/contributing.md) • [📋 Issues](https://github.com/danielfalcaodf/GhostCommit/issues)

</div>

---

## ⚡ Sobre o Projeto

GhostCommit é uma aplicação moderna construída com **Angular 19** e **Tauri v2** que oferece uma interface intuitiva para análise avançada de repositórios Git. Compare commits, visualize diffs com syntax highlighting e analise mudanças com uma experiência desktop nativa.

> **⚠️ Status do Projeto**: **40% implementado** - Pronto para colaboração Open Source! Base sólida com funcionalidades centrais funcionais. [Análise completa do status](./docs/REAL_FEATURE_STATUS_REPORT.md)

## ✨ Funcionalidades

| Funcionalidade | Status | Descrição |
|---|---|---|
| 🔍 **Comparação de Commits** | 🚧 **Parcialmente Implementado** | Compare qualquer commit, branch ou tag - bugs na UX |
| 📊 **Visualização de Diff** | ✅ **Implementado** | Diffs com syntax highlighting e estatísticas |
| 🎨 **Interface Moderna** | ✅ **Implementado** | Tema dark com Material Design |
| 📝 **Monaco Editor** | ✅ **Implementado** | Editor integrado (engine do VS Code) |
| 🚀 **Performance Nativa** | ✅ **Implementado** | Aplicação desktop com Tauri v2 |
| 🔧 **Multiplataforma** | ✅ **Implementado** | Windows, macOS e Linux |
| 📱 **Design Responsivo** | ✅ **Implementado** | Interface adaptável |
| 🔄 **Estado Persistente** | ✅ **Implementado** | Navegação com estado preservado |
| 🔍 **Busca Avançada** | 🚧 **Parcialmente Implementado** | Filtros básicos funcionais, avançados em dev |
| 👤 **Anotação de Origem** | � **Em Desenvolvimento** | Backend pronto, frontend 75% restante |
| 📤 **Exportação** | � **Em Desenvolvimento** | Interface pronta, geração de arquivos faltando |  

## ⭐ Funcionalidades em Destaque

### 📍 Anotação de Origem (Git Blame)
> **Status Real:** Backend 100% implementado, frontend 25% (apenas conectar)

```typescript
// Backend YÁ IMPLEMENTADO em Rust:
pub fn get_file_blame(&self, path: &str, file_path: &str, commit_hash: Option<String>) -> Result<GitBlameInfo>

// Frontend - FALTA APENAS CONECTAR:
private loadBlameInfo() {
  // this.gitService.getFileBlame(this.fileComparison.file.path).subscribe(...)
}
```

**O que você poderá fazer:**
- 🔍 Ver exatamente **quando** cada linha foi adicionada/removida
- 👤 Identificar **quem** fez cada mudança
- 📝 Acessar a **mensagem do commit** completa
- ⏰ Visualizar **timeline** das alterações
- 🎨 **Cores por autor** para identificação visual

**Gap técnico:** 75% do trabalho já está pronto - apenas conectar o backend Rust ao frontend Angular.

## 🎯 Casos de Uso

- **📈 Análise de Mudanças**: Compare qualquer dois pontos no histórico Git
- **👥 Code Review**: Visualize mudanças entre versões de forma detalhada  
- **🔍 Auditoria de Código**: Rastreie quando e onde mudanças foram introduzidas
- **⚙️ Desenvolvimento**: Entenda o impacto de merges e features
- **🐛 Debugging**: Identifique quando bugs foram introduzidos

## 🚀 Início Rápido

```bash
# Clone o repositório
git clone https://github.com/danielfalcaodf/GhostCommit.git
cd GhostCommit

# Instale as dependências
npm install

# Desenvolvimento web (para testar UI)
npm start

# Desenvolvimento desktop (aplicação completa)
npm run tauri dev

# Build para produção
npm run tauri build
```

## 📚 Documentação

### 📖 Guias Principais
- **[📋 Visão Geral](docs/README.md)** - Documentação completa do projeto
- **[🚀 Instalação e Setup](docs/installation.md)** - Configure o ambiente de desenvolvimento
- **[🏗️ Arquitetura](docs/architecture.md)** - Estrutura técnica e design patterns
- **[🔧 Funcionalidades Git](docs/git-features.md)** - Guia detalhado das funcionalidades
- **[📋 Requisitos Funcionais](docs/functional-requirements.md)** - Especificação completa de funcionalidades
- **[🤝 Contribuindo](docs/contributing.md)** - Como contribuir para o projeto

### 🛠️ Para Desenvolvedores
- **[🧪 Testes](docs/testing.md)** - Estratégias e execução de testes
- **[� Início Rápido](docs/quick-start.md)** - Configure e execute em minutos
- **[🔧 Guias Técnicos](docs/)** - Documentação técnica adicional

## 🎨 Preview da Interface

### Dashboard Principal
```
┌─────────────────────────────────────────┐
│ 👻 GhostCommit                          │
├─────────────────────────────────────────┤
│ [📁 Abrir Repositório] [🔍 Comparar]    │
│                                         │
│ 📊 Estatísticas Rápidas                │
│ • Branches: 12  • Tags: 5              │
│ • Commits: 245  • Contribuidores: 3     │
└─────────────────────────────────────────┘
```

### Comparação de Commits
```
┌─────────────────────────────────────────┐
│ Branch A: [main ▼]  vs  Branch B: [dev ▼] │
│ Commit A: [abc123] vs   Commit B: [def456] │
├─────────────────────────────────────────┤
│ 📊 3 arquivos alterados                 │
│ +24 inserções  -12 remoções             │
│                                         │
│ 📁 src/components/                      │
│   ├── 📄 git-compare.component.ts  M   │
│   ├── 📄 git-diff.component.ts     A   │
│   └── 📄 old-component.ts          D   │
└─────────────────────────────────────────┘
```

## 💻 Trechos de Código Relevantes

### Arquitetura do Estado (State Management)
```typescript
// core/services/git-compare-state.service.ts
@Injectable({ providedIn: 'root' })
export class GitCompareStateService {
  private stateSubject = new BehaviorSubject<GitCompareState>({});
  
  setCommitsA(commits: GitCommit[]): void {
    this.updateState({ commitsA: commits });
  }
  
  // Estado persistente entre navegações
  restoreState(): GitCompareState {
    return this.stateSubject.value;
  }
}
```

### Integração Tauri/Rust para Operações Git
```rust
// src-tauri/src/git/operations.rs
#[tauri::command]
pub async fn compare_commits(
    repo_path: String,
    from_ref: String, 
    to_ref: String
) -> Result<GitComparisonResult, String> {
    let repo = Repository::open(&repo_path)
        .map_err(|e| e.to_string())?;
    
    // Lógica otimizada para comparação
    let diff = get_commit_diff(&repo, &from_ref, &to_ref)?;
    Ok(build_comparison_result(diff))
}
```

### Componente Angular com Material Design
```typescript
// pages/git-compare/git-compare.component.ts
export class GitCompareComponent implements OnInit {
  // Estado reativo com RxJS
  commitsA$ = this.stateService.state$.pipe(
    map(state => state.commitsA || [])
  );
  
  async compareCommits(): Promise<void> {
    const result = await this.gitService
      .compareCommits(this.selectedRefA, this.selectedRefB)
      .toPromise();
    
    this.stateService.setComparisonResult(result);
  }
}
```

## 🛠️ Stack Tecnológica

### Frontend
- **Angular 19** - Framework SPA moderno
- **Angular Material** - Componentes UI consistentes  
- **RxJS** - Programação reativa
- **Monaco Editor** - Editor de código avançado
- **TypeScript** - Tipagem estática

### Backend/Desktop
- **Tauri v2** - Framework para apps desktop
- **Rust** - Performance e segurança
- **Git2** - Integração nativa com Git
- **Serde** - Serialização eficiente

### Ferramentas de Desenvolvimento
- **Angular CLI** - Tooling do Angular
- **Tauri CLI** - Build e desenvolvimento
- **ESLint + Prettier** - Qualidade de código
- **Cargo** - Gerenciador de pacotes Rust

## 🤝 Como Contribuir

Contribuições são muito bem-vindas! Este projeto segue o modelo de desenvolvimento aberto:

### 🎯 Áreas que Precisam de Ajuda - Status Real
- 🐛 **Bug Reports**: Teste e reporte problemas (especialmente seleção de refs)
- ✨ **Conectar Funcionalidades**: Git Blame (backend pronto), Side-by-Side viewer (50% pronto)
- 📚 **Documentação**: Melhore docs e exemplos
- 🧪 **Testes**: Adicione cobertura de testes (atualmente insuficiente)
- 🎨 **UI/UX**: Finalize side-by-side viewer, melhore filtros avançados
- 🚀 **Performance**: Otimizações para repositórios grandes

### ⚡ **Issues Prioritárias (Fáceis para Iniciantes)**
1. **Conectar Git Blame** - Backend 100% pronto, frontend precisa apenas de integração
2. **Finalizar Side-by-Side Viewer** - Interface já existe, falta sincronização de scroll
3. **Corrigir bugs de seleção de refs** - UX crítica, código já identificado
4. **Adicionar testes** - Estrutura Angular pronta, falta implementação

> **🎁 Oportunidade:** Muitas funcionalidades precisam apenas "conectar os pontos" entre código existente!

### 🔄 Processo de Contribuição
1. **Fork** o repositório
2. **Clone** seu fork localmente  
3. **Crie** uma branch para sua feature (`git checkout -b feature/nova-feature`)
4. **Desenvolva** seguindo nossos padrões de código
5. **Teste** suas mudanças
6. **Commit** com mensagens descritivas
7. **Push** e abra um **Pull Request**

Leia o guia completo em [docs/contributing.md](docs/contributing.md)

## 🐛 Reportar Problemas

Encontrou um bug? Abra uma [issue](https://github.com/danielfalcaodf/GhostCommit/issues) com:
- 📝 Descrição clara do problema
- 🔄 Passos para reproduzir
- 💻 Informações do sistema (OS, versão do Node, etc.)
- 📱 Screenshots se aplicável

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja [LICENSE](LICENSE) para detalhes.

## 🔗 Links Úteis

- [Angular Documentation](https://angular.io/docs)
- [Tauri Documentation](https://tauri.app/develop/)  
- [Angular Material](https://material.angular.io/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Rust Lang](https://www.rust-lang.org/)

## 🏆 Reconhecimentos

- **Angular Team** - Framework incrível
- **Tauri Team** - Possibilitando apps desktop com web tech
- **Git Community** - Inspiração para funcionalidades

---

<div align="center">

**Desenvolvido com ❤️ para a comunidade de desenvolvedores**

[![⭐ Star no GitHub](https://img.shields.io/github/stars/danielfalcaodf/ghostcommit?style=social)](https://github.com/danielfalcaodf/ghostcommit)
[![🍴 Fork](https://img.shields.io/github/forks/danielfalcaodf/ghostcommit?style=social)](https://github.com/danielfalcaodf/GhostCommit/fork)

</div>
