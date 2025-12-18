import type { PluginHandler } from "@yuki/types";
import os from "node:os";

let handler: PluginHandler = {
  name: "Ping plugin",
  description: " Command to check whether the bot is responding or not",
  tags: ["general"],
  cmd: ["ping", "p"],
  exec: async (m, { conn, delay }) => {
    let start = performance.now();
    let info = {
      OS: `${os.type()} ${os.release()} (${os.arch()})`,
      RAM: `${(os.totalmem() / 1024 / 1024).toFixed(2)} MB`,
      Used_RAM: `${(os.totalmem() - os.freemem()) / 1024 / 1024} MB`,
      CPU_Load: `${(os.loadavg()[0]!! / os.cpus().length * 100).toFixed(2)}%`,
      Bun: Bun.version,
      Owner: 'Ditzzy Devs'
    }
    let end = performance.now();
    let result = start - end;
    let caption = Object.entries(info).map(([key, value]) => `• *${key}:* ${value}`).join('\n') + `\n\nRequest to this command took: ${result.toFixed(2)}ms`
    const response = await conn!!.sendMessage(m.chat, { text: "Pingging..." }, { quoted: m });
    await delay!!(500)
    await conn!!.sendMessage(m.chat, {
      text: caption,
      edit: response?.key,
    }, { quoted: m });
  }
};

export default handler;

