import { Injectable } from "@nestjs/common";
import { Resend } from "resend";
import { config } from "src/config";
import { ExceptionService } from "../interceptor/interceptor.service";
import { MtzService } from "../mtz/mtz.service";
import { ROLE } from "generated/prisma";

export type PaymentReceiptProps = {
  clientName: string;
  email: string;
  street: string;
  barangay: string;
  city: string;
  province?: string | null;
  projectName: string;
  block: string;
  lot: string;
  modeOfPayment: string;
  referenceNumber?: string | null;
  agent: string;
  totalInWords: string;
  total: string;
  receiptNumber?: string | null;
};

export type PaymentReminderProps = Pick<PaymentReceiptProps, "email"> & {
  dueDate: number;
  amount: string;
  project: string;
  block: string;
  phase: string;
  lot: string;
  penalty?: string;
  monthsPassed?: number;
};

@Injectable()
export class MessagingService {
  constructor(
    private exceptionService: ExceptionService,
    private mtzService: MtzService,
  ) {}

  private resend = new Resend(config.resend_api_key);

  async onSendPaymentReceipt({
    clientName,
    email,
    street,
    barangay,
    city,
    province,
    projectName,
    block,
    lot,
    modeOfPayment,
    referenceNumber,
    agent,
    totalInWords,
    total,
    receiptNumber,
  }: PaymentReceiptProps) {
    try {
      const currentDate = this.mtzService
        .mtz()
        .format(this.mtzService.dateFormat.fullDateAbbrev);
      const { data, error } = await this.resend.emails.send({
        from: `RMD Land Support <${config.email_from}${config.domain}>`,
        to: email,
        subject: "Monthly Payment Receipt - RMD Land",
        replyTo: `${config.email_reply_to}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; }
              .container { width: 100%; max-width: 800px; margin: 0 auto; }
              .receipt-container { border: 1px solid #e0e0e0; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
              .header { text-align: center; margin-bottom: 20px; }
              .title-container h2 { margin: 0; }
              .title-container p { margin: 5px 0; }
              .invoice-title { text-align: center; margin: 15px 0; font-weight: bold; }
              .details-container { width: 100%; border-collapse: collapse; }
              .details-column { width: 50%; vertical-align: top; padding-right: 20px; }
              .details-row { margin-bottom: 10px; }
              .label { font-weight: bold; width: 130px; display: inline-block; }
              .value-container { border-bottom: 1px solid #000; display: inline-block; min-width: 200px; padding-bottom: 2px; }
              .payment-type { text-align: right; margin-top: 20px; }
              .footer { margin-top: 30px; text-align: right; }
              .footer-row { margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="receipt-container">
                <div class="header">
                  <h2>RMD LAND</h2>
                  <p>1 Pascual St. Brgy. Special District, Jalajala Rizal</p>
                  <p>0993-600-1468 • rmdland21@gmail.com</p>
                </div>
                
                <h3 class="invoice-title">INVOICE</h3>
                
                <table class="details-container">
                  <tr>
                    <td class="details-column">
                      <div class="details-row">
                        <span class="label">Project Name:</span>
                        <span class="value-container">${projectName}</span>
                      </div>
                      <div class="details-row">
                        <span class="label">Blk. & Lot:</span>
                        <span class="value-container">Blk ${block}, Lot ${lot}</span>
                      </div>
                      <div class="details-row">
                        <span class="label">Mode of Payment:</span>
                        <span class="value-container">${modeOfPayment}</span>
                      </div>
                      <div class="details-row">
                        <span class="label">Reference No.:</span>
                        <span class="value-container">${referenceNumber || "---"}</span>
                      </div>
                      <div class="details-row">
                        <span class="label">Team Head / Agent:</span>
                        <span class="value-container">${agent}</span>
                      </div>
                    </td>
                    <td class="details-column">
                      <div class="details-row">
                        <span class="label">Received from:</span>
                        <span class="value-container">${clientName}</span>
                      </div>
                      <div class="details-row">
                        <span class="label">Address:</span>
                        <span class="value-container">${street} ${barangay} ${city} ${province}</span>
                      </div>
                      <div class="details-row">
                        <span class="label">The sum of:</span>
                        <span class="value-container">${totalInWords} (${total})</span>
                      </div>
                      <div class="payment-type">
                        <p>As Monthly Payment</p>
                      </div>
                    </td>
                  </tr>
                </table>
                
                <div class="footer">
                  <div class="footer-row">
                    <span class="label">No.:</span> ${receiptNumber}
                  </div>
                  <div class="footer-row">
                    <span class="label">Date:</span> ${currentDate}
                  </div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        this.exceptionService.throw(
          `Failed to send email ${error?.message}`,
          "BAD_REQUEST",
        );
        return;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async onSendPaymentReminderInDueDate({
    email,
    dueDate,
    amount,
    project,
    phase,
    block,
    lot,
  }: PaymentReminderProps) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `RMD Land Support <${config.email_from}${config.domain}>`,
        to: email,
        subject: "Monthly Payment Reminder - RMD Land",
        replyTo: `${config.email_reply_to}`,
        html: `
          <!doctype html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width" />
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
              <style>
                body {
                  background-color: #eaebed;
                  font-family: sans-serif;
                  -webkit-font-smoothing: antialiased;
                  font-size: 14px;
                  line-height: 1.4;
                  margin: 0;
                  padding: 0;
                  -ms-text-size-adjust: 100%;
                  -webkit-text-size-adjust: 100%; 
                }
                table {
                  border-collapse: separate;
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  min-width: 100%;
                  width: 100%; 
                }
                table td {
                    font-family: sans-serif;
                    font-size: 20px;
                    vertical-align: top; 
                }
                .align-center {
                  text-align: center;
                }
                .body {
                  width: 100%;
                }
                .container {
                  max-width: 580px;
                  width: 580px;
                }
                .content {
                  margin-top: 20px;
                  background-color: white;
                  border-radius: 5px;
                  padding: 20px;
                }
                .details p{
                  padding: 0;
                }
                .separator {
                  border: 1px dashed black;
                  width: 100%;
                }
                .note p {
                  font-size: 14px;
                }
                .note p strong {
                  color: red;
                }
              </style>
            </head>
            <body class="">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
                <tr>
                  <td>&nbsp;</td>
                  <td class="container">
                    <div class="content">
                      <table role="presentation" border="0" class="main" cellpadding="0" cellspacing="0">
                        <tr>
                          <td class="align-center" width="100%">
                            <a href="https://postdrop.io"><img src="https://cdn.postdrop.io/starter-templates-v0/postdrop-logo-dark.png" height="40" alt="rmdland"></a>
                          </td>
                        </tr>
                        <tr>
                          <td class="align-center" width="100%">
                            <h2>Monthly Payment Reminder</h2>
                          </td>
                        </tr>
                        <tr>
                          <td class="wrapper">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td>
                                  <p>This is a friendly reminder that your upcoming monthly installment of <strong>${amount}</strong> is due in <strong>${dueDate} day(s)</strong>. We recommend preparing your payment in advance to ensure a smooth and timely transaction.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="separator" />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="details">
                              <p>Project: <strong>${project}</strong><br/>Phase: <strong>${phase}</strong><br />Block: <strong>${block}</strong><br />Lot: <strong>${lot}</strong><br />Amount to Pay: <strong>${amount}</strong></p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="note">
                              <p>Note: <strong>Late payments will incur a penalty fee, which will be added to your monthly payment.</strong></p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                  <td>&nbsp;</td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      if (error) {
        this.exceptionService.throw(
          `Failed to send email ${error?.message}`,
          "BAD_REQUEST",
        );
        return;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async onSendPaymentReminderTodayDueDate({
    email,
    amount,
    project,
    phase,
    block,
    lot,
  }: Omit<PaymentReminderProps, "dueDate">) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `RMD Land Support <${config.email_from}${config.domain}>`,
        to: email,
        subject: "Monthly Payment Reminder - RMD Land",
        replyTo: `${config.email_reply_to}`,
        html: `
          <!doctype html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width" />
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
              <style>
                body {
                  background-color: #eaebed;
                  font-family: sans-serif;
                  -webkit-font-smoothing: antialiased;
                  font-size: 14px;
                  line-height: 1.4;
                  margin: 0;
                  padding: 0;
                  -ms-text-size-adjust: 100%;
                  -webkit-text-size-adjust: 100%; 
                }
                table {
                  border-collapse: separate;
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  min-width: 100%;
                  width: 100%; 
                }
                table td {
                    font-family: sans-serif;
                    font-size: 20px;
                    vertical-align: top; 
                }
                .align-center {
                  text-align: center;
                }
                .body {
                  width: 100%;
                }
                .container {
                  max-width: 580px;
                  width: 580px;
                }
                .content {
                  margin-top: 20px;
                  background-color: white;
                  border-radius: 5px;
                  padding: 20px;
                }
                .details p{
                  padding: 0;
                }
                .separator {
                  border: 1px dashed black;
                  width: 100%;
                }
                .note p {
                  font-size: 14px;
                }
                .note p strong {
                  color: red;
                }
              </style>
            </head>
            <body class="">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
                <tr>
                  <td>&nbsp;</td>
                  <td class="container">
                    <div class="content">
                      <table role="presentation" border="0" class="main" cellpadding="0" cellspacing="0">
                        <tr>
                          <td class="align-center" width="100%">
                            <a href="https://postdrop.io"><img src="https://cdn.postdrop.io/starter-templates-v0/postdrop-logo-dark.png" height="40" alt="rmdland"></a>
                          </td>
                        </tr>
                        <tr>
                          <td class="align-center" width="100%">
                            <h2>Monthly Payment Reminder</h2>
                          </td>
                        </tr>
                        <tr>
                          <td class="wrapper">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td>
                                  <p>This is a friendly reminder that your monthly installment of <strong>${amount}</strong> is due <strong>today</strong>. We recommend settling your payment as soon as possible to ensure a smooth and timely transaction.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="separator" />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="details">
                              <p>Project: <strong>${project}</strong><br/>Phase: <strong>${phase}</strong><br />Block: <strong>${block}</strong><br />Lot: <strong>${lot}</strong><br />Amount to Pay: <strong>${amount}</strong></p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="note">
                              <p>If you have already settled your payment and received this message, you can safely ignore it.</p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="note">
                              <p>Note: <strong>Late payments will incur a penalty fee, which will be added to your monthly payment.</strong></p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                  <td>&nbsp;</td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      if (error) {
        this.exceptionService.throw(
          `Failed to send email ${error?.message}`,
          "BAD_REQUEST",
        );
        return;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async onSendPaymentReminderOverDueDate({
    email,
    amount,
    project,
    phase,
    block,
    lot,
  }: Omit<PaymentReminderProps, "dueDate">) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `RMD Land Support <${config.email_from}${config.domain}>`,
        to: email,
        subject: "Monthly Payment Reminder - RMD Land",
        replyTo: `${config.email_reply_to}`,
        html: `
          <!doctype html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width" />
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
              <style>
                body {
                  background-color: #eaebed;
                  font-family: sans-serif;
                  -webkit-font-smoothing: antialiased;
                  font-size: 14px;
                  line-height: 1.4;
                  margin: 0;
                  padding: 0;
                  -ms-text-size-adjust: 100%;
                  -webkit-text-size-adjust: 100%; 
                }
                table {
                  border-collapse: separate;
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  min-width: 100%;
                  width: 100%; 
                }
                table td {
                    font-family: sans-serif;
                    font-size: 20px;
                    vertical-align: top; 
                }
                .align-center {
                  text-align: center;
                }
                .body {
                  width: 100%;
                }
                .container {
                  max-width: 580px;
                  width: 580px;
                }
                .content {
                  margin-top: 20px;
                  background-color: white;
                  border-radius: 5px;
                  padding: 20px;
                }
                .details p{
                  padding: 0;
                }
                .separator {
                  border: 1px dashed black;
                  width: 100%;
                }
                .note p {
                  font-size: 14px;
                }
                .note p strong {
                  color: red;
                }
              </style>
            </head>
            <body class="">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
                <tr>
                  <td>&nbsp;</td>
                  <td class="container">
                    <div class="content">
                      <table role="presentation" border="0" class="main" cellpadding="0" cellspacing="0">
                        <tr>
                          <td class="align-center" width="100%">
                            <a href="https://postdrop.io"><img src="https://cdn.postdrop.io/starter-templates-v0/postdrop-logo-dark.png" height="40" alt="rmdland"></a>
                          </td>
                        </tr>
                        <tr>
                          <td class="align-center" width="100%">
                            <h2>Monthly Payment Reminder</h2>
                          </td>
                        </tr>
                        <tr>
                          <td class="wrapper">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td>
                                  <p>Your monthly installment payment of <strong>${amount}</strong> is currently <strong>overdue</strong>. If payment is not made within one month, a penalty will be applied. Additional charge will be added for every month the payment remains unsettled. We strongly encourage you to settle your balance as soon as possible to avoid accumulating further charges.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="separator" />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="details">
                              <p>Project: <strong>${project}</strong><br/>Phase: <strong>${phase}</strong><br />Block: <strong>${block}</strong><br />Lot: <strong>${lot}</strong><br />Amount to Pay: <strong>${amount}</strong></p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="note">
                              <p>If you have already settled your payment and received this message, you can safely ignore it.</p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="note">
                              <p>Note: <strong>Late payments will incur a penalty fee, which will be added to your monthly payment.</strong></p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                  <td>&nbsp;</td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      if (error) {
        this.exceptionService.throw(
          `Failed to send email ${error?.message}`,
          "BAD_REQUEST",
        );
        return;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async onSendPaymentReminderOverDueDateMonthPast({
    email,
    amount,
    penalty,
    monthsPassed,
    project,
    phase,
    block,
    lot,
  }: Omit<PaymentReminderProps, "dueDate">) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `RMD Land Support <${config.email_from}${config.domain}>`,
        to: email,
        subject: "Monthly Payment Reminder - RMD Land",
        replyTo: `${config.email_reply_to}`,
        html: `
          <!doctype html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width" />
              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
              <style>
                body {
                  background-color: #eaebed;
                  font-family: sans-serif;
                  -webkit-font-smoothing: antialiased;
                  font-size: 14px;
                  line-height: 1.4;
                  margin: 0;
                  padding: 0;
                  -ms-text-size-adjust: 100%;
                  -webkit-text-size-adjust: 100%; 
                }
                table {
                  border-collapse: separate;
                  mso-table-lspace: 0pt;
                  mso-table-rspace: 0pt;
                  min-width: 100%;
                  width: 100%; 
                }
                table td {
                    font-family: sans-serif;
                    font-size: 20px;
                    vertical-align: top; 
                }
                .align-center {
                  text-align: center;
                }
                .body {
                  width: 100%;
                }
                .container {
                  max-width: 580px;
                  width: 580px;
                }
                .content {
                  margin-top: 20px;
                  background-color: white;
                  border-radius: 5px;
                  padding: 20px;
                }
                .details p{
                  padding: 0;
                }
                .separator {
                  border: 1px dashed black;
                  width: 100%;
                }
                .note p {
                  font-size: 14px;
                }
                .note p strong {
                  color: red;
                }
              </style>
            </head>
            <body class="">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
                <tr>
                  <td>&nbsp;</td>
                  <td class="container">
                    <div class="content">
                      <table role="presentation" border="0" class="main" cellpadding="0" cellspacing="0">
                        <tr>
                          <td class="align-center" width="100%">
                            <a href="https://postdrop.io"><img src="https://cdn.postdrop.io/starter-templates-v0/postdrop-logo-dark.png" height="40" alt="rmdland"></a>
                          </td>
                        </tr>
                        <tr>
                          <td class="align-center" width="100%">
                            <h2>Monthly Payment Reminder</h2>
                          </td>
                        </tr>
                        <tr>
                          <td class="wrapper">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                              <tr>
                                <td>
                                  <p>Your monthly installment payment has been overdue for over <strong>${monthsPassed} month(s)</strong>. A penalty of <strong>${penalty}</strong> has been applied, bringing your total due to <strong>${amount}</strong>. We strongly encourage you to settle this as soon as possible to prevent further charges.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="separator" />
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="details">
                              <p>Project: <strong>${project}</strong><br/>Phase: <strong>${phase}</strong><br />Block: <strong>${block}</strong><br />Lot: <strong>${lot}</strong><br />Amount to Pay: <strong>${amount}</strong></p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="note">
                              <p>If you have already settled your payment and received this message, you can safely ignore it.</p>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <div class="note">
                              <p>Note: <strong>Late payments will incur a penalty fee, which will be added to your monthly payment.</strong></p>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                  <td>&nbsp;</td>
                </tr>
              </table>
            </body>
          </html>
        `,
      });

      if (error) {
        this.exceptionService.throw(
          `Failed to send email ${error?.message}`,
          "BAD_REQUEST",
        );
        return;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async onSendUserCredentials(
    name: string,
    email: string,
    username: string,
    password: string,
    role: ROLE,
  ) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: `RMD Land Support <${config.email_from}${config.domain}>`,
        to: email,
        subject: `${role} Credentials - RMD Land`,
        replyTo: `${config.email_reply_to}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            </style>
          </head>
          <body>
            <p>Welcome to RMD Land <strong>${name}</strong>,</p>
            <p>Your credentials are as follows:</p>
            <p>Username: <strong>${username}</strong></p>
            <p>Password: <strong>${password}</strong></p>
            <p>Please use these credentials to login to your account.</p>
          </body>
          </html>
        `,
      });

      if (error) {
        this.exceptionService.throw(
          `Failed to send email ${error?.message}`,
          "BAD_REQUEST",
        );
        return;
      }
    } catch (error) {
      throw error;
    }
  }
}
