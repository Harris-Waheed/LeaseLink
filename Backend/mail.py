from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import SecretStr
from dotenv import load_dotenv
import secrets
import os

load_dotenv()

MAIL_USERNAME = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
MAIL_FROM = os.getenv('MAIL_FROM')
MAIL_PORT = os.getenv('MAIL_PORT')
MAIL_SERVER = os.getenv('MAIL_SERVER')

conf = ConnectionConfig(MAIL_USERNAME=MAIL_USERNAME, MAIL_PASSWORD=SecretStr(MAIL_PASSWORD),
                        MAIL_FROM=MAIL_FROM, MAIL_PORT=int(MAIL_PORT), MAIL_SERVER=MAIL_SERVER,
                        MAIL_STARTTLS=False, MAIL_SSL_TLS=True, USE_CREDENTIALS=True, VALIDATE_CERTS=True)
fm = FastMail(conf)

async def send_mail(recipient):

    otp = secrets.randbelow(900000)+100000

    message = MessageSchema(
        subject='Your Verification Code',
        recipients=[recipient],
        body=f"Your verification code is: {otp}. It will expire in 10 minutes.",
        subtype=MessageType.plain
    )

    await fm.send_message(message)

    return otp