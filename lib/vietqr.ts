import type { PaymentSettings } from "@/lib/pos-types";

function field(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function sanitizeText(value: string, maximumLength: number) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, maximumLength);
}

function crc16Ccitt(value: string) {
  let crc = 0xffff;
  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function canGenerateVietQr(settings: PaymentSettings) {
  return /^\d{6}$/.test(settings.bankBin) && /^\d{6,19}$/.test(settings.accountNumber) && sanitizeText(settings.accountName, 50).length >= 5;
}

export function buildVietQrPayload(settings: PaymentSettings, amount: number, addInfo: string) {
  if (!canGenerateVietQr(settings)) return null;
  const accountInfo = field("38", field("00", "A000000727") + field("01", field("00", settings.bankBin) + field("01", settings.accountNumber) + field("02", "QRIBFTTA")));
  const amountField = amount > 0 ? field("54", String(Math.round(amount))) : "";
  const info = sanitizeText(addInfo, 25);
  const additional = info ? field("62", field("08", info)) : "";
  const payloadWithoutCrc = `000201010212${accountInfo}5303704${amountField}5802VN${additional}6304`;
  return `${payloadWithoutCrc}${crc16Ccitt(payloadWithoutCrc)}`;
}
