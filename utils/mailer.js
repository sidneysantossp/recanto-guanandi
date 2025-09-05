const nodemailer = require('nodemailer');

let transporter = null;

function initTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        // Em alguns provedores (dev/test) pode ser necessário desabilitar a verificação de certificado
        rejectUnauthorized: false,
      },
    });
  }
}

initTransporter();

function isConfigured() {
  return !!transporter;
}

async function sendMail({ to, subject, html, text, from }) {
  if (!transporter) {
    throw new Error('Mailer não configurado: defina SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS no .env');
  }
  const fromAddress = from || process.env.SMTP_FROM || 'Condomínio Guanandi <no-reply@guanandi.app>';
  return transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    html,
    text,
  });
}

module.exports = {
  isConfigured,
  sendMail,
};