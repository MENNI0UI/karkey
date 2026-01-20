/**
 * Email Service using Resend
 * Handles sending verification codes and other transactional emails
 */

import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender address
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@karkey.space';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a verification code email
 */
export async function sendVerificationEmail(
  to: string,
  code: string,
  lang: string = 'en'
): Promise<SendEmailResult> {
  try {
    const { subject, body } = getVerificationEmailContent(code, lang);

    const { data, error } = await resend.emails.send({
      from: `Karkey <${EMAIL_FROM}>`,
      to: [to],
      subject,
      html: body,
    });

    if (error) {
      console.error('[Email] Failed to send verification email:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Verification email sent successfully:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('[Email] Error sending verification email:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Get email content based on language
 */
function getVerificationEmailContent(code: string, lang: string): { subject: string; body: string } {
  const translations: Record<string, { subject: string; title: string; message: string; codeLabel: string; expiry: string; footer: string }> = {
    en: {
      subject: 'Verify your email - Karkey',
      title: 'Email Verification',
      message: 'Use the following code to verify your email address:',
      codeLabel: 'Your verification code',
      expiry: 'This code expires in 10 minutes.',
      footer: 'If you did not request this code, please ignore this email.',
    },
    fr: {
      subject: 'Vérifiez votre email - Karkey',
      title: 'Vérification de l\'email',
      message: 'Utilisez le code suivant pour vérifier votre adresse email:',
      codeLabel: 'Votre code de vérification',
      expiry: 'Ce code expire dans 10 minutes.',
      footer: 'Si vous n\'avez pas demandé ce code, veuillez ignorer cet email.',
    },
    ar: {
      subject: 'تحقق من بريدك الإلكتروني - كاركي',
      title: 'التحقق من البريد الإلكتروني',
      message: 'استخدم الرمز التالي للتحقق من بريدك الإلكتروني:',
      codeLabel: 'رمز التحقق الخاص بك',
      expiry: 'ينتهي هذا الرمز خلال 10 دقائق.',
      footer: 'إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد.',
    },
    es: {
      subject: 'Verifica tu email - Karkey',
      title: 'Verificación de email',
      message: 'Usa el siguiente código para verificar tu dirección de email:',
      codeLabel: 'Tu código de verificación',
      expiry: 'Este código expira en 10 minutos.',
      footer: 'Si no solicitaste este código, ignora este email.',
    },
  };

  const t = translations[lang] || translations.en;
  const isRtl = lang === 'ar';

  const body = `
<!DOCTYPE html>
<html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Karkey</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px; font-weight: 600; text-align: center;">${t.title}</h2>
              <p style="margin: 0 0 24px; color: #52525b; font-size: 15px; line-height: 1.6; text-align: center;">${t.message}</p>
              
              <!-- Code Box -->
              <div style="background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">${t.codeLabel}</p>
                <p style="margin: 0; font-size: 36px; font-weight: 700; color: #3b82f6; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</p>
              </div>
              
              <p style="margin: 0 0 8px; color: #a1a1aa; font-size: 13px; text-align: center;">⏱️ ${t.expiry}</p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">${t.footer}</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #fafafa; border-radius: 0 0 12px 12px; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Karkey. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject: t.subject, body };
}

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send an auction reminder email
 */
export async function sendAuctionReminderEmail(
  to: string,
  lang: string = 'en'
): Promise<SendEmailResult> {
  try {
    const { subject, body } = getAuctionReminderContent(to, lang);

    const { data, error } = await resend.emails.send({
      from: `Karkey Auctions <${EMAIL_FROM}>`,
      to: [to],
      subject,
      html: body,
    });

    if (error) {
      console.error('[Email] Failed to send auction reminder:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Auction reminder sent successfully:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error('[Email] Error sending auction reminder:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

/**
 * Get auction reminder email content
 */
function getAuctionReminderContent(email: string, lang: string): { subject: string; body: string } {
  // Generate unsubscribe token (base64 encoded email)
  const unsubscribeToken = Buffer.from(email).toString('base64');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://karkey.space';
  const unsubscribeUrl = `${appUrl}/${lang}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

  const translations: Record<string, { subject: string; title: string; message: string; cta: string; footer: string; unsubscribe: string }> = {
    en: {
      subject: 'The Weekend Collection is Live! - Karkey',
      title: 'The Auction Has Begun',
      message: 'The weekend auction event you have been waiting for is now live. Discover our exclusive collection of premium vehicles and place your bids before it is too late.',
      cta: 'View Auctions',
      footer: 'You are receiving this email because you requested a reminder for Karkey Auctions.',
      unsubscribe: 'Unsubscribe from auction reminders',
    },
    fr: {
      subject: 'La Collection du Week-end est en Ligne ! - Karkey',
      title: 'L\'Enchère a Commencé',
      message: 'L\'événement d\'enchères du week-end que vous attendiez est maintenant en ligne. Découvrez notre collection exclusive de véhicules premium et faites vos offres avant qu\'il ne soit trop tard.',
      cta: 'Voir les Enchères',
      footer: 'Vous recevez cet email car vous avez demandé un rappel pour les enchères Karkey.',
      unsubscribe: 'Se désabonner des rappels d\'enchères',
    },
    ar: {
      subject: 'مجموعة عطلة نهاية الأسبوع أصبحت متاحة! - كاركي',
      title: 'بدأ المزاد',
      message: 'بدأ حدث المزاد في عطلة نهاية الأسبوع الذي كنت تنتظره. اكتشف مجموعتنا الحصرية من المركبات المتميزة وقدم عروضك قبل فوات الأوان.',
      cta: 'عرض المزادات',
      footer: 'أنت تتلقى هذا البريد الإلكتروني لأنك طلبت تذكيراً بمزادات كاركي.',
      unsubscribe: 'إلغاء الاشتراك من تذكيرات المزادات',
    },
    es: {
      subject: '¡La Colección de Fin de Semana está en Vivo! - Karkey',
      title: 'La Subasta Ha Comenzado',
      message: 'El evento de subasta de fin de semana que has estado esperando ya está en vivo. Descubre nuestra colección exclusiva de vehículos premium y haz tus ofertas antes de que sea demasiado tarde.',
      cta: 'Ver Subastas',
      footer: 'Recibes este correo porque solicitaste un recordatorio para las subastas de Karkey.',
      unsubscribe: 'Cancelar suscripción a recordatorios de subastas',
    },
  };

  const t = translations[lang] || translations.en;
  const isRtl = lang === 'ar';

  const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://karkey.space'}/logo.png`;

  const body = `
<!DOCTYPE html>
<html lang="${lang}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Playfair Display', Georgia, serif; background-color: #f8f9fa;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 4px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #eaeaea;">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 32px 20px; text-align: center; border-bottom: 3px solid #00A651;">
              <img src="${logoUrl}" alt="Karkey" style="width: 140px; height: auto; display: block; margin: 0 auto;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px; text-align: center;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${t.title}</h2>
              <div style="width: 50px; height: 3px; background-color: #B8071C; margin: 0 auto 30px;"></div>
              
              <p style="margin: 0 0 40px; color: #4a4a4a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.8;">${t.message}</p>
              
              <!-- CTA Button -->
              <a href="${appUrl}/auctions" style="display: inline-block; padding: 18px 45px; background: linear-gradient(135deg, #00A651 0%, #008C44 100%); color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(0, 166, 81, 0.2); font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
                ${t.cta}
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 40px 32px; background-color: #111111;">
              <p style="margin: 0; color: #999999; font-size: 13px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center; line-height: 1.6;">${t.footer}</p>
              
              <div style="margin: 25px auto; width: 100px; height: 1px; background-color: #333;"></div>
              
              <p style="margin: 0; font-size: 14px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: #ffffff; text-decoration: none; border-bottom: 1px solid #666; padding-bottom: 2px;">${t.unsubscribe}</a>
              </p>
              
              <p style="margin: 20px 0 0; color: #555555; font-size: 11px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; text-align: center;">
                © ${new Date().getFullYear()} Karkey. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return { subject: t.subject, body };
}
