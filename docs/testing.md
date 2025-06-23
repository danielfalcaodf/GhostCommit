# 🧪 Testes

Estratégias de teste, ferramentas utilizadas e como executar os testes do GhostCommit.

## 🎯 Estratégia de Testes

### Pirâmide de Testes
```
    🔺 E2E Tests
   ────────────
  🔺 Integration Tests  
 ──────────────────────
🔺 Unit Tests (Base)
```

### Cobertura de Testes
- **Unit Tests**: Lógica de negócio, serviços, utils
- **Integration Tests**: Comunicação entre componentes
- **E2E Tests**: Fluxos completos de usuário

## 🛠️ Ferramentas de Teste

### Frontend (Angular)
```json
{
  "devDependencies": {
    "@angular/testing": "^19.2.14",
    "jasmine": "~5.1.0",
    "karma": "~6.4.0",
    "karma-chrome-headless": "~3.1.0",
    "karma-coverage": "~2.2.0"
  }
}
```

### Backend (Rust)
```toml
[dev-dependencies]
tokio-test = "0.4"
mockall = "0.11"
tempfile = "3.0"
```

### E2E Testing
```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@tauri-apps/cli": "^2.0.0"
  }
}
```

## 🔧 Configuração de Testes

### Angular Testing Setup
```typescript
// src/test.ts
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
```

### Karma Configuration
```javascript
// karma.conf.js
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-headless'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    client: {
      jasmine: {
        random: true
      },
      clearContext: false
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/ghostcommit'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcov' }
      ]
    },
    reporters: ['progress', 'coverage'],
    browsers: ['ChromeHeadless'],
    singleRun: true
  });
};
```

## 🧪 Testes Unitários

### Testando Services
```typescript
// git-compare-state.service.spec.ts
describe('GitCompareStateService', () => {
  let service: GitCompareStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GitCompareStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update state correctly', () => {
    const newState = { selectedRefA: 'abc123' };
    
    service.updateState(newState);
    
    expect(service.getState().selectedRefA).toBe('abc123');
  });

  it('should preserve existing state when updating', () => {
    const initialState = { selectedRefA: 'abc123' };
    const updateState = { selectedRefB: 'def456' };
    
    service.updateState(initialState);
    service.updateState(updateState);
    
    const currentState = service.getState();
    expect(currentState.selectedRefA).toBe('abc123');
    expect(currentState.selectedRefB).toBe('def456');
  });

  it('should emit state changes', (done) => {
    const testState = { selectedRefA: 'test123' };
    
    service.state$.subscribe(state => {
      if (state.selectedRefA === 'test123') {
        expect(state.selectedRefA).toBe('test123');
        done();
      }
    });
    
    service.updateState(testState);
  });
});
```

### Testando Components
```typescript
// git-compare.component.spec.ts
describe('GitCompareComponent', () => {
  let component: GitCompareComponent;
  let fixture: ComponentFixture<GitCompareComponent>;
  let mockGitService: jasmine.SpyObj<GitService>;
  let mockStateService: jasmine.SpyObj<GitCompareStateService>;

  beforeEach(async () => {
    const gitServiceSpy = jasmine.createSpyObj('GitService', [
      'openRepository',
      'getAllRefs',
      'getCommits',
      'compareCommits'
    ]);
    
    const stateServiceSpy = jasmine.createSpyObj('GitCompareStateService', [
      'getState',
      'updateState',
      'setRepository'
    ]);

    await TestBed.configureTestingModule({
      providers: [
        { provide: GitService, useValue: gitServiceSpy },
        { provide: GitCompareStateService, useValue: stateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GitCompareComponent);
    component = fixture.componentInstance;
    mockGitService = TestBed.inject(GitService) as jasmine.SpyObj<GitService>;
    mockStateService = TestBed.inject(GitCompareStateService) as jasmine.SpyObj<GitCompareStateService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load repository successfully', async () => {
    const mockRepo = { name: 'test-repo', path: '/test/path' };
    mockGitService.openRepository.and.returnValue(of(mockRepo));
    
    component.repositoryPath = '/test/path';
    await component.loadRepository();
    
    expect(component.currentRepository).toEqual(mockRepo);
    expect(mockStateService.setRepository).toHaveBeenCalledWith(mockRepo, '/test/path');
  });

  it('should handle comparison correctly', async () => {
    const mockResult = {
      diff: {
        files: [
          { new_path: 'test.ts', status: 'modified', insertions: 5, deletions: 2 }
        ],
        stats: { total_files: 1, total_insertions: 5, total_deletions: 2 }
      }
    };
    
    mockGitService.compareCommits.and.returnValue(of(mockResult));
    
    component.selectedRefA = 'abc123';
    component.selectedRefB = 'def456';
    
    await component.compareCommits();
    
    expect(component.comparisonResult).toEqual(mockResult);
    expect(component.filteredFiles).toEqual(mockResult.diff.files);
  });
});
```

