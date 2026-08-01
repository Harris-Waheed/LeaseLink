from pydantic import BaseModel, Field, EmailStr, HttpUrl
from decimal import Decimal
from datetime import date

class EditTenant(BaseModel):
    tnt_name: str = Field(..., max_length=50)
    tnt_email: EmailStr = Field(...)
    tnt_number: str = Field(..., max_length=20)
    tnt_national_id: str = Field(..., max_length=50)
    rent_amount: Decimal = Field(..., gt=0, max_digits=10, decimal_places=2)


class NewTenant(EditTenant):
    tnt_unit_assign: str = Field(...)
    prop_id: int = Field(...)
    lease_start: date = Field()
    lease_end: date = Field()

class GetTenant(NewTenant):
    tnt_id: int = Field(...)
    joined_at: date = Field(...)
    prop_name: str = Field(...)
