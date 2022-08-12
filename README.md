# HTTP Fetch Wrapper

Http client wrapper around fetch

## Usage

```ts
import { API } from 'http-fetch-wrapper';

const api = new API({
  baseURL: 'http://localhost:3000',
});

const data = await api.get('/animals');
```

## Response

```ts
export interface APIResponse<DataType = any> {
  data: DataType,
  status: number,
  raw?: Response,
  type?: string,
}
```