const API_CONFIG = {
  // Base URL for Azure DevOps REST API
  BASE_URL: 'https://api.bitrise.io/v0.1/',
  API_VERSION: '',
  PAGINATION_PARAM: 'limit=20',

  endpoints: {
    apps: {
      list: (next: string | null) => {
        const nextPageToken = next != null ? `&next=${next?.toString()}` : '';
        return `apps?${API_CONFIG.PAGINATION_PARAM}${nextPageToken}`;
      },
    },
    builds: {
      list: (appSlug: string, next: string | null) => {
        const nextPageToken = next != null ? `&next=${next?.toString()}` : '';
        return `apps/${appSlug}/builds?${API_CONFIG.PAGINATION_PARAM}${nextPageToken}`;
      },
      trigger: (appSlug: string) => {
        return `apps/${appSlug}/builds`;
      },
      abort: (appSlug: string, buildSlug: string) => {
        return `apps/${appSlug}/builds/${buildSlug}/abort`;
      },
      logs: (appSlug: string, buildSlug: string) => {
        return `apps/${appSlug}/builds/${buildSlug}/log`;
      },
    },
  },
};

export default API_CONFIG;
