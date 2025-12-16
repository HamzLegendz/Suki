import type { BaileysEventMap } from "baileys"
import { smsg } from "./libs/serialize";
import type { ExtendedWAMessage } from "./types/extendWAMessage";

const isNumber = (x: number) => typeof x === 'number' && !isNaN(x)
const delay = (ms: number) => isNumber(ms) && new Promise(resolve => setTimeout(resolve, ms))

export async function handler(chatUpdate: BaileysEventMap["messages.upsert"]) {
  if (!chatUpdate) return;
  this.pushMessage(chatUpdate.messages);
  let m = chatUpdate.messages[chatUpdate.messages.length - 1] as ExtendedWAMessage;
  if (!m) return;
  if (global.db.data != null) await loadDatabase();
  try {
    m = smsg(this, m) || m
    if (!m) return;
    // TODO: Continue to database
    
  } catch (e) {
    console.error(e);
  }
}
