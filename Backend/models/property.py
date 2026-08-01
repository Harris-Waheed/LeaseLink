from pydantic import BaseModel, Field
from fastapi import File, UploadFile, Form
from typing import Literal

class NewProperty:
    def __init__(
        self,
        prop_name: str = Form(..., max_length=50),
        prop_loc: str = Form(..., max_length=100),
        prop_unit: int = Form(..., gt=0),
        prop_status: Literal['Active', 'Inactive'] = Form(...),
        prop_built: int = Form(...),
        prop_image: UploadFile = File(...)
    ):
        self.prop_name = prop_name
        self.prop_loc = prop_loc
        self.prop_unit = prop_unit
        self.prop_status = prop_status
        self.prop_built = prop_built
        self.prop_image = prop_image

class EditProperty:
    def __init__(
        self,
        prop_name: str = Form(..., max_length=50),
        prop_loc: str = Form(..., max_length=100),
        prop_unit: int = Form(..., gt=0),
        prop_status: Literal['Active', 'Inactive'] = Form(...),
        prop_built: int = Form(...),
        prop_image: UploadFile | None = File(default=None)
    ):
        self.prop_name = prop_name
        self.prop_loc = prop_loc
        self.prop_unit = prop_unit
        self.prop_status = prop_status
        self.prop_built = prop_built
        self.prop_image = prop_image

class GetProperty(BaseModel):
    prop_id: int = Field(...)
    prop_name: str = Field(...)
    prop_loc: str = Field(...)
    prop_unit: int = Field(...)
    prop_status: Literal['Active', 'Inactive'] = Field(...)
    prop_built: int = Field(...)
    prop_image: str | None = Field(...)