# 🤝 Guia de Contribuição

Obrigado pelo interesse em contribuir com o GhostCommit! Este guia te ajudará a começar e maximizar o impacto da sua contribuição.

## 🎯 Tipos de Contribuição

### 🐛 Bug Reports
- Reporte problemas encontrados
- Inclua steps para reproduzir
- Adicione screenshots quando relevante

### ✨ Feature Requests
- Sugira novas funcionalidades
- Explique o caso de uso
- Proponha a implementação

### 📚 Documentação
- Melhore documentação existente
- Adicione exemplos práticos
- Traduza conteúdo

### 🧪 Testes
- Adicione cobertura de testes
- Melhore testes existentes
- Teste em diferentes plataformas

### 🎨 UI/UX
- Melhore interface do usuário
- Propose novos designs
- Otimize experiência do usuário

## 🚀 Como Começar

### 1. Setup do Ambiente
```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/danielfalcaodf/GhostCommit.git
cd GhostCommit

# Configure upstream
git remote add upstream https://github.com/danielfalcaodf/GhostCommit.git

# Instale dependências
npm install
```

### 2. Escolha uma Issue
- Veja [Issues abertas](https://github.com/danielfalcaodf/GhostCommit/issues)
- Issues marcadas com `good first issue` são ideais para começar
- Issues com `help wanted` precisam de atenção
- Comente na issue para indicar que vai trabalhar nela

### 3. Crie uma Branch
```bash
# Crie branch a partir da main
git checkout main
git pull upstream main
git checkout -b feature/sua-feature

# Ou para bug fix
git checkout -b fix/corrige-problema
```

## 📝 Padrões de Desenvolvimento

### 🏷️ Nomenclatura de Branches
```bash
# Novas funcionalidades
feature/adiciona-exportacao-pdf
feature/melhora-filtros-commit

# Correções de bugs
fix/corrige-navegacao-estado
fix/resolve-memory-leak

# Documentação
docs/atualiza-readme
docs/adiciona-guia-contribuicao

# Refatoração
refactor/simplifica-git-service
refactor/otimiza-state-management
```

### 💬 Mensagens de Commit
Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato
tipo(escopo): descrição

# Exemplos
feat(git-compare): adiciona filtro por autor
fix(state): corrige persistência de estado entre rotas
docs(readme): atualiza instruções de instalação
style(components): ajusta espaçamento nos cards
refactor(services): simplifica GitService
test(git-diff): adiciona testes unitários
```

### 🎨 Padrões de Código

#### TypeScript/Angular
```typescript
// ✅ Bom
@Injectable({ providedIn: 'root' })
export class GitCompareStateService {
  private readonly stateSubject = new BehaviorSubject<GitCompareState>({});
  
  updateState(partialState: Partial<GitCompareState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...partialState };
    this.stateSubject.next(newState);
  }
}

// ❌ Evitar
export class GitCompareStateService {
  public stateSubject = new BehaviorSubject({});
  
  updateState(partialState) {
    this.stateSubject.next(Object.assign(this.stateSubject.value, partialState));
  }
}
```

#### Rust
```rust
// ✅ Bom
#[derive(Debug, Serialize, Deserialize)]
pub struct GitCommit {
    pub hash: String,
    pub message: String,
    pub author: GitAuthor,
    pub date: DateTime<Utc>,
}

impl GitCommit {
    pub fn short_hash(&self) -> String {
        self.hash[..7].to_string()
    }
}

// ❌ Evitar
pub struct GitCommit {
    pub hash: String,
    pub message: String,
    // Sem documentação ou validação
}
```

### 📁 Estrutura de Arquivos
```bash
# Componentes Angular
src/app/pages/nova-feature/
├── nova-feature.component.ts
├── nova-feature.component.html
├── nova-feature.component.scss
├── nova-feature.component.spec.ts
└── nova-feature.model.ts

# Serviços
src/app/core/services/
├── nova-feature.service.ts
├── nova-feature.service.spec.ts
└── index.ts

# Rust modules
src-tauri/src/
├── commands/
│   ├── nova_feature.rs
│   └── mod.rs
└── models/
    ├── nova_feature.rs
    └── mod.rs
```

## 🧪 Testes

### Frontend (Angular)
```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Coverage
npm run test:coverage
```

```typescript
// Exemplo de teste unitário
describe('GitCompareStateService', () => {
  let service: GitCompareStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GitCompareStateService);
  });

  it('should update state correctly', () => {
    const newState = { selectedRefA: 'abc123' };
    service.updateState(newState);
    
    expect(service.getState().selectedRefA).toBe('abc123');
  });
});
```

### Backend (Rust)
```bash
# Executar testes Rust
cd src-tauri
cargo test

