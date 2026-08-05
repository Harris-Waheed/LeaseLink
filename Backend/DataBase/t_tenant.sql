CREATE OR REPLACE PROCEDURE p_get_tenant_portal(
    p_tenant_email IN VARCHAR,
    cursor INOUT refcursor
)
LANGUAGE plpgsql
AS $$
BEGIN
    OPEN cursor FOR
    SELECT T.full_name, T.tenant_image, T.joined_at, T.status, L.lease_id,
           L.lease_start, L.lease_end, L.lease_status, L.lease_doc_url,
           L.unit_assign, L.rent_amount, L.created_at,
           M.request_id, M.issue_title, M.priority,
           M.status, M.request_date
    FROM tenants T
    LEFT JOIN leases L ON T.tenant_id = L.tenant_id
    LEFT JOIN properties P ON P.prop_id = L.prop_id
    LEFT JOIN maintenance_requests M ON M.lease_id = L.lease_id
    WHERE T.email = p_tenant_email AND L.lease_status = 'Active';
end;
$$;

