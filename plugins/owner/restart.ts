import type { PluginHandler } from "@yuki/types";

let handler: PluginHandler = {
  cmd: ["restart"],
  rowner: true,
  exec: async (m, { conn, text }) => {
    if (!process.send) return m.reply(`Process not handled by cluster`);
    await m.reply(`Restarting bot... See ya!`)
    if (global.conn.user.jid === conn!!.user.jid) {
      process.send('reset');
    } else throw 'Restarting...'
  }
}

export default handler;
