# 📚 Documentação GhostCommit

Bem-vindo à documentação completa do **GhostCommit**! Este é o ponto central para todas as informações sobre o projeto.

## 🎯 Visão Geral

GhostCommit é uma aplicação desktop construída com **Angular 19** e **Tauri v2** que oferece análise avançada de repositórios Git com interface moderna e intuitiva.

### Status do Projeto
- **Versão**: 0.1.0-dev (em desenvolvimento ativo)
- **Licença**: MIT
- **Linguagens**: TypeScript, Rust
- **Plataformas**: Windows, macOS, Linux

## 📋 Índice da Documentação

### 🚀 Primeiros Passos
- **[Instalação e Setup](installation.md)** - Configure seu ambiente de desenvolvimento
- **[Guia de Início Rápido](quick-start.md)** - Execute o projeto em minutos
- **[Requisitos Funcionais](functional-requirements.md)** - Especificação completa de funcionalidades

### 🏗️ Arquitetura e Desenvolvimento
- **[Arquitetura do Projeto](architecture.md)** - Estrutura técnica e padrões
- **[Funcionalidades Git](git-features.md)** - Guia detalhado das funcionalidades
- **[State Management](state-management.md)** - Gerenciamento de estado (planejado)

### 🛠️ Desenvolvimento
- **[Guia de Contribuição](contributing.md)** - Como contribuir para o projeto
- **[Padrões de Código](coding-standards.md)** - Convenções e boas práticas
- **[Testes](testing.md)** - Estratégias de teste e execução
- **[Debug e Troubleshooting](debugging.md)** - Resolução de problemas

### 🚀 Deploy e Distribuição
- **[Build e Release](build-release.md)** - Processo de build e distribuição
- **[CI/CD](ci-cd.md)** - Integração e deploy contínuo

## 🔧 Stack Tecnológica

### Frontend (Angular 19)
- **Framework**: Angular 19 com Standalone Components
- **UI Library**: Angular Material
- **Styling**: SCSS com Material Theming
- **State**: RxJS com BehaviorSubject
- **Editor**: Monaco Editor (VS Code engine)

### Backend (Tauri v2 + Rust)
- **Framework**: Tauri v2
- **Language**: Rust 2021 edition
- **Git Integration**: git2-rs
- **Serialization**: Serde
- **Async**: Tokio

### Development Tools
- **Package Manager**: npm, Cargo
- **Build Tools**: Angular CLI, Tauri CLI
- **Linting**: ESLint, Clippy
- **Formatting**: Prettier, rustfmt

## 🎯 Funcionalidades Principais

### ✅ Implementadas
- **Comparação de Commits**: Compare commits, branches, tags
- **Visualização de Diffs**: Syntax highlighting, estatísticas
- **Interface Responsiva**: Material Design, tema dark
- **Estado Persistente**: Navegação com estado preservado
- **Busca e Filtros**: Filtros avançados para commits e branches
- **Monaco Editor**: Editor completo integrado

### 🚧 Em Desenvolvimento
- **Exportação de Relatórios**: HTML, Markdown, Text
- **Histórico de Navegação**: Breadcrumbs, navegação rápida
- **Temas Personalizáveis**: Múltiplos temas
- **Configurações**: Preferências do usuário

### 📋 Planejadas
- **Integração com GitHub/GitLab**: Pull requests, issues
- **Análise de Performance**: Métricas de commits
- **Colaboração**: Comentários, anotações
- **Plugins**: Sistema de extensões

## 🤝 Como Contribuir

### 🎯 Áreas Prioritárias
1. **🐛 Bug Fixes**: Correção de problemas reportados
2. **📝 Documentação**: Melhoria da documentação
3. **🧪 Testes**: Aumento da cobertura de testes
4. **🎨 UI/UX**: Melhorias na interface
5. **⚡ Performance**: Otimizações

### 🔄 Fluxo de Contribuição
1. Leia o [Guia de Contribuição](contributing.md)
2. Escolha uma issue ou propose uma nova funcionalidade
3. Fork o repositório
4. Desenvolva em uma branch feature
5. Execute os testes
6. Abra um Pull Request

## 📞 Suporte e Comunidade

- **Issues**: [GitHub Issues](https://github.com/danielfalcaodf/GhostCommit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/danielfalcaodf/GhostCommit/discussions)
- **Wiki**: [GitHub Wiki](https://github.com/danielfalcaodf/GhostCommit/wiki)

## 🔗 Links Importantes

- **[Repositório Principal](https://github.com/danielfalcaodf/ghostcommit)**
- **[Releases](https://github.com/danielfalcaodf/GhostCommit/releases)**
- **[Roadmap](https://github.com/danielfalcaodf/GhostCommit/projects)**
- **[Changelog](../CHANGELOG.md)**

---

*Última atualização: 22 de junho de 2025*

### 📚 Documentação Técnica Adicional
- **[Relatório de Separação de Componentes](COMPONENT_SEPARATION_REPORT.md)** - Histórico de refatoração
- **[Guia de Componentes UI](UI_COMPONENTS_GUIDE.md)** - Padrões de interface
- **[Implementação de Diálogos](DIALOG_IMPLEMENTATION.md)** - Sistema de modais
- **[Serviço de Notificações](SNACKBAR_SERVICE_GUIDE.md)** - Sistema de feedback
- **[Implementação Git](GIT_GET_COMMITS_IMPLEMENTATION.md)** - Operações Git detalhadas
- **[Melhorias Técnicas](TECHNICAL_IMPROVEMENTS.md)** - Roadmap técnico
- **[Resumo de Débito Técnico](TECHNICAL_DEBT_SUMMARY.md)** - Pontos de melhoria
