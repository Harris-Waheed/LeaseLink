CREATE TABLE LEASES (
    lease_id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES TENANTS(tenant_id) ON DELETE CASCADE,
    prop_id INT NOT NULL REFERENCES PROPERTIES(prop_id) ON DELETE CASCADE,
    unit_assign VARCHAR(50) NOT NULL,
    lease_start DATE NOT NULL,
    lease_end DATE NOT NULL,
    rent_amount DECIMAL(10, 2) NOT NULL,
    lease_doc_url VARCHAR,
    lease_status VARCHAR(20) DEFAULT 'Active' CHECK (lease_status IN ('Active', 'Expired', 'Terminated')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE PROCEDURE p_add_lease(
    p_tenant_id IN INT,
    p_prop_id IN INT,
    p_unit_assign IN VARCHAR,
    p_lease_start IN DATE,
    p_lease_end IN DATE,
    p_rent_amount IN DECIMAL,
    p_lease_doc_url IN VARCHAR,
    p_lease_id OUT INT,
    p_created_at OUT TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO LEASES (
        TENANT_ID, PROP_ID, UNIT_ASSIGN, LEASE_START,
        LEASE_END, RENT_AMOUNT, LEASE_DOC_URL
    )
    VALUES (P_TENANT_ID, P_PROP_ID, P_UNIT_ASSIGN,
        P_LEASE_START, P_LEASE_END, P_RENT_AMOUNT,
        P_LEASE_DOC_URL
    )
    RETURNING LEASE_ID, CREATED_AT INTO P_LEASE_ID, P_CREATED_AT;
END;
$$;

CREATE OR REPLACE PROCEDURE p_get_leases(
    p_lease_cursor INOUT refcursor
)
LANGUAGE plpgsql
AS $$
BEGIN
    OPEN p_lease_cursor FOR
    SELECT
        l.lease_id, l.tenant_id, t.full_name AS tenant_name,
        t.national_id, t.tenant_image,
        l.prop_id, p.prop_name, l.unit_assign,
        l.lease_start, l.lease_end, l.rent_amount,
        l.lease_doc_url, l.lease_status, l.created_at
    FROM LEASES l
    JOIN TENANTS t ON l.tenant_id = t.tenant_id
    JOIN PROPERTIES p ON l.prop_id = p.prop_id
    ORDER BY l.created_at DESC;
END;
$$;

CREATE OR REPLACE PROCEDURE p_edit_lease(
    p_lease_id IN INT,
    p_unit_assign IN VARCHAR,
    p_lease_start IN DATE,
    p_lease_end IN DATE,
    p_rent_amount IN DECIMAL,
    p_lease_doc_url IN VARCHAR,
    r_lease_doc_url OUT VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE LEASES
    SET
        unit_assign = p_unit_assign,
        lease_start = p_lease_start,
        lease_end = p_lease_end,
        rent_amount = p_rent_amount,
        lease_doc_url = COALESCE(p_lease_doc_url::VARCHAR, LEASES.lease_doc_url)
    WHERE lease_id = p_lease_id

    RETURNING lease_doc_url INTO r_lease_doc_url;
END;
$$;

CREATE OR REPLACE PROCEDURE p_update_lease_status(
    p_lease_id IN INT,
    p_lease_status OUT VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE LEASES
    SET lease_status = CASE
    WHEN leases.lease_status = 'Active' THEN 'Terminated'
    WHEN leases.lease_status = 'Terminated' THEN 'Active'
    ELSE lease_status
    END
    WHERE leases.lease_id = p_lease_id

    RETURNING lease_status INTO p_lease_status;
END;
$$;
