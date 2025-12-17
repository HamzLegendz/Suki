let handler: any = m => m;
handler.all = async function(m: any) {
  global.doc = pickRandom([
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/msword",
    "application/pdf"
  ]);
}

export default handler;

function pickRandom(list: string[]) {
  return list[Math.floor(list.length * Math.random())];
}
