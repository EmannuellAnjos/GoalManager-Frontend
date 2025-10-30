/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_USER_ID: string
  // mais variáveis de ambiente podem ser adicionadas aqui
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}