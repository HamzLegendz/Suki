import type { ExtendedWASocket } from "../types/extendWASocket";

export { };

declare global {
  var opts: any;
  var prefix: any;
  var db: Low<any>;
  var loadDatabase: () => Promse<void>;
  var conn: ExtendedWASocket;
}

declare global {
  interface String {
    decodeJid: (jid?: string) => any;
    getRandom: any;
    capitalize: (text?: string) => any;
    capitalizeV2: (text?: string) => any;
    isNumber: (text?: string) => any;
  }
  
  interface Number {
    getRandom: any;
    toTimeString: (time?: number) => any;
    isNumber: (theNumber?: number) => any;
  }
  
  interface Array {
    getRandom: () => any;
  }
  
  interface ArrayBuffer {
    toBuffer: (bufferData: any) => any;
    getFileType: (bufferData: any) => any;
  }
  
  interface Uint8Array {
    getFileType: (bufferData: any) => any;
  }
}