from pydantic import BaseModel, Field

class AdminUsers(BaseModel):

    username: str = Field(..., pattern=r'^.+@.+$', max_length=40)
    password: str = Field(..., min_length=8)

class VerifyOtp(BaseModel):

    username: str = Field(..., pattern=r'^.+@.+$', max_length=40)
    otp: str = Field(..., max_length=6)