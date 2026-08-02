CREATE OR REPLACE PROCEDURE p_get_dashboard_stats(
    p_total_properties OUT BIGINT,
    p_active_tenants OUT BIGINT,
    p_pending_rent OUT DECIMAL,
    p_open_tickets OUT BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT COUNT(*) INTO p_total_properties FROM PROPERTIES;
    SELECT COUNT(*) INTO p_active_tenants FROM LEASES WHERE LEASE_STATUS = 'Active';
    SELECT COALESCE(SUM(amount), 0) INTO p_pending_rent FROM PAYMENTS WHERE status = 'Due';
    SELECT COUNT(*) INTO p_open_tickets FROM MAINTENANCE_REQUESTS WHERE status != 'Completed';
END;
$$;

CREATE OR REPLACE PROCEDURE p_get_revenue_chart_data(
    p_cursor INOUT refcursor
)
LANGUAGE plpgsql
AS $$
BEGIN
    OPEN p_cursor FOR
    SELECT
        TO_CHAR(payment_date, 'Mon') AS month_name,
        SUM(amount) AS total_revenue
    FROM PAYMENTS
    WHERE payment_date >= DATE_TRUNC('year', CURRENT_DATE)
    GROUP BY DATE_TRUNC('month', payment_date), TO_CHAR(payment_date, 'Mon')
    ORDER BY DATE_TRUNC('month', payment_date);
END;
$$;

CREATE OR REPLACE PROCEDURE p_get_recent_activities(p_cursor INOUT refcursor)
LANGUAGE plpgsql
AS $$
BEGIN
    OPEN p_cursor FOR
    SELECT activity_type, activity_date, description FROM (
        SELECT
            'payment' AS activity_type,
            payment_date::timestamp AS activity_date,
            'Rent paid by ' || T.full_name || ' - $' || P.amount AS description
        FROM PAYMENTS P
        JOIN TENANTS T ON P.tenant_id = T.tenant_id

        UNION ALL

        SELECT
            'ticket' AS activity_type,
            request_date::timestamp AS activity_date,
            'New ticket: ' || issue_title AS description
        FROM MAINTENANCE_REQUESTS

        UNION ALL

        SELECT
            'lease' AS activity_type,
            created_at::timestamp AS activity_date,
            'New lease signed for Unit ' || unit_assign AS description
        FROM LEASES
    ) AS activity_log
    ORDER BY activity_date DESC
    LIMIT 5;
END;
$$;