# Testes com output detalhado
cargo test -- --nocapture
```

```rust
// Exemplo de teste Rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_short_hash() {
        let commit = GitCommit {
            hash: "abcdef1234567890".to_string(),
            message: "Test commit".to_string(),
            // ... outros campos
        };
        
        assert_eq!(commit.short_hash(), "abcdef1");
    }
}
```

## 📋 Pull Request Process

### 1. Antes de Abrir PR
```bash
# Sincronize com upstream
git fetch upstream
git rebase upstream/main

# Execute testes
npm test
cd src-tauri && cargo test

# Execute linting
npm run lint
cargo clippy

# Build para verificar compilação
npm run build
npm run tauri build
```

### 2. Criando o PR
- Use template do PR (será criado automaticamente)
- Título descritivo: `feat: adiciona exportação de relatórios em PDF`
- Descreva o que foi implementado
- Inclua screenshots para mudanças visuais
- Referencie issues relacionadas: `Closes #123`

### 3. Template do PR
```markdown
## 📝 Descrição
Breve descrição das mudanças implementadas.

## 🎯 Tipo de Mudança
- [ ] Bug fix (correção que resolve um problema)
- [ ] Nova feature (adição de funcionalidade)
- [ ] Breaking change (mudança que quebra compatibilidade)
- [ ] Documentação
- [ ] Refatoração

## 🧪 Como Testar
1. Passos para testar as mudanças
2. Configurações necessárias
3. Resultados esperados

## 📱 Screenshots
(Inclua screenshots para mudanças visuais)

## ✅ Checklist
- [ ] Código segue padrões do projeto
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Mudanças testadas localmente
- [ ] Build passa sem erros
```

## 🎯 Áreas Prioritárias

### 🔴 Alta Prioridade
- **Bug Fixes**: Problemas que afetam usabilidade
- **Performance**: Otimizações críticas
- **Segurança**: Vulnerabilidades identificadas

### 🟡 Média Prioridade
- **Novas Features**: Funcionalidades planejadas
- **UI/UX**: Melhorias na interface
- **Documentação**: Gaps na documentação

### 🟢 Baixa Prioridade
- **Refatoração**: Melhorias no código
- **Testes**: Aumento de cobertura
- **DevOps**: Melhorias no pipeline

## 🛠️ Ferramentas de Desenvolvimento

### Extensões VSCode Recomendadas
```json
{
  "recommendations": [
    "angular.ng-template",
    "ms-vscode.vscode-typescript-next",
    "rust-lang.rust-analyzer",
    "tauri-apps.tauri-vscode",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Scripts Úteis
```bash
# Formatar código
npm run format

# Linting
npm run lint:fix

# Analisar bundle
npm run analyze

# Gerar documentação
npm run docs:generate
```

## 🚫 O que Evitar

### ❌ Não Faça
- Commits diretos na branch main
- PRs sem descrição ou testes
- Mudanças que quebram funcionalidades existentes
- Código sem documentação
- Commits com mensagens vagas: "fix stuff"

### ✅ Faça
- Fork → Branch → PR
- Testes para novas funcionalidades
- Documentação atualizada
- Commits atomicos e descritivos
- Código limpo e comentado

## 💬 Comunicação

### 📢 Canais
- **Issues**: Para bugs e feature requests
- **Discussions**: Para perguntas e discussões gerais
- **PR Comments**: Para revisão de código
- **Wiki**: Para documentação colaborativa

### 🎯 Boas Práticas
- Seja respeitoso e construtivo
- Aceite feedback positivamente
- Ajude outros contribuidores
- Compartilhe conhecimento

## 🏆 Reconhecimento

### 📈 Níveis de Contribuidor
- **First Timer**: Primeira contribuição aceita
- **Regular**: 5+ contribuições aceitas
- **Core**: 20+ contribuições e reviews
- **Maintainer**: Acesso de write ao repositório

### 🎖️ Como ser Reconhecido
- Contribuições constantes e de qualidade
- Ajuda na comunidade (issues, discussions)
- Reviews construtivos em PRs
- Melhoria da documentação

## ❓ Precisa de Ajuda?

### 📚 Recursos
- [Documentação do Projeto](README.md)
- [Arquitetura](architecture.md)
- [Guia de Instalação](installation.md)

### 💬 Onde Pedir Ajuda
- **GitHub Issues**: Para problemas específicos
- **GitHub Discussions**: Para perguntas gerais
- **PR Comments**: Para dúvidas sobre implementação

### 🤝 Mentoria
Se você é novo em:
- **Angular**: Procure issues marcadas com `angular-help`
- **Rust**: Procure issues marcadas com `rust-help`
- **Git**: Procure issues marcadas com `git-help`

---

**Obrigado por contribuir! Juntos tornamos o GhostCommit melhor para toda a comunidade! 🚀**
