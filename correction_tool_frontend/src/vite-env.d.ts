/// <reference types="vite/client" />

interface Window {
  global: Window;
}

declare global {
  interface Window {
    global: Window;
  }
}

export {};
