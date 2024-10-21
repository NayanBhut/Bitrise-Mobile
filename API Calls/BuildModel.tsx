export enum BuildState {
  Success = 'success',
  Failed = 'error',
  Abort = 'aborted',
  InProgress = 'in-progress',
  OnHold = 'on-hold',
}

export interface BuildModel {
  data?: Build[];
  paging: Paging;
}

export interface Build {
  item: any;
  triggered_at: string;
  started_on_worker_at: string;
  environment_prepare_finished_at: string;
  finished_at: string;
  slug: string;
  status: number;
  status_text: BuildState;
  abort_reason?: string;
  is_on_hold: boolean;
  is_processed: boolean;
  branch: string;
  build_number: number;
  commit_hash?: string;
  commit_message?: string;
  tag: any;
  triggered_workflow: string;
  triggered_by: string;
  machine_type_id: string;
  stack_identifier: string;
  original_build_params: OriginalBuildParams;
  pull_request_id: number;
  pull_request_target_branch: any;
  pull_request_view_url: any;
  commit_view_url?: string;
  repository: Repository;
  credit_cost: number;
}

export interface OriginalBuildParams {
  branch: string;
  workflow_id: string;
  environments?: Environment[];
  branch_dest?: string;
  branch_dest_repo_owner?: string;
  branch_repo_owner?: string;
  commit_hash?: string;
  commit_message?: string;
  pull_request_author?: string;
  pull_request_merge_branch?: string;
  pull_request_unverified_merge_branch?: string;
  pull_request_head_branch?: string;
  pull_request_id: any;
  pull_request_repository_url?: string;
  tag: any;
}

export interface Environment {
  value: string;
  is_expand: boolean;
  key: string;
}

export interface Repository {
  slug: string;
  title: string;
  project_type: string;
  provider: string;
  repo_owner: string;
  repo_url: string;
  repo_slug: string;
  is_disabled: boolean;
  status: number;
  is_public: boolean;
  is_github_checks_enabled: boolean;
  owner: Owner;
  avatar_url: any;
}

export interface Owner {
  account_type: string;
  name: string;
  slug: string;
}

export interface Paging {
  total_item_count: number;
  page_item_limit: number;
  next: string;
}
