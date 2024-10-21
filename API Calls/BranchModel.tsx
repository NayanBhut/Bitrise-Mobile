export interface BranchModel {
  values: Value[];
  pagelen: number;
  page: number;
}

export interface Value {
  name: string;
  target: Target;
  links: Links5;
  type: string;
  merge_strategies: string[];
  default_merge_strategy: string;
}

export interface Target {
  type: string;
  hash: string;
  date: string;
  author: Author;
  message: string;
  links: Links2;
  parents: Parent[];
  repository: Repository;
}

export interface Author {
  type: string;
  raw: string;
  user: User;
}

export interface User {
  display_name: string;
  links: Links;
  type: string;
  uuid: string;
  account_id: string;
  nickname: string;
}

export interface Links {
  self: Self;
  avatar: Avatar;
  html: Html;
}

export interface Self {
  href: string;
}

export interface Avatar {
  href: string;
}

export interface Html {
  href: string;
}

export interface Links2 {
  self: Self2;
  html: Html2;
  diff: Diff;
  approve: Approve;
  comments: Comments;
  statuses: Statuses;
  patch: Patch;
}

export interface Self2 {
  href: string;
}

export interface Html2 {
  href: string;
}

export interface Diff {
  href: string;
}

export interface Approve {
  href: string;
}

export interface Comments {
  href: string;
}

export interface Statuses {
  href: string;
}

export interface Patch {
  href: string;
}

export interface Parent {
  hash: string;
  links: Links3;
  type: string;
}

export interface Links3 {
  self: Self3;
  html: Html3;
}

export interface Self3 {
  href: string;
}

export interface Html3 {
  href: string;
}

export interface Repository {
  type: string;
  full_name: string;
  links: Links4;
  name: string;
  uuid: string;
}

export interface Links4 {
  self: Self4;
  html: Html4;
  avatar: Avatar2;
}

export interface Self4 {
  href: string;
}

export interface Html4 {
  href: string;
}

export interface Avatar2 {
  href: string;
}

export interface Links5 {
  self: Self5;
  commits: Commits;
  html: Html5;
}

export interface Self5 {
  href: string;
}

export interface Commits {
  href: string;
}

export interface Html5 {
  href: string;
}
