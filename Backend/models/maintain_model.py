from pydantic import BaseModel


class NewMaintenanceRequest(BaseModel):
    lease_id: int
    issue_title: str
    priority: str
