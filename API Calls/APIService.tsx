interface Headers {
  [key: string]: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Common method to handle API requests
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body: Record<string, any> | null = null,
    customHeaders: Headers = {},
  ): Promise<T> {
    console.log(this.baseURL + endpoint);
    const headers: Headers = {
      'Content-Type': 'application/json',
      ...customHeaders, // Allow custom headers for specific requests
    };

    // Prepare the options for the fetch request
    const options: RequestInit = {
      method,
      headers,
    };

    // If the method is not GET, we include a body
    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, options);

      // Check if the response is ok (status code 200-299)
      if (!response.ok) {
        const errorData = await this.tryParseJson(response);
        throw new Error(errorData?.message || 'API request failed');
      }

      // Try to parse the response as JSON if it's a JSON response
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        return (await response.json()) as T;
      } else {
        // If it's not JSON, return it as text or handle accordingly
        const text = await response.text();
        return text as unknown as T; // You can adjust this based on your expected return type
      }
    } catch (error: any) {
      console.error(`API call failed: ${error.message}`);
      throw error; // Re-throw the error for the caller to handle
    }
  }

  // Helper function to try to parse JSON, if possible
  private async tryParseJson(response: Response): Promise<any> {
    try {
      return await response.json();
    } catch (e) {
      return {}; // Return an empty object or handle this error gracefully
    }
  }

  // Convenience method for GET requests
  public async get<T>(
    endpoint: string,
    customHeaders: Headers = {},
  ): Promise<T> {
    return this.request<T>(endpoint, 'GET', null, customHeaders);
  }

  // Convenience method for POST requests
  public async post<T>(
    endpoint: string,
    body: Record<string, any>,
    customHeaders: Headers = {},
  ): Promise<T> {
    return this.request<T>(endpoint, 'POST', body, customHeaders);
  }

  // Convenience method for PUT requests
  public async put<T>(
    endpoint: string,
    body: Record<string, any>,
    customHeaders: Headers = {},
  ): Promise<T> {
    return this.request<T>(endpoint, 'PUT', body, customHeaders);
  }

  // Convenience method for DELETE requests
  public async delete<T>(
    endpoint: string,
    customHeaders: Headers = {},
  ): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', null, customHeaders);
  }
}

export default ApiService;
