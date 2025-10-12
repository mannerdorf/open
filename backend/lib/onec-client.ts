export class OneCClient {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor() {
    this.baseUrl = process.env.ONEC_API_URL || '';
    this.username = process.env.ONEC_API_USERNAME || '';
    this.password = process.env.ONEC_API_PASSWORD || '';

    if (!this.baseUrl || !this.username || !this.password) {
      console.warn('1C API credentials not configured');
    }
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return `Basic ${credentials}`;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`[1C API] Request: ${options.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': this.getAuthHeader(),
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      console.log(`[1C API] Response status: ${response.status} ${response.statusText}`);
      console.log(`[1C API] Response content-type: ${response.headers.get('content-type')}`);

      const contentType = response.headers.get('content-type');
      const responseText = await response.text();
      
      console.log(`[1C API] Response body (first 500 chars): ${responseText.substring(0, 500)}`);

      if (!response.ok) {
        throw new Error(`1C API Error: ${response.status} ${response.statusText}. Response: ${responseText.substring(0, 200)}`);
      }

      if (contentType && contentType.includes('application/json')) {
        try {
          return JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}. Response: ${responseText.substring(0, 200)}`);
        }
      } else {
        throw new Error(`Expected JSON response but got ${contentType}. Response: ${responseText.substring(0, 200)}`);
      }
    } catch (error) {
      console.error('[1C API] Request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const onecClient = new OneCClient();
