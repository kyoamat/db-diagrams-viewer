import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { createConnection } from 'mysql2'

// Custom APIs for renderer
const mysql = {
  createConnection: (connStr: string) => {
    const client = createConnection(connStr)

    const query = (sql: string, params: string[] = []) => client.promise().query(sql, params)

    return {
      query
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('mysql', mysql)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.mysql = mysql
}