### Testando Utils
```typescript
// git.utils.spec.ts
describe('GitUtils', () => {
  describe('formatCommitHash', () => {
    it('should format full hash to short hash', () => {
      const fullHash = 'abcdef1234567890abcdef1234567890abcdef12';
      const shortHash = GitUtils.formatCommitHash(fullHash, 7);
      
      expect(shortHash).toBe('abcdef1');
    });

    it('should handle short hashes', () => {
      const shortHash = 'abc123';
      const result = GitUtils.formatCommitHash(shortHash, 7);
      
      expect(result).toBe('abc123');
    });
  });

  describe('formatCommitMessage', () => {
    it('should truncate long messages', () => {
      const longMessage = 'This is a very long commit message that should be truncated';
      const result = GitUtils.formatCommitMessage(longMessage, 20);
      
      expect(result).toBe('This is a very long...');
    });

    it('should preserve short messages', () => {
      const shortMessage = 'Short message';
      const result = GitUtils.formatCommitMessage(shortMessage, 50);
      
      expect(result).toBe('Short message');
    });
  });
});
```

## 🦀 Testes Rust

### Unit Tests
```rust
// src/git/operations.rs
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use git2::Repository;

    fn create_test_repo() -> (TempDir, Repository) {
        let temp_dir = TempDir::new().unwrap();
        let repo = Repository::init(temp_dir.path()).unwrap();
        (temp_dir, repo)
    }

    #[test]
    fn test_get_repository_info() {
        let (_temp_dir, repo) = create_test_repo();
        let repo_path = repo.path().parent().unwrap().to_str().unwrap();
        
        let result = get_repository_info(repo_path.to_string());
        
        assert!(result.is_ok());
        let repo_info = result.unwrap();
        assert!(!repo_info.name.is_empty());
        assert_eq!(repo_info.path, repo_path);
    }

    #[test]
    fn test_format_commit_message() {
        let message = "This is a test commit message";
        let result = format_commit_message(message, 10);
        
        assert_eq!(result, "This is a...");
    }

    #[test]
    fn test_format_commit_hash() {
        let hash = "abcdef1234567890abcdef1234567890abcdef12";
        let result = format_commit_hash(hash, 7);
        
        assert_eq!(result, "abcdef1");
    }

    #[tokio::test]
    async fn test_compare_commits_invalid_repo() {
        let result = compare_commits(
            "/invalid/path".to_string(),
            "HEAD".to_string(),
            "HEAD~1".to_string()
        ).await;
        
        assert!(result.is_err());
    }
}
```

