export interface WhatsAppMessage {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  template: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: string;
      parameters?: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';

if (!accessToken || !phoneNumberId) {
  console.warn('WhatsApp credentials are not configured');
}

const apiUrl = `https://graph.instagram.com/${apiVersion}/${phoneNumberId}/messages`;

export async function sendWhatsAppOTP(
  phone: string,
  otp: string
): Promise<boolean> {
  if (!accessToken || !phoneNumberId) {
    console.warn('WhatsApp is not configured');
    return false;
  }

  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME || 'otp_verification';
  const templateLang = process.env.WHATSAPP_OTP_TEMPLATE_LANG || 'ar';

  const message: WhatsAppMessage = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: templateLang,
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: otp,
            },
          ],
        },
      ],
    },
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send WhatsApp OTP:', error);
    return false;
  }
}
