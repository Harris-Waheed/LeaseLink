CREATE TABLE TENANTS(
    tenant_id SERIAL PRIMARY KEY,
    full_name VARCHAR(50) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    national_id VARCHAR(40) NOT NULL,
    tenant_image VARCHAR,
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')) NOT NULL,
    joined_at DATE NOT NULL default current_date
);

CREATE OR REPLACE PROCEDURE p_add_tenant(
    p_full_name IN VARCHAR,
    p_email IN VARCHAR,
    p_phone_number IN VARCHAR,
    p_national_id IN VARCHAR,
    p_tenant_image IN VARCHAR,
    p_tenant_id OUT INT,
    p_joined_at OUT DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO TENANTS(FULL_NAME, EMAIL, PHONE_NUMBER, NATIONAL_ID, TENANT_IMAGE)
    VALUES (p_full_name, p_email, p_phone_number,
            p_national_id, p_tenant_image)

    RETURNING tenant_id, joined_at INTO p_tenant_id, p_joined_at;
END;
$$;

CREATE OR REPLACE PROCEDURE p_get_tenants(
    p_cursor INOUT refcursor
)
LANGUAGE plpgsql
AS $$
BEGIN
    OPEN p_cursor FOR
    SELECT
        T.TENANT_ID, FULL_NAME, EMAIL, PHONE_NUMBER,
        NATIONAL_ID, TENANT_IMAGE, STATUS, JOINED_AT, P.PROP_NAME, L.UNIT_ASSIGN,
        L.LEASE_START, L.LEASE_END, L.RENT_AMOUNT
    FROM TENANTS T
    JOIN LEASES L ON L.TENANT_ID = T.TENANT_ID
    JOIN PROPERTIES P ON P.PROP_ID = L.PROP_ID
    WHERE LEASE_STATUS = 'Active'
    ORDER BY TENANT_ID DESC
    ;
END;
$$;

CREATE OR REPLACE PROCEDURE p_update_tenant_status(
    p_tenant_id IN INT,
    p_tenant_status OUT VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE TENANTS
    SET status = CASE
    WHEN status = 'Active' THEN 'Inactive'
    WHEN status = 'Inactive' THEN 'Active'
    ELSE status
    END
    WHERE tenant_id = p_tenant_id

    RETURNING status INTO p_tenant_status;
END;
$$;

CREATE OR REPLACE PROCEDURE p_del_tenant(
    p_tnt_email IN VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM TENANTS
    WHERE email = p_tnt_email;
END;
$$;

CREATE OR REPLACE PROCEDURE p_edit_tenant(
    p_tnt_id IN INT,
    p_full_name IN VARCHAR,
    p_email IN VARCHAR,
    p_phone_number IN VARCHAR,
    p_national_id IN VARCHAR,
    p_tenant_image IN VARCHAR,
    r_tenant_image OUT VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE TENANTS
    SET
        full_name = p_full_name, email = p_email, phone_number = p_phone_number,
        national_id = p_national_id,
        tenant_image = COALESCE(p_tenant_image::VARCHAR, tenant_image)
    WHERE tenant_id = p_tnt_id

    RETURNING tenant_image INTO r_tenant_image;
END;
$$;
select  *  from TENANTS;