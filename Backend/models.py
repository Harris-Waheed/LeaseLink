from pydantic import BaseModel, Field, EmailStr

class UsernameCheck(BaseModel):
    username: EmailStr = Field(..., max_length=40)

class Users(UsernameCheck):
    password: str = Field(..., min_length=8)

class ForgetPassword(UsernameCheck):
    pass

class VerifyOtp(UsernameCheck):
    otp: str = Field(..., max_length=6)