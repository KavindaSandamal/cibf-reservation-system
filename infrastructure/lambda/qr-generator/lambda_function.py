import json
import boto3
import qrcode
from io import BytesIO
from datetime import datetime

# Initialize AWS clients
s3_client = boto3.client('s3')

# Configuration
S3_BUCKET = 'cibf-qr-codes-2025'
S3_FOLDER = 'qr-codes'

def lambda_handler(event, context):
    """
    Lambda function to generate QR codes
    Triggered by SNS when reservation is confirmed
    """
    print(f"Received event: {json.dumps(event)}")
    
    try:
        for record in event['Records']:
            # Get message from SNS
            sns_message = json.loads(record['Sns']['Message'])
            
            # Extract data
            reservation_id = sns_message.get('reservationId')
            user_email = sns_message.get('userEmail')
            business_name = sns_message.get('businessName')
            
            print(f"Generating QR code for reservation: {reservation_id}")
            
            # Generate QR code data
            qr_data = json.dumps({
                'reservationId': reservation_id,
                'userEmail': user_email,
                'businessName': business_name,
                'eventName': 'CIBF 2025',
                'generatedAt': datetime.now().isoformat()
            })
            
            # Create QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_H,
                box_size=10,
                border=4,
            )
            qr.add_data(qr_data)
            qr.make(fit=True)
            
            # Generate image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Save to BytesIO
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            # Upload to S3
            file_key = f"{S3_FOLDER}/{reservation_id}.png"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=file_key,
                Body=buffer,
                ContentType='image/png',
                ACL='public-read',
                CacheControl='max-age=31536000'  # Cache for 1 year
            )
            
            # Generate public URL
            qr_url = f"https://{S3_BUCKET}.s3.us-west-2.amazonaws.com/{file_key}"
            
            print(f"✅ QR code generated: {qr_url}")
            
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'QR code generated successfully',
                'qrCodeUrl': qr_url
            })
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }