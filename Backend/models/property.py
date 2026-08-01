from pydantic import BaseModel, Field, HttpUrl
from typing import Literal
from fastapi import UploadFile, File, Form


class NewProperty:
    def __init__(
        self,
        prop_name: str = Form(..., max_length=50),
        prop_loc: str = Form(..., max_length=100),
        prop_unit: int = Form(..., gt=0),
        prop_status: Literal['Active', 'Inactive'] = Form(),
        prop_image: UploadFile = File(...),
        prop_built: int = Form(...)
    ):
        self.prop_name = prop_name
        self.prop_loc = prop_loc
        self.prop_unit = prop_unit
        self.prop_status = prop_status
        self.prop_image = prop_image
        self.prop_built = prop_built

class EditProperty(BaseModel):
    prop_name: str = Field(..., max_length=50)
    prop_status: Literal['Active', 'Inactive'] = Field(...)
    prop_loc: str = Field(..., max_length=100)
    prop_unit: int = Field(..., gt=0)
    prop_built: int = Field(...)
    prop_image: HttpUrl

class GetProperty(EditProperty):
    prop_id : int
    occupancy_rate: float
    monthly_revenue: float
