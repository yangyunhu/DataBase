/// <reference types="vite/client" />

// 为 import.meta.env 添加类型声明
declare interface ImportMeta {
  env: {
    BASE_URL: string;
    NODE_ENV: string;
  };
}