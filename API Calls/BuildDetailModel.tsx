export interface BuildDetailModel {
  log_chunks: LogChunks[];
  expiring_raw_log_url: String;
}

export interface LogChunks {
  chunk: String;
  position: number;
}
