from fastapi import Form, File, UploadFile
from pydantic import BaseModel
from datetime import date
from decimal import Decimal


class NewLease:
    def __init__(
        self,
        tenant_id: int = Form(...),
        prop_id: int = Form(...),
        unit_assign: str = Form(..., max_length=50),
        lease_start: date = Form(...),
        lease_end: date = Form(...),
        rent_amount: Decimal = Form(...),
        lease_doc: UploadFile = File(default=None),
    ):
        self.tenant_id = tenant_id
        self.prop_id = prop_id
        self.unit_assign = unit_assign
        self.lease_start = lease_start
        self.lease_end = lease_end
        self.rent_amount = rent_amount
        self.lease_doc = lease_doc


class GetLease(BaseModel):
    lease_id: int
    tenant_id: int
    tenant_name: str
    national_id: str
    tenant_image: str
    prop_id: int
    prop_name: str
    unit_assign: str
    lease_start: date
    lease_end: date
    rent_amount: Decimal
    lease_doc_url: str
    lease_status: str
    created_at: date


class EditLease:
    def __init__(
        self,
        unit_assign: str = Form(..., max_length=50),
        lease_start: date = Form(...),
        lease_end: date = Form(...),
        rent_amount: Decimal = Form(...),
        lease_doc: UploadFile = File(...),
    ):
        self.unit_assign = unit_assign
        self.lease_start = lease_start
        self.lease_end = lease_end
        self.rent_amount = rent_amount
        self.lease_doc = lease_doc
