package com.cibf.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class QRCodeService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.qr-folder}")
    private String qrFolder;

    @Value("${aws.region}")
    private String awsRegion;

    /**
     * Generate QR code, upload to S3, and return public URL
     */
    public String generateAndUploadQRCode(Long reservationId, String businessName, String userEmail) {
        try {
            log.info("Generating QR code for reservation: {}", reservationId);

            // 1. Generate QR code data (JSON format)
            String qrData = buildQRData(reservationId, businessName, userEmail);

            // 2. Create QR code image
            byte[] qrImageBytes = generateQRCodeImage(qrData);

            // 3. Upload to S3
            String s3Key = String.format("%s/reservation-%d.png", qrFolder, reservationId);
            uploadToS3(s3Key, qrImageBytes);

            // 4. Generate public URL
            String publicUrl = String.format(
                    "https://%s.s3.%s.amazonaws.com/%s",
                    bucketName,
                    awsRegion,
                    s3Key);

            log.info("✅ QR code uploaded successfully: {}", publicUrl);
            return publicUrl;

        } catch (Exception e) {
            log.error("❌ Failed to generate/upload QR code for reservation: {}", reservationId, e);
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    /**
     * Build QR code data in JSON format
     */
    private String buildQRData(Long reservationId, String businessName, String userEmail) {
        return String.format("""
                {
                    "type": "CIBF_RESERVATION",
                    "reservationId": "%d",
                    "businessName": "%s",
                    "email": "%s",
                    "event": "Colombo International Bookfair 2024",
                    "venue": "BMICH, Colombo 07",
                    "generatedAt": "%s"
                }
                """,
                reservationId,
                businessName.replace("\"", "\\\""),
                userEmail,
                java.time.LocalDateTime.now().toString());
    }

    /**
     * Generate QR code image as byte array
     */
    private byte[] generateQRCodeImage(String data) throws WriterException, IOException {
        int width = 400;
        int height = 400;

        // QR code configuration
        Map hints = new HashMap<>();
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);

        // Generate QR code
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, width, height, hints);

        // Convert to image
        BufferedImage bufferedImage = MatrixToImageWriter.toBufferedImage(bitMatrix);

        // Convert to byte array
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(bufferedImage, "PNG", baos);

        return baos.toByteArray();
    }

    /**
     * Upload QR code image to S3
     */
    private void uploadToS3(String key, byte[] imageBytes) {
        PutObjectRequest putRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType("image/png")
                // .acl(ObjectCannedACL.PUBLIC_READ)
                .cacheControl("max-age=31536000") // Cache for 1 year
                .build();

        s3Client.putObject(putRequest, RequestBody.fromBytes(imageBytes));

        log.info("QR code uploaded to S3: {}/{}", bucketName, key);
    }

    public String generateQrCodeUrl(Long reservationId, String confirmationCode) {
        try {
            // Generate QR code content (here we just include reservationId + confirmation
            // code)
            String qrData = String.format("Reservation-%d-Confirmation-%s", reservationId, confirmationCode);

            // Generate QR image bytes
            byte[] qrImageBytes = generateQRCodeImage(qrData);

            // Upload to S3
            String s3Key = String.format("%s/reservation-%d.png", qrFolder, reservationId);
            uploadToS3(s3Key, qrImageBytes);

            // Return public URL
            return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, awsRegion, s3Key);
        } catch (Exception e) {
            log.error("Failed to generate QR code for reservation {}", reservationId, e);
            throw new RuntimeException(e);
        }
    }

}