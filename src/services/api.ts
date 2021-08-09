import axios, { AxiosError } from 'axios';
import Router from 'next/router';
import {destroyCookie, parseCookies, setCookie} from 'nookies';
import { AuthTokenError } from './errors/AuthTokenError';

let isRefreshing = false;
let failedRequestsQueue: any[] = [];

export const setupAPIClient = (ctx = undefined) => {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  });
  
  api.interceptors.response.use(response => response, (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (error.response.data?.code === 'token.expired') {
        cookies = parseCookies(ctx);
  
        const {'nextauth.refreshToken': refreshToken} = cookies;
        const originalConfig = error.config;
  
        if (!isRefreshing) {
          isRefreshing = true;
  
          api.post('/refresh', {refreshToken}).then(response => {
            const token = response.data.token; 
            const refreshToken = response.data.refreshToken;
    
            setCookie(undefined, "nextauth.token", token, {
              maxAge: 60 * 60 * 24 * 30,
              path: "/",
            });
      
            setCookie(undefined, "nextauth.refreshToken", refreshToken, {
              maxAge: 60 * 60 * 24 * 30,
              path: "/",
            });
    
            api.defaults.headers["Authorization"] = `Bearer ${token}`;
  
            failedRequestsQueue.forEach(request =>request.onSuccess(token));
            failedRequestsQueue = [];
          }).catch(err => {
            failedRequestsQueue.forEach(request =>request.onFailure(err));
            failedRequestsQueue = [];
  
            if (process.browser) {
              destroyCookie(undefined, "nextauth.token");
              destroyCookie(undefined, "nextauth.refreshToken");
  
              Router.push("/");
            } else {
              return Promise.reject(new AuthTokenError())
            }
          }).finally(() => {
            isRefreshing = false;
          })
  
          return new Promise((resolve, reject) => {
            failedRequestsQueue.push({
              onSuccess: (token: string) => {
                originalConfig.headers["Authorization"] = `Bearer ${token}`;
  
                resolve(api(originalConfig))
              },
              onFailure: (err: AxiosError) => {
                reject(err)
              }
            })
          })
        }
      } else {
        if (process.browser) {
          destroyCookie(undefined, "nextauth.token");
          destroyCookie(undefined, "nextauth.refreshToken");
    
          Router.push("/");
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }
  
    return Promise.reject(error);
  })

  return api;
}

