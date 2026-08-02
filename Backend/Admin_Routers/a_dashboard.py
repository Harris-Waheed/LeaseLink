from fastapi import APIRouter, Depends, HTTPException, status
from database import get_db
import asyncpg

router = APIRouter(prefix="/dashboard", tags=["ADMIN DASHBOARD"])


@router.get("/dashboard_stats", status_code=status.HTTP_200_OK)
async def get_dashboard_stats(db: asyncpg.Connection = Depends(get_db)):
    query = "CALL p_get_dashboard_stats(NULL, NULL, NULL, NULL)"

    try:
        row = await db.fetchrow(query)

        return {
            "status": "success",
            "data": {
                "total_properties": row["p_total_properties"],
                "active_tenants": row["p_active_tenants"],
                "pending_rent": float(row["p_pending_rent"]),
                "open_tickets": row["p_open_tickets"],
            },
        }

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard KPIs",
        )


@router.get("/dashboard_revenue", status_code=status.HTTP_200_OK)
async def get_dashboard_revenue(db: asyncpg.Connection = Depends(get_db)):

    query = "CALL p_get_revenue_chart_data($1)"

    try:
        async with db.transaction():
            await db.execute(query, "revenue_cursor")

            records = await db.fetch('FETCH ALL FROM "revenue_cursor"')

            revenue_data = []
            for record in records:
                revenue_data.append(
                    {
                        "month": record["month_name"],
                        "revenue": float(record["total_revenue"]),
                    }
                )

            return {"status": "success", "data": revenue_data}

    except Exception as e:
        print(f"Database error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch revenue chart data",
        )


@router.get(path="/dashboard_activities", status_code=status.HTTP_200_OK)
async def get_dashboard_activities(db: asyncpg.Connection = Depends(get_db)):

    query = "CALL p_get_recent_activities($1)"
    activity_list = []

    try:
        async with db.transaction():
            await db.execute(query, "activity_cursor")
            records = await db.fetch("FETCH ALL FROM activity_cursor")

            for record in records:
                activity_list.append(
                    {
                        "activity_type": record["activity_type"],
                        "date": record["activity_date"],
                        "description": record["description"],
                    }
                )

        return {"status": "success", "data": activity_list}

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch activities",
        )
