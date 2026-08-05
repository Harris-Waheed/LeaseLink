from pydantic import BaseModel, Field
from typing import Literal, Optional

class NewMaintenanceRequest(BaseModel):
    lease_id: int
    issue_title: str = Field(..., max_length=255)
    description: Optional[str] = None
    priority: Literal["Low", "High"] = Field(...)


class MaintenanceStatusUpdate(BaseModel):
    request_id: int
    status: Literal['Pending', 'In Progress', 'Resolved']