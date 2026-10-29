export type WhatsAppStatusResult =
  | { state: "accepted"; messageId?: string }
  | { state: "failed"; errorCode?: string }
  | { state: "not_configured" };

const STATUS_LABELS: Record<string, string> = {
  pending_confirmation: "Pending confirmation",
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export async function sendWhatsAppStatusUpdate(input: {
  phone: string;
  customerName: string;
  orderId: string;
  status: string;
}): Promise<WhatsAppStatusResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en_US";

  if (!accessToken || !phoneNumberId || !apiVersion || !templateName) {
    return { state: "not_configured" };
  }
  if (!/^v\d+\.\d+$/.test(apiVersion) || !/^[a-zA-Z0-9_]+$/.test(templateName)) {
    return { state: "not_configured" };
  }

  const digits = input.phone.replace(/\D/g, "");
  const recipient = digits.length === 10 ? "91" + digits : digits;
  if (!/^91[6-9]\d{9}$/.test(recipient)) return { state: "failed", errorCode: "INVALID_RECIPIENT" };

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: [{
            type: "body",
            parameters: [
              { type: "text", text: input.customerName.slice(0, 120) || "Customer" },
              { type: "text", text: input.orderId.slice(0, 100) },
              { type: "text", text: STATUS_LABELS[input.status] || input.status },
            ],
          }],
        },
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({})) as {
      messages?: Array<{ id?: string }>;
      error?: { code?: number | string };
    };
    if (!response.ok) {
      return { state: "failed", errorCode: String(payload.error?.code || response.status).slice(0, 40) };
    }
    return { state: "accepted", messageId: payload.messages?.[0]?.id };
  } catch {
    return { state: "failed", errorCode: "NETWORK_OR_TIMEOUT" };
  }
}
