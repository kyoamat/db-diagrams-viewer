import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    mysql: MysqlAPI
  }
}

export interface MysqlAPI {
  createConnection: (connStr: string) => {
    query: (sql: string, params: string[] = []) => unknown
  }
}
