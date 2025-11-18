import json
import boto3
from botocore.exceptions import ClientError
from datetime import datetime

# Initialize AWS clients
ses_client = boto3.client('ses', region_name='us-west-2')

# Configuration
SENDER_EMAIL = 'info.cibf@gmail.com'  # MUST be verified in SES
SENDER_NAME = 'CIBF Reservation System'

def lambda_handler(event, context):
    """
    Lambda function to send reservation confirmation emails
    Triggered by SNS when reservation is confirmed
    """
    print(f"Received event: {json.dumps(event)}")
    
    try:
        # Parse SNS message
        for record in event['Records']:
            # Get message from SNS
            sns_message = json.loads(record['Sns']['Message'])
            
            # Extract reservation details
            user_email = sns_message.get('userEmail')
            business_name = sns_message.get('businessName')
            reservation_id = sns_message.get('reservationId')
            stalls = sns_message.get('stalls', [])
            total_amount = sns_message.get('totalAmount', 0)
            qr_code_url = sns_message.get('qrCodeUrl', '')
            
            print(f"Processing email for: {user_email}")
            
            # Build email HTML
            email_html = build_email_html(
                business_name=business_name,
                reservation_id=reservation_id,
                stalls=stalls,
                total_amount=total_amount,
                qr_code_url=qr_code_url
            )
            
            # Send email via SES
            response = ses_client.send_email(
                Source=f'{SENDER_NAME} <{SENDER_EMAIL}>',
                Destination={
                    'ToAddresses': [user_email]
                },
                Message={
                    'Subject': {
                        'Data': f'CIBF 2025 - Reservation Confirmed #{reservation_id}',
                        'Charset': 'UTF-8'
                    },
                    'Body': {
                        'Html': {
                            'Data': email_html,
                            'Charset': 'UTF-8'
                        }
                    }
                }
            )
            
            message_id = response['MessageId']
            print(f"✅ Email sent successfully! MessageId: {message_id}")
            
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Email sent successfully',
                'messageId': message_id
            })
        }
        
    except ClientError as e:
        error_message = e.response['Error']['Message']
        print(f"❌ SES Error: {error_message}")
        
        # Don't throw exception - return success to prevent retry
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to send email',
                'details': error_message
            })
        }
        
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Unexpected error',
                'details': str(e)
            })
        }


def build_email_html(business_name, reservation_id, stalls, total_amount, qr_code_url):
    """Build beautiful HTML email template"""
    
    # Build stalls table HTML
    stalls_html = ""
    for stall in stalls:
        stalls_html += f"""
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{stall.get('stallName', 'N/A')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{stall.get('size', 'N/A')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">{stall.get('dimensions', 'N/A')}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">Rs. {stall.get('price', 0):,.2f}</td>
        </tr>
        """
    
    # Full email HTML
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                    ✅ Reservation Confirmed!
                                </h1>
                                <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                                    Colombo International Bookfair 2024
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">
                                    Dear {business_name},
                                </h2>
                                
                                <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                    Thank you for reserving your stall at the Colombo International Bookfair 2024! 
                                    Your reservation has been confirmed successfully.
                                </p>
                                
                                <!-- Reservation Details -->
                                <div style="background-color: #f9fafb; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
                                    <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">
                                        Reservation Details
                                    </h3>
                                    <p style="margin: 5px 0; color: #4b5563;">
                                        <strong>Reservation ID:</strong> #{reservation_id}
                                    </p>
                                    <p style="margin: 5px 0; color: #4b5563;">
                                        <strong>Date:</strong> {datetime.now().strftime('%B %d, %Y')}
                                    </p>
                                </div>
                                
                                <!-- Reserved Stalls -->
                                <h3 style="margin: 30px 0 15px 0; color: #1f2937; font-size: 18px;">
                                    Reserved Stalls
                                </h3>
                                <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                                    <thead>
                                        <tr style="background-color: #f9fafb;">
                                            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Stall</th>
                                            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Size</th>
                                            <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Dimensions</th>
                                            <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stalls_html}
                                        <tr style="background-color: #f9fafb; font-weight: bold;">
                                            <td colspan="3" style="padding: 15px; text-align: right; color: #1f2937;">Total Amount:</td>
                                            <td style="padding: 15px; text-align: right; color: #3b82f6; font-size: 18px;">Rs. {total_amount:,.2f}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                
                                <!-- QR Code -->
                                <div style="text-align: center; margin: 40px 0;">
                                    <h3 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px;">
                                        Your Entry Pass QR Code
                                    </h3>
                                    <div style="background-color: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; display: inline-block;">
                                        <img src="{qr_code_url}" alt="QR Code" width="250" height="250" style="display: block;">
                                    </div>
                                    <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px;">
                                        Please save this QR code and present it at the exhibition entrance
                                    </p>
                                </div>
                                
                                <!-- Important Information -->
                                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0;">
                                    <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">
                                        📌 Important Information
                                    </h4>
                                    <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                                        <li style="margin: 5px 0;">Exhibition dates: March 15-25, 2024</li>
                                        <li style="margin: 5px 0;">Setup time: March 14, 2024 (9:00 AM - 5:00 PM)</li>
                                        <li style="margin: 5px 0;">Venue: BMICH, Colombo 07</li>
                                        <li style="margin: 5px 0;">Please bring this QR code for entry</li>
                                    </ul>
                                </div>
                                
                                <p style="margin: 30px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                    If you have any questions, please contact us at 
                                    <a href="mailto:support@cibf.lk" style="color: #3b82f6; text-decoration: none;">support@cibf.lk</a>
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                    <strong>Colombo International Bookfair 2024</strong>
                                </p>
                                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                    Sri Lanka Book Publishers' Association<br>
                                    BMICH, Colombo 07, Sri Lanka
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    return html