export interface PagedQuery {
  current: number;
  pageSize: number;
  [key: string]: any;
}

export interface SortObject {
  [key: string]: 'asc' | 'desc';
}
