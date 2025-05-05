/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_TEST: string
  // その他の環境変数があれば追加します
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
