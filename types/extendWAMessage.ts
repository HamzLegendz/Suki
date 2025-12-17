import type { proto, WAMessage } from "baileys";
import type { MiscMessageGenerationOptions } from "baileys";
import type { ExtendedWASocket } from "./extendWASocket";

export type ExtendedWAMessage =
  WAMessage & MiscMessageGenerationOptions & {
    conn: ExtendedWASocket;

    id: string | null | undefined;
    isBaileys: boolean;
    chat: string;
    isGroup: boolean;
    sender: string;
    fromMe: boolean;
    mtype: string;
    msg: any;
    mediaMessage: any;
    messages: any;
    mediaType: string | null;

    _text: string | null;
    text: string;

    mentionedJid: string[];
    name: string | null;

    device: string;
    isBot: boolean;

    quoted: QuotedMessage | null;

    download(saveToFile?: boolean): Promise<Buffer>;
    reply(text: string, chatId?: string, options?: MiscMessageGenerationOptions): Promise<any>;
    copy(): ExtendedWAMessage;
    forward(jid: string, force?: boolean, options?: any): Promise<any>;
    copyNForward(jid: string, forceForward?: boolean, options?: any): Promise<any>;
    cMod(jid: string, text?: string, sender?: string, options?: any): Promise<any>;
    getQuotedObj(): ExtendedWAMessage | null;
    getQuotedMessage: () => ExtendedWAMessage | null;
    delete(): Promise<any>;
    react(text: string): Promise<any>;
    [key: string]: any;
  }

export interface QuotedMessage {
  mtype: string;
  mediaMessage: any;
  messages: any;
  mediaType: string | null;
  id: string;
  chat: string;
  isBaileys: boolean;
  sender: string;
  fromMe: boolean;
  text: string;
  mentionedJid: string[];
  name: string | null;
  vM: proto.IWebMessageInfo;
  fakeObj: proto.IWebMessageInfo;
  device: string;
  isBot: boolean;

  command: {
    command: string;
    args: string[];
    args_v2: string[];
    noPrefix: string;
    match: any;
  };

  download(saveToFile?: boolean): Promise<Buffer>;
  reply(text: string, chatId?: string, options?: any): Promise<any>;
  copy(): ExtendedWAMessage;
  forward(jid: string, force?: boolean, options?: any): Promise<any>;
  copyNForward(jid: string, forceForward?: boolean, options?: any): Promise<any>;
  cMod(jid: string, text?: string, sender?: string, options?: any): Promise<any>;
  delete(): Promise<any>;
  react(text: string): Promise<any>;

  [key: string]: any;
}

export type SmsgReturn = ExtendedWAMessage;
