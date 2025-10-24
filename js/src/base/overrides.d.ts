import type { AxiosRequestConfig, AxiosResponse } from 'axios';
export declare type HttpClientOverride = (req: {
    method: string;
    url: string;
    config: AxiosRequestConfig;
    data?: any;
    meta?: {
        methodCalled?: string;
        [k: string]: unknown;
    };
}) => Promise<AxiosResponse>;
export declare type HttpOverridePredicate = (args: {
    method: string;
    methodCalled: string;
    url: string;
}) => boolean;
