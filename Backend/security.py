import os
from dotenv import load_dotenv
from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

load_dotenv()

SECRET_KEY = os.getenv('MY_SECRET_KEY')
ALGORITHM = os.getenv('ALGORITHM')
TOKEN_TIME = 30

context = CryptContext(schemes='bcrypt')

def hash_pass(password):
    return context.hash(password)

def verify_pass(plain_pass, hashed_pass):
    return context.verify(plain_pass, hashed_pass)

def create_access_token(data: dict):

    to_encode = data.copy()

    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=TOKEN_TIME)
    to_encode.update({'exp': expire})

    generate_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return generate_jwt
