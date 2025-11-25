package com.cibf.service;

import com.cibf.entity.Reservation;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmailTemplateService {

    /**
     * Generate HTML email for confirmed reservation with QR code
     */
    public String generateConfirmationEmailWithQR(Reservation reservation, String qrCodeUrl, List<Long> stallIds) {
        String businessName = reservation.getBusinessName() != null ? reservation.getBusinessName() : "Valued Customer";
        String stallIdsStr = stallIds != null && !stallIds.isEmpty()
                ? stallIds.stream().map(String::valueOf).collect(Collectors.joining(", "))
                : "N/A";

        return String.format(
                """
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Reservation Confirmed</title>
                        </head>
                        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
                            <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f7fa; padding: 40px 20px;">
                                <tr>
                                    <td align="center">
                                        <!-- Main Container -->
                                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                                            <!-- Header -->
                                            <tr>
                                                <td style="background-color: #667eea; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 40px 30px; text-align: center;">
                                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                                        🎉 Reservation Confirmed!
                                                    </h1>
                                                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">
                                                        Your spot is secured
                                                    </p>
                                                </td>
                                            </tr>

                                            <!-- Content -->
                                            <tr>
                                                <td style="padding: 40px 30px;">
                                                    <p style="margin: 0 0 24px 0; color: #2d3748; font-size: 16px; line-height: 1.6;">
                                                        Dear <strong>%s</strong>,
                                                    </p>

                                                    <p style="margin: 0 0 32px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                                                        Great news! Your reservation has been successfully confirmed. Here are your details:
                                                    </p>

                                                    <!-- Reservation Details Card -->
                                                    <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7fafc; border-radius: 12px; border-left: 4px solid #667eea; margin-bottom: 32px;">
                                                        <tr>
                                                            <td style="padding: 24px;">
                                                                <h2 style="margin: 0 0 16px 0; color: #2d3748; font-size: 18px; font-weight: 600;">
                                                                    📋 Reservation Details
                                                                </h2>

                                                                <table width="100%%" cellpadding="8" cellspacing="0" border="0">
                                                                    <tr>
                                                                        <td style="color: #718096; font-size: 14px; padding: 8px 0;">Reservation ID:</td>
                                                                        <td style="color: #2d3748; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">#%d</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="color: #718096; font-size: 14px; padding: 8px 0;">Business Name:</td>
                                                                        <td style="color: #2d3748; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">%s</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="color: #718096; font-size: 14px; padding: 8px 0;">Stall IDs:</td>
                                                                        <td style="color: #2d3748; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">%s</td>
                                                                    </tr>
                                                                    <tr style="border-top: 1px solid #e2e8f0;">
                                                                        <td style="color: #718096; font-size: 14px; padding: 12px 0 8px 0;">Total Amount:</td>
                                                                        <td style="color: #667eea; font-size: 20px; font-weight: 700; text-align: right; padding: 12px 0 8px 0;">$%.2f</td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <!-- QR Code Section with Image -->
                                                    <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #667eea; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); border-radius: 12px; margin-bottom: 24px;">
                                                        <tr>
                                                            <td align="center" style="padding: 32px 24px;">
                                                                <h3 style="margin: 0 0 16px 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                                                                    📱 Your Entry QR Code
                                                                </h3>

                                                                <!-- QR Code Image -->
                                                                <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; display: inline-block; margin-bottom: 20px;">
                                                                    <img src="%s" alt="Reservation QR Code" width="240" height="240" style="display: block; max-width: 240px; border-radius: 8px;" />
                                                                </div>

                                                                <p style="margin: 0 0 20px 0; color: #ffffff; font-size: 14px; line-height: 1.5;">
                                                                    Present this QR code at the venue entrance
                                                                </p>

                                                                <!-- Download Button -->
                                                                <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                                                    <tr>
                                                                        <td align="center" style="border-radius: 8px; background-color: #ffffff;">
                                                                            <a href="%s" download="reservation-%d-qrcode.png" style="display: inline-block; padding: 14px 32px; color: #667eea; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px;">
                                                                                ⬇️ Download QR Code
                                                                            </a>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <!-- Quick Actions -->
                                                    <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                                                        <tr>
                                                            <td align="center">
                                                                <table cellpadding="0" cellspacing="0" border="0">
                                                                    <tr>
                                                                        <td style="padding: 0 8px;">
                                                                            <a href="%s" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #667eea; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 13px; border-radius: 8px; border: 2px solid #667eea;">
                                                                                🔗 View QR Code
                                                                            </a>
                                                                        </td>
                                                                        <td style="padding: 0 8px;">
                                                                            <a href="%s" download="reservation-%d-qrcode.png" style="display: inline-block; padding: 12px 24px; background-color: transparent; color: #667eea; text-decoration: none; font-weight: 600; font-size: 13px; border-radius: 8px; border: 2px solid #667eea;">
                                                                                💾 Save QR Code
                                                                            </a>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <!-- Important Notice -->
                                                    <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fcd34d;">
                                                        <tr>
                                                            <td style="padding: 16px 20px;">
                                                                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                                                                    💡 <strong>Tip:</strong> Download the QR code to your device for quick access at the event, even without internet connection.
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>

                                            <!-- Footer -->
                                            <tr>
                                                <td style="background-color: #f7fafc; padding: 32px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                                    <p style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px;">
                                                        Thank you for choosing CIBF!
                                                    </p>
                                                    <p style="margin: 0 0 16px 0; color: #718096; font-size: 13px;">
                                                        Questions? Contact us at info.cibf@gmail.com
                                                    </p>
                                                    <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                                        © 2024 CIBF Reservation System. All rights reserved.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>
                        """,
                businessName, 
                reservation.getId(),
                businessName,
                stallIdsStr, 
                reservation.getTotalAmount(), 
                qrCodeUrl, 
                qrCodeUrl, 
                reservation.getId(), 
                qrCodeUrl, 
                qrCodeUrl, 
                reservation.getId() 
        );
    }

    /**
     * Generate HTML email for confirmed reservation without QR code (fallback)
     */
    public String generateConfirmationEmailWithoutQR(Reservation reservation, List<Long> stallIds) {
        String businessName = reservation.getBusinessName() != null ? reservation.getBusinessName() : "Valued Customer";
        String stallIdsStr = stallIds != null && !stallIds.isEmpty()
                ? stallIds.stream().map(String::valueOf).collect(Collectors.joining(", "))
                : "N/A";

        return String.format(
                """
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Reservation Confirmed</title>
                        </head>
                        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
                            <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f7fa; padding: 40px 20px;">
                                <tr>
                                    <td align="center">
                                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                                            <!-- Header -->
                                            <tr>
                                                <td style="background-color: #667eea; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 40px 30px; text-align: center;">
                                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                                        🎉 Reservation Confirmed!
                                                    </h1>
                                                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">
                                                        Your spot is secured
                                                    </p>
                                                </td>
                                            </tr>

                                            <!-- Content -->
                                            <tr>
                                                <td style="padding: 40px 30px;">
                                                    <p style="margin: 0 0 24px 0; color: #2d3748; font-size: 16px; line-height: 1.6;">
                                                        Dear <strong>%s</strong>,
                                                    </p>

                                                    <p style="margin: 0 0 32px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                                                        Great news! Your reservation has been successfully confirmed. Here are your details:
                                                    </p>

                                                    <!-- Reservation Details Card -->
                                                    <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7fafc; border-radius: 12px; border-left: 4px solid #667eea; margin-bottom: 32px;">
                                                        <tr>
                                                            <td style="padding: 24px;">
                                                                <h2 style="margin: 0 0 16px 0; color: #2d3748; font-size: 18px; font-weight: 600;">
                                                                    📋 Reservation Details
                                                                </h2>

                                                                <table width="100%%" cellpadding="8" cellspacing="0" border="0">
                                                                    <tr>
                                                                        <td style="color: #718096; font-size: 14px; padding: 8px 0;">Reservation ID:</td>
                                                                        <td style="color: #2d3748; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">#%d</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="color: #718096; font-size: 14px; padding: 8px 0;">Business Name:</td>
                                                                        <td style="color: #2d3748; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">%s</td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="color: #718096; font-size: 14px; padding: 8px 0;">Stall IDs:</td>
                                                                        <td style="color: #2d3748; font-size: 14px; font-weight: 600; text-align: right; padding: 8px 0;">%s</td>
                                                                    </tr>
                                                                    <tr style="border-top: 1px solid #e2e8f0;">
                                                                        <td style="color: #718096; font-size: 14px; padding: 12px 0 8px 0;">Total Amount:</td>
                                                                        <td style="color: #667eea; font-size: 20px; font-weight: 700; text-align: right; padding: 12px 0 8px 0;">$%.2f</td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <!-- QR Code Processing Notice -->
                                                    <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 8px; border: 1px solid #fbbf24;">
                                                        <tr>
                                                            <td style="padding: 20px;">
                                                                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 15px; font-weight: 600;">
                                                                    ⏳ QR Code Being Generated
                                                                </p>
                                                                <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5;">
                                                                    Your entry QR code is currently being generated and will be sent to you in a separate email shortly.
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>

                                            <!-- Footer -->
                                            <tr>
                                                <td style="background-color: #f7fafc; padding: 32px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                                    <p style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px;">
                                                        Thank you for choosing CIBF!
                                                    </p>
                                                    <p style="margin: 0 0 16px 0; color: #718096; font-size: 13px;">
                                                        Questions? Contact us at info.cibf@gmail.com
                                                    </p>
                                                    <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                                        © 2024 CIBF Reservation System. All rights reserved.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>
                        """,
                businessName,
                reservation.getId(),
                businessName,
                stallIdsStr,
                reservation.getTotalAmount());
    }

    /**
     * Generate HTML email for cancelled reservation
     */
    public String generateCancellationEmail(Reservation reservation) {
        String businessName = reservation.getBusinessName() != null ? reservation.getBusinessName() : "Valued Customer";

        return String.format(
                """
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Reservation Cancelled</title>
                        </head>
                        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
                            <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f7fa; padding: 40px 20px;">
                                <tr>
                                    <td align="center">
                                        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                                            <!-- Header -->
                                            <tr>
                                                <td style="background-color: #ef4444; background: linear-gradient(135deg, #ef4444 0%%, #dc2626 100%%); padding: 40px 30px; text-align: center;">
                                                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                                                        ❌ Reservation Cancelled
                                                    </h1>
                                                    <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px;">
                                                        Reservation #%d
                                                    </p>
                                                </td>
                                            </tr>

                                            <!-- Content -->
                                            <tr>
                                                <td style="padding: 40px 30px;">
                                                    <p style="margin: 0 0 24px 0; color: #2d3748; font-size: 16px; line-height: 1.6;">
                                                        Dear <strong>%s</strong>,
                                                    </p>

                                                    <p style="margin: 0 0 32px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                                                        This is to confirm that your reservation has been cancelled.
                                                    </p>

                                                    <!-- Cancellation Notice -->
                                                    <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fee2e2; border-radius: 8px; border-left: 4px solid #ef4444; margin-bottom: 32px;">
                                                        <tr>
                                                            <td style="padding: 20px;">
                                                                <p style="margin: 0 0 12px 0; color: #991b1b; font-size: 15px; font-weight: 600;">
                                                                    Cancellation Details
                                                                </p>
                                                                <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 1.5;">
                                                                    <strong>Reservation ID:</strong> #%d<br>
                                                                    <strong>Business Name:</strong> %s
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>

                                                    <!-- Important Notice -->
                                                    <table width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fcd34d;">
                                                        <tr>
                                                            <td style="padding: 16px 20px;">
                                                                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;">
                                                                    ⚠️ If you did not request this cancellation, please contact our support team immediately at info.cibf@gmail.com
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>

                                            <!-- Footer -->
                                            <tr>
                                                <td style="background-color: #f7fafc; padding: 32px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                                    <p style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px;">
                                                        CIBF Reservation System
                                                    </p>
                                                    <p style="margin: 0 0 16px 0; color: #718096; font-size: 13px;">
                                                        Need help? Contact us at info.cibf@gmail.com
                                                    </p>
                                                    <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                                                        © 2024 CIBF Reservation System. All rights reserved.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </body>
                        </html>
                        """,
                reservation.getId(),
                businessName,
                reservation.getId(),
                businessName);
    }
}