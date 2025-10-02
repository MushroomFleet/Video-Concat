import { contextBridge, ipcRenderer } from 'electron';

// Define the API that will be exposed to the renderer
export const electronAPI = {
  // File operations
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    saveFile: (defaultName: string) => ipcRenderer.invoke('dialog:saveFile', defaultName)
  },

  // App info
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => ipcRenderer.invoke('app:getPlatform')
  },

  // Video processing
  videoProcessor: {
    concatenate: (inputPaths: string[], outputPath: string) => 
      ipcRenderer.invoke('video:concatenate', { inputPaths, outputPath }),
    validateCompatibility: (inputPaths: string[]) => 
      ipcRenderer.invoke('video:validateCompatibility', inputPaths),
    cancel: () => ipcRenderer.invoke('video:cancel'),
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('video:progress', (_event, progress) => callback(progress));
    },
    removeProgressListener: () => {
      ipcRenderer.removeAllListeners('video:progress');
    }
  },

  // Environment detection
  isElectron: true
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript declaration for the global window object
declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}
