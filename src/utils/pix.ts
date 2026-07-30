// Configurações Globais do PIX
// ALtere essas informações se quiser mudar a conta que recebe os pagamentos
export const PIX_CONFIG = {
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
  
  let key = localStorage.getItem("pixKey") || "tassiachando@email.com";
  // Basic sanitization for phone numbers and CPF/CNPJ
  if (/^[\d\.\-\(\)\s\+]+$/.test(key) && !key.includes("@")) {
    key = key.replace(/[^\d+]/g, '');
    if (key.length === 11 && !key.startsWith("+")) {
      key = "+55" + key; // Assume BR phone number if it has 11 digits and is just numbers
    }
  }

  // If the user pasted a full PIX payload instead of a key, we warn them (though we can't show toast here easily without importing it, we just fallback or return it directly without amount).
  if (key.startsWith("000201")) {
    // If it's a full payload, it's very hard to correctly inject the amount without a full EMV parser.
    // For now, if they paste a Mercado Pago payload, we just return it as is, which means they scan but type the value manually.
    return key;
  }
  
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
