from passlib.context import CryptContext

context = CryptContext(schemes='bcrypt')

def hash_pass(password):
    return context.hash(password)

def verify_pass(plain_pass, hashed_pass):
    return context.verify(plain_pass, hashed_pass)

print(verify_pass('landlord123', '$2b$12$2LJr67LKvQRYvJdnZqJiL.GPsoyC6fo47Ur6rm83OWvgvcl2AJ9om'))