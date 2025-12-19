import type { PluginHandler } from "@yuki/types";
import { readdirSync, statSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let handler: PluginHandler = {
  cmd: ["clear"],
  rowner: true,
  mods: true,
  exec: async (m, { conn }) => {
    conn!!.reply(m.chat, "Success!", m);

    const tmp = ["../../tmp", join(__dirname, '../../tmp')]
    const filename: any = []
    tmp.forEach((dirname: string) => readdirSync(dirname).forEach((file: string) => filename.push(join(dirname, file))))
    return filename.map((file: string) => {
      const stats = statSync(file)
      unlinkSync(file)
    })
  }
}

export default handler;
