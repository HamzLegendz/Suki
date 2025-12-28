import type { PluginHandler } from "@yuki/types";

let handler: PluginHandler = {
  name: "Check channel ID",
  description: "Check the channel ID in the form of @newsletter",
  cmd: ["cekchid", "chid", "checkidchannel"],
  register: true,
  premium: true,
  exec: async (m, { conn }) => {
    try {
      let id = (await m.getQuotedObj())?.msg.contextInfo.forwardedNewsletterMessageInfo;
      conn!!.sendButtonV2(m.chat, {
        body: {
          text: `This is your newsletter id from: ${id.newsletterName}`
        },
        footer: {
          text: "Copy the ID below"
        },
      }, [{
        type: "copy",
        text: "Copy",
        copy_code: id.newsletterJid
      }], { quoted: m } as any)
    } catch (e) {
      throw `❌ Messages must be forwarded from the channel, Or the message is too old.`
    }
  }
}

export default handler;
