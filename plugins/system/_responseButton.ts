import { areJidsSameUser, generateWAMessage, proto } from "baileys"

export async function before(m, chatUpdate) {
  if (m.isBaileys) return
  if (!m.message) return
  
  if (m.mtype === "templateButtonReplyMessage" && m.quoted?.fromMe) {
    await appenTextMessage(JSON.parse(m.msg.selectedId), chatUpdate)
  }
  
  if (m.mtype === "extendedTextMessage" && m.quoted?.fromMe) {
    const quotedMsg = m.msg?.contextInfo?.quotedMessage
    if (quotedMsg?.interactiveMessage?.nativeFlowMessage?.buttons) {
      const buttons = quotedMsg.interactiveMessage.nativeFlowMessage.buttons
      const matchedButton = buttons.find(btn => {
        try {
          const params = JSON.parse(btn.buttonParamsJson)
          return params.display_text === m.text
        } catch {
          return false
        }
      })
      
      if (matchedButton) {
        const params = JSON.parse(matchedButton.buttonParamsJson)
        await appenTextMessage(params.id, chatUpdate)
      }
    }
  }
  
  async function appenTextMessage(text, chatUpdate) {
    let messages = await generateWAMessage(m.chat, { 
      text: text, 
      mentions: m.mentionedJid 
    }, {
      userJid: conn.user.id,
      quoted: m.quoted && m.quoted.fakeObj
    } as any)
    
    messages.key.fromMe = areJidsSameUser(m.sender, conn.user.id)
    messages.key.id = m.key.id
    messages.pushName = m.pushName
    if (m.isGroup) messages.participant = m.sender
    
    let msg = {
      ...chatUpdate,
      messages: [proto.WebMessageInfo.fromObject(messages)],
      type: 'append'
    }
    
    this.ev.emit('messages.upsert', msg)
  }
}