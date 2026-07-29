// Configurações Globais do PIX
// ALtere essas informações se quiser mudar a conta que recebe os pagamentos
export const PIX_CONFIG = {
  CHAVE: "00020101021126790014BR.GOV.BCB.PIX2557pix-qr.mercadopago.com/instore/ol/v2/rYkkj6NOoackp2hZz06N5204000053039865802BR5912TassiAchando6009SAO PAULO62080504mpis63048ACA",
  NOME: "TASSIANE DA SILVA SOUTO",
  CIDADE: "RECIFE",
};

// Algoritmo do Banco Central (EMV) para formatar o QR Code
function getCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

function formatSize(str: string): string {
  return str.length.toString().padStart(2, "0");
}

export function generatePixPayload(amount: number, txid = "***"): string {
  // Limpa caracteres especiais e limita tamanho segundo regras do BACEN
  const name = PIX_CONFIG.NOME.substring(0, 25).toUpperCase().replace(/[^\w\s]/gi, '');
  const city = PIX_CONFIG.CIDADE.substring(0, 15).toUpperCase().replace(/[^\w\s]/gi, '');
  const key = PIX_CONFIG.CHAVE;
  
  const payloadKey = `0014BR.GOV.BCB.PIX01${formatSize(key)}${key}`;
  const guiInfo = `26${formatSize(payloadKey)}${payloadKey}`;
  const amountStr = amount.toFixed(2);
  const amountInfo = `54${formatSize(amountStr)}${amountStr}`;
  
  const txidStr = `05${formatSize(txid)}${txid}`;
  const addData = `62${formatSize(txidStr)}${txidStr}`;
  
  // Monta string do Payload base
  const payload = `000201${guiInfo}520400005303986${amountInfo}5802BR59${formatSize(name)}${name}60${formatSize(city)}${city}${addData}6304`;
  
  // Calcula o CRC16 final e anexa
  const crc = getCRC16(payload);
  return payload + crc;
}
