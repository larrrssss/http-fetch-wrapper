export interface APIResponse<DataType = any> {
  data: DataType,
  status: number,
  raw?: Response,
  type?: string,
}

export interface APIConfig {
  options?: RequestInit;
  baseURL?: string;
  path?: string;
  requestIntercept?: (options: RequestInit & { endpoint: string }) => any;
  responseIntercept?: (response: APIResponse) => any;
}

type HttpMethod = 'GET' | 'DELETE' | 'POST' | 'PATCH' | 'PUT';

type StringObject = { [k: string]: string };
const formatHeaders = (headers: StringObject) => {
  Object.keys(headers).map((key) => {
    headers[key
      .split('-')
      .map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      .join('-')] = headers[key];
    delete headers[key];
  });
  return headers as StringObject;
};

export class API {
  constructor(public config: APIConfig = { options: {} }) {
    if (config.options && config.options.headers)
      config.options.headers = formatHeaders(config.options.headers as StringObject);

    if (!config.options)
      config.options = {};
  }

  static copyConfig(config: APIConfig): APIConfig {
    config = { ...config };
    config.options = { ...config.options };
    config.options.headers = { ...config.options.headers };
    return config;
  }

  public get(endpoint: string): Promise<APIResponse> {
    return this.send('GET', endpoint);
  }

  public post(endpoint: string, payload?: any): Promise<APIResponse> {
    return this.send('POST', endpoint, payload);
  }

  public put(endpoint: string, payload?: any): Promise<APIResponse> {
    return this.send('PUT', endpoint, payload);
  }

  public patch(endpoint: string, payload?: any): Promise<APIResponse> {
    return this.send('PATCH', endpoint, payload);
  }

  public delete(endpoint: string, payload?: any): Promise<APIResponse> {
    return this.send('DELETE', endpoint, payload);
  }

  private async send(method: HttpMethod, endpoint: string, payload?: any): Promise<APIResponse> {
    let fullUrl: string;
    const config: APIConfig = API.copyConfig(this.config);

    if (!config.options)
      config.options = {};

    config.options.method = method;

    if (!config.options.headers) 
      config.options.headers = {};

    config.options.body = typeof payload === 'object'
      ? JSON.stringify(payload)
      : payload;
    if (typeof payload === 'object' && !(payload instanceof FormData)) {
      if (!(config.options.headers as StringObject)['Content-Type'] && !(config.options.headers as StringObject)['content-type'])
        (config.options.headers as StringObject)['Content-Type'] = 'application/json';
    }

    const path = this.config.path ? '/'  + this.config.path : '';
    if (endpoint.startsWith('http'))
      fullUrl = endpoint;
    else 
      fullUrl = `${this.config.baseURL || ''}${path}${!endpoint.startsWith('/') ? '/' : ''}${endpoint}`;

    if (config.requestIntercept)
      config.requestIntercept({ ...config.options, endpoint: fullUrl });

    const response = await fetch(fullUrl, config.options);

    const res: APIResponse = {
      status: (response as Response).status,
      raw: response as Response,
      data: {},
      type: (response as Response).headers.get('content-type') || 'text/plain',
    };

    if (res.type?.includes('application/json'))
      res.data = await response.json();
    else if (typeof response.text === 'function')
      res.data = await response.text();

    if (config.responseIntercept)
      config.responseIntercept(res);

    return res;
  }
}