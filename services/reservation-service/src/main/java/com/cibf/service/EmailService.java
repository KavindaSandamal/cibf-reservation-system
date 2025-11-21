package com.cibf.service;

import com.cibf.dto.ReservationConfirmationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.from-name}")
    private String fromName;

    @Value("${app.name}")
    private String appName;

    @Value("${app.venue}")
    private String venue;

    @Value("${app.organizer}")
    private String organizer;

    /**
     * Send reservation confirmation email with QR code
     */
    @Async
    public void sendReservationConfirmation(ReservationConfirmationDto dto) {
        try {
            log.info("📧 Sending confirmation email to: {}", dto.getUserEmail());

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(dto.getUserEmail());
            helper.setSubject(String.format("%s - Reservation Confirmed #%d",
                    appName, dto.getReservationId()));

            String htmlContent = buildEmailHtml(dto);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            log.info("✅ Confirmation email sent successfully to: {}", dto.getUserEmail());
        } catch (MessagingException e) {
            log.error("❌ Failed to send email to: {}", dto.getUserEmail(), e);
        } catch (Exception e) {
            log.error("❌ Unexpected error sending email", e);
        }
    }

    public void sendSimpleEmail(String to, String subject, String content) {
        try {
            log.info("Sending simple email to: {}", to);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, false); // false = plain text

            mailSender.send(message);

            log.info("✅ Simple email sent successfully to: {}", to);

        } catch (Exception e) {
            log.error("❌ Failed to send simple email to: {}", to, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Build HTML email with embedded QR code
     */
    private String buildEmailHtml(ReservationConfirmationDto dto) {
        StringBuilder stallsHtml = new StringBuilder();

        for (ReservationConfirmationDto.StallInfo stall : dto.getStalls()) {
            stallsHtml.append(String.format("""
                    <tr>
                        <td>%s</td>
                        <td>%s</td>
                        <td>%s</td>
                        <td>Rs. %,.2f</td>
                    </tr>
                    """,
                    stall.getStallName(),
                    stall.getSize(),
                    stall.getDimension(),
                    stall.getPrice()));
        }

        String currentDate = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));

        return String.format("""
                <html>
                <body style="font-family: Arial, sans-serif; background: #f6f6f6; padding: 20px;">

                    <div style="max-width: 650px; margin: auto; background: #ffffff;
                                border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

                        <h2 style="color: #28a745; text-align: center;">✅ Reservation Confirmed!</h2>
                        <h3 style="text-align: center;">%s</h3>

                        <p>Dear %s,</p>
                        <p>
                            Thank you for reserving your stall at the <strong>%s</strong>!
                            Your reservation has been confirmed successfully.
                        </p>

                        <h3>Reservation Details</h3>
                        <p><strong>Reservation ID:</strong> #%d</p>
                        <p><strong>Date:</strong> %s</p>
                        <p><strong>Email:</strong> %s</p>

                        <h3>Reserved Stalls</h3>
                        <table width="100%%" border="1" cellspacing="0" cellpadding="8"
                               style="border-collapse: collapse;">
                            <tr style="background: #f2f2f2;">
                                <th>Stall</th>
                                <th>Size</th>
                                <th>Dimension</th>
                                <th>Price</th>
                            </tr>
                            %s
                            <tr style="background: #fafafa;">
                                <td colspan="3" style="text-align: right;"><strong>Total Amount:</strong></td>
                                <td><strong>Rs. %,.2f</strong></td>
                            </tr>
                        </table>

                        <h3>🎫 Your Entry Pass QR Code</h3>
                        <div style="text-align: center;">
                            <img src="%s" alt="QR Code" width="200"/><br/><br/>
                            <a href="%s"
                               style="background: #007bff; color: white; padding: 10px 15px;
                                      text-decoration: none; border-radius: 5px;">
                                📥 Download QR Code
                            </a>
                        </div>

                        <h3>📌 Important Information</h3>
                        <ul>
                            <li>Exhibition dates: December 15–25, 2025</li>
                            <li>Setup time: December 14, 2025 (9:00 AM – 5:00 PM)</li>
                            <li>Venue: %s</li>
                            <li>Please bring your QR code (printed or on phone) for entry</li>
                            <li>Maximum 3 stalls per business</li>
                        </ul>

                        <p>
                            If you have any questions, please contact us at
                            <a href="mailto:info.cibf@gmail.com">info.cibf@gmail.com</a>
                            or call <strong>+94 11 234 5678</strong>.
                        </p>

                        <hr/>
                        <p style="text-align: center; font-size: 13px; color: #777;">
                            %s<br/>
                            %s<br/>
                            %s
                        </p>
                    </div>

                </body>
                </html>
                """,
                appName,
                dto.getBusinessName(),
                appName,
                dto.getReservationId(),
                currentDate,
                dto.getUserEmail(),
                stallsHtml,
                dto.getTotalAmount(),
                dto.getQrCodeUrl(),
                dto.getQrCodeUrl(),
                venue,
                appName,
                organizer,
                venue);
    }
}
