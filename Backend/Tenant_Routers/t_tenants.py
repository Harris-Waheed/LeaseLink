from fastapi import APIRouter, HTTPException, Depends
from database import get_db
import asyncpg

router = APIRouter(prefix="/tenants", tags=["TENANT"])


@router.get("/portal/{tenant_email}")
async def get_tenant_portal(tenant_email: str, db: asyncpg.Connection = Depends(get_db)):

    query = "CALL p_get_tenant_portal($1, 'portal_cursor')"

    try:
        async with db.transaction():
            await db.execute(query, tenant_email)

            records = await db.fetch("FETCH ALL FROM portal_cursor")

            if not records:
                raise HTTPException(
                    status_code=404, detail="No portal data found for this tenant"
                )

            portal_list = []
            for record in records:
                portal_data = {
                    "full_name": record["full_name"],
                    "tenant_image": record["tenant_image"],
                    "joined_at": record["joined_at"],
                    "tenant_status": record["status"],
                    "lease_start": record["lease_start"],
                    "lease_end": record["lease_end"],
                    "lease_status": record["lease_status"],
                    "lease_doc_url": record["lease_doc_url"],
                    "unit_assign": record["unit_assign"],
                    "rent_amount": record["rent_amount"],
                    "created_at": record["created_at"],
                    "request_id": record["request_id"],
                    "issue_title": record["issue_title"],
                    "priority": record["priority"],
                    "status": record["status"],
                    "request_date": record["request_date"],
                }
                portal_list.append(portal_data)

            return {
                "status": "success",
                "data": portal_list,
                "message": "Tenant data retrieved successfully!",
            }

    except HTTPException:
        raise

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Invalid Response!")