### Integration Tests
```rust
// tests/integration_test.rs
use ghostcommit::git::operations::*;
use git2::{Repository, Signature, Time, Oid};
use tempfile::TempDir;
use std::fs;

#[tokio::test]
async fn test_full_git_workflow() {
    let temp_dir = TempDir::new().unwrap();
    let repo = Repository::init(temp_dir.path()).unwrap();
    let repo_path = temp_dir.path().to_str().unwrap();
    
    // Create initial commit
    let sig = Signature::new("Test User", "test@example.com", &Time::new(0, 0)).unwrap();
    let tree_id = {
        let mut index = repo.index().unwrap();
        index.write_tree().unwrap()
    };
    let tree = repo.find_tree(tree_id).unwrap();
    let commit_id = repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        "Initial commit",
        &tree,
        &[]
    ).unwrap();
    
    // Test repository info
    let repo_info = get_repository_info(repo_path.to_string()).unwrap();
    assert_eq!(repo_info.name, temp_dir.path().file_name().unwrap().to_str().unwrap());
    
    // Test get refs
    let refs = get_all_refs(repo_path.to_string()).await.unwrap();
    assert!(!refs.is_empty());
    
    // Test get commits
    let commits = get_commits(repo_path.to_string(), 10, 0, None).await.unwrap();
    assert_eq!(commits.len(), 1);
    assert_eq!(commits[0].message, "Initial commit");
}
```

### Mock Testing
```rust
// Using mockall for mocking
#[cfg(test)]
mod tests {
    use super::*;
    use mockall::predicate::*;
    use mockall::mock;

    mock! {
        GitRepository {
            fn open(path: &str) -> Result<Self, String>;
            fn get_refs(&self) -> Result<Vec<GitRef>, String>;
            fn get_commits(&self, limit: usize) -> Result<Vec<GitCommit>, String>;
        }
    }

    #[tokio::test]
    async fn test_with_mock() {
        let mut mock_repo = MockGitRepository::new();
        
        mock_repo
            .expect_get_refs()
            .returning(|| Ok(vec![
                GitRef {
                    name: "main".to_string(),
                    ref_type: "branch".to_string(),
                    hash: "abc123".to_string(),
                    display_name: "main".to_string()
                }
            ]));
        
        let refs = mock_repo.get_refs().unwrap();
        assert_eq!(refs.len(), 1);
        assert_eq!(refs[0].name, "main");
    }
}
```

## 🎭 E2E Tests (Playwright)

### Setup
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:1420',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run tauri dev',
    url: 'http://localhost:1420',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Cases
```typescript
// e2e/git-compare.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Git Compare', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/git-compare');
  });

  test('should load repository successfully', async ({ page }) => {
    // Input repository path
    await page.fill('[data-testid="repo-path-input"]', '/path/to/test/repo');
    
    // Click load button
    await page.click('[data-testid="load-repo-button"]');
    
    // Wait for repository to load
    await expect(page.locator('[data-testid="repo-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="branches-select"]')).toBeVisible();
  });

  test('should compare commits successfully', async ({ page }) => {
    // Assume repository is already loaded
    await page.goto('/git-compare?repo=/path/to/test/repo');
    
    // Select branches
    await page.selectOption('[data-testid="branch-a-select"]', 'main');
    await page.selectOption('[data-testid="branch-b-select"]', 'develop');
    
    // Select commits
    await page.selectOption('[data-testid="commit-a-select"]', 'abc123');
    await page.selectOption('[data-testid="commit-b-select"]', 'def456');
    
    // Click compare
    await page.click('[data-testid="compare-button"]');
    
    // Wait for results
    await expect(page.locator('[data-testid="comparison-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="files-changed"]')).toContainText('files changed');
  });

  test('should navigate to diff view', async ({ page }) => {
    // Assume comparison results are shown
    await page.goto('/git-compare?repo=/path/to/test/repo&compared=true');
    
    // Click on a file
    await page.click('[data-testid="file-item"]:first-child');
    
    // Should navigate to diff view
    await expect(page).toHaveURL(/.*\/git-diff\/.*/);
    await expect(page.locator('[data-testid="diff-viewer"]')).toBeVisible();
  });

  test('should preserve state when navigating back', async ({ page }) => {
    // Start with comparison
    await page.goto('/git-compare?repo=/path/to/test/repo');
    
    // Select refs and compare
    await page.selectOption('[data-testid="branch-a-select"]', 'main');
    await page.selectOption('[data-testid="branch-b-select"]', 'develop');
    await page.click('[data-testid="compare-button"]');
    
    // Navigate to diff
    await page.click('[data-testid="file-item"]:first-child');
    
    // Navigate back
    await page.goBack();
    
    // State should be preserved
    await expect(page.locator('[data-testid="branch-a-select"]')).toHaveValue('main');
    await expect(page.locator('[data-testid="branch-b-select"]')).toHaveValue('develop');
    await expect(page.locator('[data-testid="comparison-results"]')).toBeVisible();
  });
});
```

