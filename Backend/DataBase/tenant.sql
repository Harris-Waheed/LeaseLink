CREATE TABLE TENANTS(
    tenant_id SERIAL PRIMARY KEY,
    full_name VARCHAR(50) NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    national_id VARCHAR(40) NOT NULL ,
    unit_assign VARCHAR(40) NOT NULL ,
    prop_id INT NOT NULL REFERENCES properties(prop_id),
    lease_start DATE NOT NULL,
    lease_end DATE NOT NULL,
    rent_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')) NOT NULL,
    joined_at DATE NOT NULL default current_date
                    );

CREATE OR REPLACE PROCEDURE p_add_tenant(
    p_full_name IN VARCHAR,
    p_email IN VARCHAR,
    p_phone_number IN VARCHAR,
    p_national_id IN VARCHAR,
    p_unit_assign IN VARCHAR,
    p_prop_id IN INT,
    p_lease_start IN DATE,
    p_lease_end IN DATE,
    p_rent_amount IN DECIMAL,
    p_tenant_id OUT INT,
    p_joined_at OUT DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO TENANTS(FULL_NAME, EMAIL, PHONE_NUMBER, NATIONAL_ID, UNIT_ASSIGN, PROP_ID, LEASE_START,
                        LEASE_END, RENT_AMOUNT)
    VALUES (p_full_name, p_email, p_phone_number,
            p_national_id, p_unit_assign, p_prop_id, p_lease_start,
            p_lease_end, p_rent_amount)

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
        T.TENANT_ID, T.FULL_NAME, T.EMAIL, T.PHONE_NUMBER,
        T.NATIONAL_ID, T.UNIT_ASSIGN, T.PROP_ID, T.LEASE_START,
        T.LEASE_END, T.RENT_AMOUNT, T.STATUS, T.JOINED_AT,
        P.prop_name
    FROM TENANTS T LEFT JOIN PROPERTIES AS P ON T.prop_id = P.prop_id;
END;
$$;

CREATE OR REPLACE PROCEDURE p_update_tenant_status(
    p_tenant_id IN INT,
    p_tenant_status OUT VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE properties
    SET prop_status = CASE
    WHEN prop_status = 'Active' THEN 'Inactive'
    WHEN prop_status = 'Inactive' THEN 'Active'
    ELSE prop_status
    END
    WHERE prop_id = p_tenant_id

    RETURNING prop_status INTO p_tenant_status;
END;
$$;

CREATE OR REPLACE PROCEDURE p_del_tenant(
    p_tnt_id IN INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM TENANTS
    WHERE tenant_id = p_tnt_id;
END;
$$;

CREATE OR REPLACE PROCEDURE p_edit_tenant(
    p_tnt_id IN INT,
    p_full_name IN VARCHAR,
    p_email IN VARCHAR,
    p_phone_number IN VARCHAR,
    p_national_id IN VARCHAR,
    p_rent_amount IN DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE TENANTS
    SET
        full_name = p_full_name,
        email = p_email,
        phone_number = p_phone_number,
        national_id = p_national_id,
        rent_amount = p_rent_amount
    WHERE tenant_id = p_tnt_id;
END;
$$;