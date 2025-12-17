import type { ExtendedWAMessage } from "../types/extendWAMessage";

let handler = {
  name: "Ping plugin",
  description: " Command to check whether the bot is responding or not",
  cmd: ["ping", "p"],
  exec: async (m: ExtendedWAMessage, { conn }) => {
    m.reply(`Responded!!\nid: ${m.sender}`)
  }
};

export default handler;
