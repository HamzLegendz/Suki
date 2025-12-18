import { areJidsSameUser, generateWAMessage, proto, type BaileysEventMap } from "baileys";
import type { ExtendedWAMessage } from "types/extendWAMessage";
import { commandCache } from "../../libs/commandCache";

const processedMessages = new Set<string>();

export async function before(m: ExtendedWAMessage, chatUpdate: BaileysEventMap["messages.upsert"]) {
  if (m.isBaileys) return;
  if (!m.message) return;

  const messageId = m.key.id;
  if (processedMessages.has(messageId as string)) return;

  const hasInteractiveResponse = m.message.interactiveResponseMessage;
  const hasExtendedWithInteractive = m.message.extendedTextMessage?.contextInfo?.quotedMessage?.interactiveMessage;

  if (!(m.message.buttonsResponseMessage || m.message.templateButtonReplyMessage || m.message.listResponseMessage || hasInteractiveResponse || hasExtendedWithInteractive)) return;

  processedMessages.add(messageId as string);
  if (processedMessages.size > 100) {
    const firstItem = processedMessages.values().next().value;
    processedMessages.delete(firstItem as string);
  }

  let id = m.message.buttonsResponseMessage?.selectedButtonId ||
    m.message.templateButtonReplyMessage?.selectedId ||
    m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    (m as any).message.interactiveResponseMessage?.paramsJson;

  let text = m.message.buttonsResponseMessage?.selectedDisplayText ||
    m.message.templateButtonReplyMessage?.selectedDisplayText ||
    m.message.listResponseMessage?.title ||
    (m as any).message.InteractiveResponseMessage?.paramsJson;

  if (!id && hasExtendedWithInteractive) {
    const quotedMsg = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const buttons = quotedMsg?.interactiveMessage?.nativeFlowMessage?.buttons;
    const sentText = m.message.extendedTextMessage?.text;

    if (buttons && sentText) {
      const matchedButton = buttons.find((btn: any) => {
        try {
          const params = JSON.parse(btn.buttonParamsJson);
          return params.display_text === sentText;
        } catch {
          return false;
        }
      });

      if (matchedButton) {
        const params = JSON.parse(matchedButton.buttonParamsJson as string);
        id = params.id;
        text = params.display_text;
      }
    }
  }

  if (!id && !text) return;

  let isIdMessage = false;
  let usedPrefix: string = '';

  const str2Regex = (str: string) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
  let _prefix = this.prefix ? this.prefix : global.prefix;

  let command: string | undefined;

  if (_prefix instanceof RegExp) {
    const match = _prefix.exec(id);
    if (match) {
      usedPrefix = match[0];
      command = id.replace(usedPrefix, '').trim().split(' ')[0];
    }
  } else if (Array.isArray(_prefix)) {
    for (let p of _prefix) {
      const prefix = p instanceof RegExp ? null : p;
      if (prefix && id.startsWith(prefix)) {
        usedPrefix = prefix;
        command = id.replace(usedPrefix, '').trim().split(' ')[0];
        break;
      } else if (p instanceof RegExp) {
        const match = p.exec(id);
        if (match) {
          usedPrefix = match[0];
          command = id.replace(usedPrefix, '').trim().split(' ')[0];
          break;
        }
      }
    }
  } else if (typeof _prefix === 'string') {
    if (id.startsWith(_prefix)) {
      usedPrefix = _prefix;
      command = id.replace(usedPrefix, '').trim().split(' ')[0];
    }
  }

  if (command) {
    const cached = commandCache.find(command);
    if (cached) {
      isIdMessage = true;
    }
  }

  let messages = await generateWAMessage(m.chat, {
    text: isIdMessage ? id : text,
    mentions: m.mentionedJid
  }, {
    userJid: this.user.id,
    quoted: (m as any).quoted && (m as any).quoted.fakeObj
  } as any);

  messages.key.fromMe = areJidsSameUser(m.sender, this.user.id);
  messages.key.id = m.key.id;
  messages.pushName = m.name;

  if (m.isGroup) {
    messages.key.participant = messages.participant = m.sender;
  }

  let msg = {
    ...chatUpdate,
    messages: [proto.WebMessageInfo.fromObject(messages)].map(v => ((v as any).conn = this, v)),
    type: 'append'
  };

  this.ev.emit('messages.upsert', msg);
}
