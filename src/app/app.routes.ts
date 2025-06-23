import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'editor',
    loadComponent: () => import('./pages/code-editor/code-editor.component').then(m => m.CodeEditorComponent)
  },
  {
    path: 'git-compare',
    loadComponent: () => import('./pages/git-compare/git-compare.component').then(m => m.GitCompareComponent)
  },
  {
    path: 'git-diff/:repoPath/:fromRef/:toRef/:filePath',
    loadComponent: () => import('./pages/git-compare/git-diff/git-diff.component').then(m => m.GitDiffComponent)
  },
  {
    path: '**',
    redirectTo: '/'
  }
];
