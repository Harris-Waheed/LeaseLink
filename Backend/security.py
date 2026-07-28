from passlib.context import CryptContext

context = CryptContext(schemes='bcrypt')

def hash_pass(password):
    return context.hash(password)

def verify_pass(plain_pass, hashed_pass):
    return context.verify(plain_pass, hashed_pass)
