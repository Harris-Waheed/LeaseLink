from pydantic import BaseModel, Field, EmailStr
from fastapi import File, UploadFile, Form
from datetime import date

class NewTenant:
    def __init__(
        self,
        tnt_name: str = Form(..., max_length=50),
        tnt_email: EmailStr = Form(...),
        tnt_number: str = Form(..., max_length=20),
        tnt_national_id: str = Form(..., max_length=50),
        tenant_image: UploadFile = File(...)
    ):
        self.tnt_name = tnt_name
        self.tnt_email = tnt_email
        self.tnt_number = tnt_number
        self.tnt_national_id = tnt_national_id
        self.tenant_image = tenant_image

class EditTenant:
    def __init__(
        self,
        tnt_name: str = Form(..., max_length=50),
        tnt_email: EmailStr = Form(...),
        tnt_number: str = Form(..., max_length=20),
        tnt_national_id: str = Form(..., max_length=50),
        tenant_image: UploadFile | None = File(default=None)
    ):
        self.tnt_name = tnt_name
        self.tnt_email = tnt_email
        self.tnt_number = tnt_number
        self.tnt_national_id = tnt_national_id
        self.tenant_image = tenant_image

class GetTenant(BaseModel):
    tnt_id: int = Field(...)
    tnt_name: str = Field(...)
    tnt_email: EmailStr = Field(...)
    tnt_number: str = Field(...)
    tnt_national_id: str = Field(...)
    tenant_image: str | None = Field(...)
    status: str = Field(...)
    joined_at: date = Field(...)