export interface AppsModel {
  data: Apps[];
  paging: Paging;
}

export interface Apps {
  item: any;
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