## 🚀 Executando os Testes

### Comandos Disponíveis
```bash
# Frontend Tests
npm test                    # Executa todos os testes
npm run test:watch         # Executa em modo watch
npm run test:coverage      # Executa com cobertura
npm run test:ci            # Executa para CI (single run)

# Backend Tests
cd src-tauri
cargo test                 # Executa testes Rust
cargo test -- --nocapture # Com output detalhado
cargo test --release       # Modo release

# E2E Tests
npm run e2e                # Executa testes E2E
npm run e2e:ui             # Interface visual
npm run e2e:debug          # Modo debug
```

### Scripts de Teste
```json
{
  "scripts": {
    "test": "ng test",
    "test:watch": "ng test --watch",
    "test:coverage": "ng test --code-coverage",
    "test:ci": "ng test --watch=false --browsers=ChromeHeadless",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:debug": "playwright test --debug"
  }
}
```

## 📊 Cobertura de Testes

### Configuração de Cobertura
```typescript
// karma.conf.js
coverageReporter: {
  dir: require('path').join(__dirname, './coverage/ghostcommit'),
  subdir: '.',
  reporters: [
    { type: 'html' },
    { type: 'text-summary' },
    { type: 'lcov' }
  ],
  check: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
}
```

### Metas de Cobertura
```bash
# Metas mínimas
Statements   : 80%
Branches     : 80%
Functions    : 80%
Lines        : 80%

# Metas ideais
Statements   : 90%
Branches     : 85%
Functions    : 90%
Lines        : 90%
```

## 🔍 Debugging Tests

### Debugging Angular Tests
```typescript
// No teste, adicionar
fit('should debug this test', () => {
  debugger; // Breakpoint
  // ... resto do teste
});

// Executar com
ng test --watch
```

### Debugging Rust Tests
```rust
#[test]
fn debug_test() {
    println!("Debug info: {:?}", some_value);
    // ... resto do teste
}

// Executar com
cargo test -- --nocapture debug_test
```

### Debugging E2E Tests
```typescript
// playwright.config.ts
use: {
  trace: 'on-first-retry',
  video: 'retain-on-failure',
  screenshot: 'only-on-failure',
}

// No teste
await page.pause(); // Pausa para debug
```

## 📝 Boas Práticas

### 1. Testes Determinísticos
```typescript
// ✅ Bom
it('should format date correctly', () => {
  const fixedDate = new Date('2023-06-22T10:30:00Z');
  const result = formatDate(fixedDate);
  expect(result).toBe('22/06/2023 10:30');
});

// ❌ Evitar
it('should format current date', () => {
  const result = formatDate(new Date());
  expect(result).toContain('2023'); // Pode falhar no futuro
});
```

### 2. Isolamento de Testes
```typescript
// ✅ Bom
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [{ provide: GitService, useValue: mockGitService }]
  });
});

// ❌ Evitar
let globalService: GitService; // Estado compartilhado
```

### 3. Testes Legíveis
```typescript
// ✅ Bom
describe('GitCompareComponent', () => {
  describe('when repository is loaded', () => {
    beforeEach(() => setupRepository());
    
    it('should display repository name', () => {
      expect(component.repositoryName).toBe('test-repo');
    });
  });
});
```

### 4. Mocking Adequado
```typescript
// ✅ Bom - Mock apenas o que é necessário
const mockGitService = {
  compareCommits: jasmine.createSpy().and.returnValue(of(mockResult))
};

// ❌ Evitar - Mock excessivo
const mockEverything = jasmine.createSpyObj('Service', ['method1', 'method2', ...]);
```

---

*Testes são essenciais para manter a qualidade do código. Contribua adicionando testes para novas funcionalidades!*
