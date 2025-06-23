# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- � **Anotação de Origem (Git Blame)** - Para cada linha ± exibir commit, autor, data
- �📤 Export de relatórios (HTML, Markdown, PDF)
- 🔍 Busca avançada em histórico com pickaxe (-S/-G)
- 📊 Métricas e estatísticas avançadas
- 🤝 Integração com GitHub/GitLab
- 🎨 Temas personalizáveis e sincronização com SO
- 🌐 Suporte a repositórios remotos
- ⚡ Otimizações de performance (virtual scrolling, cache)

## [0.1.0-dev] - 2025-06-22

### Added - ✨ Funcionalidades
- 🏠 Dashboard principal com abertura de repositórios
- 🔍 Comparação de commits entre branches, tags e commits específicos
- 📊 Visualização de estatísticas de diff (arquivos, inserções, remoções)
- 📝 Visualizador de diff com Monaco Editor e syntax highlighting
- 🔄 Sistema de estado persistente entre navegações
- 🔍 Busca e filtros para branches e commits
- 📱 Interface responsiva com Material Design
- 🌙 Tema dark otimizado
- 📁 Navegação entre páginas com estado preservado
- 🎨 Design moderno com Angular Material

### Technical - 🛠️ Implementação Técnica
- 🏗️ Arquitetura Angular 19 + Tauri v2
- 📦 Componentes standalone do Angular
- 🦀 Backend Rust com operações Git nativas
- 📡 Comunicação IPC entre frontend e backend
- 🔄 State management com RxJS e BehaviorSubject
- 🎯 TypeScript com strict mode
- 🧪 Configuração de testes unitários
- 📚 Documentação completa do projeto

### Backend Commands - 🦀 Comandos Tauri
- `open_repository` - Abrir repositório Git
- `get_repository_info` - Informações do repositório
- `get_all_refs` - Buscar todas as referências
- `get_branches` - Buscar branches
- `get_tags` - Buscar tags
- `get_commits` - Buscar commits de uma branch
- `compare_commits` - Comparar dois commits
- `get_file_diff` - Diff de arquivo específico

### Models Synchronization - 🔄 Sincronização
- 📝 Models TypeScript e Rust sincronizados
- 🐍 Conversão para snake_case em todos os campos
- 🔗 Interfaces compartilhadas entre frontend/backend
- ✅ Validação de tipos em tempo de compilação

### UI/UX Features - 🎨 Interface
- 🔍 Seletores com busca para branches e commits
- 📊 Cards estatísticos com informações visuais
- 📁 Lista hierárquica de arquivos alterados
- 🏷️ Status visual para mudanças (A/D/M/R)
- 🔍 Filtros por nome de arquivo e status
- 📝 Monaco Editor com 30+ linguagens suportadas
- 🔙 Botão voltar com restauração de estado

### Developer Experience - 👨‍💻 Experiência do Desenvolvedor  
- 📚 Documentação completa em português
- 🤝 Guias de contribuição detalhados
- 🧪 Setup de testes unitários e E2E
- 🔧 Templates para Issues e Pull Requests
- 📋 Estrutura de projeto bem organizada
- 🛠️ Scripts de desenvolvimento automatizados

## [0.0.1] - 2025-06-01

### Added
- 🎯 Projeto inicial criado
- 🏗️ Configuração base Angular + Tauri
- 📦 Dependências principais instaladas
- 🎨 Setup do Angular Material
- 🦀 Configuração inicial do Rust/Tauri

---

## Tipos de Mudanças

- ✨ **Added** - para novas funcionalidades
- 🔄 **Changed** - para mudanças em funcionalidades existentes  
- 🔧 **Fixed** - para correções de bugs
- ⚠️ **Deprecated** - para funcionalidades que serão removidas
- ❌ **Removed** - para funcionalidades removidas
- 🔒 **Security** - para correções de segurança

## Versionamento

Este projeto usa [Semantic Versioning](https://semver.org/):

- **MAJOR** version quando há mudanças incompatíveis na API
- **MINOR** version quando há funcionalidades adicionadas de forma compatível
- **PATCH** version quando há correções de bugs compatíveis

### Pre-release Tags
- `alpha` - Versão muito inicial, pode ter bugs significativos
- `beta` - Versão de teste, funcionalidades principais implementadas
- `rc` - Release Candidate, versão final sendo testada
- `dev` - Versão de desenvolvimento, não estável

## Links

- [Repositório](https://github.com/danielfalcaodf/ghostcommit)
- [Issues](https://github.com/danielfalcaodf/GhostCommit/issues)  
- [Pull Requests](https://github.com/danielfalcaodf/GhostCommit/pulls)
- [Releases](https://github.com/danielfalcaodf/GhostCommit/releases)
