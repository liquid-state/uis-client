type FileShare = {
  relationship: number;
  uuid: string;
  created: string;
  modified: string;
  app_user: string | null;
  app: string;
  created_by: string;
  modified_by: string;
  is_deleted: boolean;
  deleted: string | null;
};

export type AppUserFile = {
  url: string;
  uuid: string;
  created: string;
  modified: string;
  is_deleted: boolean;
  mimetype: string;
  name: string;
  description: string;
  is_editable: boolean;
  is_ready: boolean;
  shares: FileShare[];
  created_by: string;
  modified_by: string;
  original_creation_date: string;
  deleted: string | null;
};

export type ListFilesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: AppUserFile[];
};

export type CreateFileData = {
  name: string;
  description?: string;
  mimetype: string;
  original_creation_date?: string;
};

export type UpdateFileData = {
  name?: string;
  description?: string;
  original_creation_date?: string;
};

export type EngagementEvent = {
  time: string;
  user_id: string;
  source_type: 'mobile-app' | 'integration';
  source_id: string;
  engagement_type: 'app-content' | 'dashboard-content';
  content_id: string;
  content_type: 'document' | 'form' | 'message';
  [k: string]: unknown;
};

export type DailyStep = {
  date: string;
  user_id: string;
  source_type: 'mobile-app' | 'integration';
  source_id: string;
  health_source_name: string;
  health_source_id: string;
  health_source_record_id: string;
  value: BigInteger;
  [k: string]: unknown;
};

export type CommonMetricDataResponse = {
  count: number;
  results: EngagementEvent[] | DailyStep[];
  next_offset?: number;
};
