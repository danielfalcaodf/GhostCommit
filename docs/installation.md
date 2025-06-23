# 🚀 Instalação e Setup

Este guia te ajudará a configurar o ambiente de desenvolvimento do GhostCommit.

## 📋 Pré-requisitos

### Ferramentas Essenciais
- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **npm** >= 9.0.0 (incluído com Node.js)
- **Rust** >= 1.70.0 ([rustup.rs](https://rustup.rs/))
- **Git** >= 2.30.0 ([git-scm.com](https://git-scm.com/))

### Verificação das Versões
```bash
node --version    # v18.0.0 ou superior
npm --version     # 9.0.0 ou superior
rustc --version   # 1.70.0 ou superior
git --version     # 2.30.0 ou superior
```

## 🛠️ Configuração do Ambiente

### 1. Clonar o Repositório
```bash
git clone https://github.com/danielfalcaodf/GhostCommit.git
cd GhostCommit
```

### 2. Instalar Dependências do Frontend
```bash
# Instalar dependências do Angular
npm install

# Verificar se as dependências foram instaladas
npm list --depth=0
```

### 3. Configurar Ambiente Rust/Tauri
```bash
# Instalar Tauri CLI
cargo install tauri-cli

# Verificar instalação
cargo tauri --version
```

### 4. Dependências do Sistema

#### Windows
```powershell
# Instalar Microsoft Visual C++ Build Tools
# Baixar de: https://visualstudio.microsoft.com/visual-cpp-build-tools/

# Instalar WebView2 (geralmente já instalado no Windows 11)
# Baixar de: https://developer.microsoft.com/microsoft-edge/webview2/
```

#### macOS
```bash
# Instalar Xcode Command Line Tools
xcode-select --install

# Instalar dependencies via Homebrew (opcional)
brew install git
```

#### Linux (Ubuntu/Debian)
```bash
# Atualizar pacotes
sudo apt update

# Instalar dependências essenciais
sudo apt install -y \
    libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# Para outras distribuições, consulte: https://tauri.app/guides/getting-started/prerequisites
```

## 🔧 Configuração de Desenvolvimento

### 1. Configurar Angular CLI
```bash
# Instalar Angular CLI globalmente (opcional)
npm install -g @angular/cli

# Verificar instalação
ng version
```

### 2. Configurar VSCode (Recomendado)
```bash
# Instalar extensões recomendadas
code --install-extension angular.ng-template
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension rust-lang.rust-analyzer
code --install-extension tauri-apps.tauri-vscode
code --install-extension esbenp.prettier-vscode
```

### 3. Configurar Git Hooks (Opcional)
```bash
# Instalar husky para git hooks
npm install --save-dev husky

# Configurar hooks
npx husky install
```

## 🚀 Primeiros Comandos

### Desenvolvimento Web (Apenas Frontend)
```bash
# Iniciar servidor de desenvolvimento
npm start

# Ou usando Angular CLI
ng serve

# Acessar em: http://localhost:4200
```

### Desenvolvimento Desktop (Aplicação Completa)
```bash
# Iniciar aplicação desktop em modo dev
npm run tauri dev

# Ou usando Tauri CLI diretamente
cargo tauri dev
```

### Build para Produção
```bash
# Build da aplicação web
npm run build

# Build da aplicação desktop
npm run tauri build

# Build apenas do frontend
ng build --configuration production
```

## 🧪 Verificar Instalação

### Teste Rápido
```bash
# 1. Testar build do Angular
npm run build

# 2. Testar Tauri dev (deve abrir aplicação)
npm run tauri dev

# 3. Executar testes (quando disponíveis)
npm test
```

### Comandos de Verificação
```bash
# Verificar dependências do npm
npm audit

# Verificar toolchain do Rust
rustup show

# Verificar configuração do Tauri
cargo tauri info
```

## 🐛 Solução de Problemas Comuns

### Erro: "command not found: cargo"
```bash
# Instalar Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### Erro: "failed to run custom build command for openssl-sys"
```bash
# Linux
sudo apt install pkg-config libssl-dev

# macOS
brew install openssl
export OPENSSL_DIR=$(brew --prefix openssl)
```

### Erro: "No package.json found"
```bash
# Verificar se está no diretório correto
pwd
ls -la

# Recriar node_modules se necessário
rm -rf node_modules package-lock.json
npm install
```

### Problema: Aplicação não abre no Tauri
```bash
# Verificar logs do Tauri
cargo tauri dev --verbose

# Verificar dependências do sistema
cargo tauri info
```

## 📝 Configurações Opcionais

### 1. Configurar Prettier
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 2. Configurar ESLint
```json
// .eslintrc.json
{
  "extends": [
    "@angular-eslint/recommended",
    "@angular-eslint/template/process-inline-templates"
  ]
}
```

### 3. Configurar Rust Analyzer (VSCode)
```json
// .vscode/settings.json
{
  "rust-analyzer.cargo.features": "all",
  "rust-analyzer.checkOnSave.command": "clippy"
}
```

## 🎯 Próximos Passos

Após a instalação bem-sucedida:

1. 📖 Leia a [Arquitetura do Projeto](architecture.md)
2. 🔧 Explore as [Funcionalidades Git](git-features.md)
3. 🤝 Veja como [Contribuir](contributing.md)
4. 🐛 Configure o [Debug](debugging.md)

## 📞 Precisa de Ajuda?

- 🐛 **Problemas de instalação**: [Abrir issue](https://github.com/danielfalcaodf/GhostCommit/issues)
- 💬 **Discussões**: [GitHub Discussions](https://github.com/danielfalcaodf/GhostCommit/discussions)
- 📚 **Documentação Tauri**: [tauri.app](https://tauri.app/guides/getting-started/prerequisites)
- 📚 **Documentação Angular**: [angular.io](https://angular.io/guide/setup-local)

---

*Tempo estimado de configuração: 15-30 minutos*
