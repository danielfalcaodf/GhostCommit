import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GitComparisonResult, GitFileComparison, GitRepository, GitCommit } from '../../shared/models/git.models';

export interface GitCompareState {
  repository?: GitRepository;
  repositoryPath?: string;
  selectedRefA?: string;
  selectedRefB?: string;
  selectedBranchRefA?: string;
  selectedBranchRefB?: string;
  commitsA?: GitCommit[];
  commitsB?: GitCommit[];
  comparisonResult?: GitComparisonResult;
  lastCompareParams?: {
    repoPath: string;
    fromRef: string;
    toRef: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GitCompareStateService {
  private stateSubject = new BehaviorSubject<GitCompareState>({});
  public state$ = this.stateSubject.asObservable();

  constructor() { }

  getState(): GitCompareState {
    return this.stateSubject.value;
  }

  updateState(partialState: Partial<GitCompareState>): void {
    const currentState = this.stateSubject.value;
    const newState = { ...currentState, ...partialState };
    this.stateSubject.next(newState);
  }

  setRepository(repository: GitRepository, repositoryPath: string): void {
    this.updateState({ repository, repositoryPath });
  }

  setSelectedRefs(refA: string, refB: string, branchRefA: string, branchRefB: string): void {
    this.updateState({
      selectedRefA: refA,
      selectedRefB: refB,
      selectedBranchRefA: branchRefA,
      selectedBranchRefB: branchRefB
    });
  }

  setCommits(commitsA: GitCommit[], commitsB: GitCommit[]): void {
    this.updateState({
      commitsA,
      commitsB
    });
  }

  setCommitsA(commits: GitCommit[]): void {
    this.updateState({ commitsA: commits });
  }

  setCommitsB(commits: GitCommit[]): void {
    this.updateState({ commitsB: commits });
  }

  setComparisonResult(result: GitComparisonResult): void {
    this.updateState({ comparisonResult: result });
  }

  setLastCompareParams(repoPath: string, fromRef: string, toRef: string): void {
    this.updateState({
      lastCompareParams: { repoPath, fromRef, toRef }
    });
  }

  clearState(): void {
    this.stateSubject.next({});
  }
}
