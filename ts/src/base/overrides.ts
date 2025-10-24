// ! --- Usher Labs: HTTP override types ---
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export type HttpClientOverride = (req: {
  method: string;
  url: string;
  config: AxiosRequestConfig;
  data?: any;
  meta?: { methodCalled?: string; [k: string]: unknown };
}) => Promise<AxiosResponse>;

export type HttpOverridePredicate = (args: {
  method: string;
  methodCalled: string;
  url: string;
}) => boolean;
