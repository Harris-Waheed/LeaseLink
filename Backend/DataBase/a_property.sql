CREATE TABLE properties(

    prop_id SERIAL primary key ,
    prop_name VARCHAR(100) NOT NULL UNIQUE ,
    prop_loc TEXT NOT NULL ,
    prop_unit INT NOT NULL ,
    prop_status VARCHAR(30) DEFAULT 'Active' CHECK (prop_status IN ('Active', 'Inactive')) NOT NULL ,
    prop_image TEXT,
    prop_built INT NOT NULL

);

CREATE OR REPLACE PROCEDURE p_add_prop(
    p_prop_name IN VARCHAR,
    p_prop_loc IN VARCHAR,
    p_prop_unit IN INT,
    p_prop_image IN TEXT,
    p_prop_built IN INT,
    p_prop_id OUT INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO properties(PROP_NAME, PROP_LOC, PROP_UNIT, PROP_IMAGE, PROP_BUILT)
    VALUES (p_prop_name, p_prop_loc, p_prop_unit,
             p_prop_image, p_prop_built)

    RETURNING prop_id INTO p_prop_id;
END;
$$;

CREATE OR REPLACE PROCEDURE p_get_props(
    p_cursor INOUT refcursor
)
LANGUAGE plpgsql
AS $$
BEGIN
    OPEN p_cursor FOR
    SELECT
        P.PROP_ID,
        P.PROP_NAME,
        P.PROP_STATUS,
        P.PROP_LOC,
        P.PROP_UNIT,
        P.PROP_BUILT,
        P.PROP_IMAGE
    FROM PROPERTIES P
    ORDER BY prop_id DESC ;
END;
$$;

CREATE OR REPLACE PROCEDURE p_get_prop_stats(
    p_prop_id IN INT,
    p_occupancy_rate OUT DECIMAL,
    p_monthly_revenue OUT DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    SELECT
        COALESCE((COUNT(L.TENANT_ID)::DECIMAL / NULLIF(MAX(P.PROP_UNIT), 0)) * 100, 0),
        COALESCE(SUM(L.RENT_AMOUNT), 0)
    INTO
        p_occupancy_rate,
        p_monthly_revenue
    FROM PROPERTIES P
    LEFT JOIN LEASES L
        ON P.PROP_ID = L.PROP_ID AND L.LEASE_STATUS = 'Active'
    WHERE P.PROP_ID = p_prop_id;
END;
$$;

CREATE OR REPLACE PROCEDURE p_update_prop_status(
    p_prop_id IN INT,
    p_prop_status OUT VARCHAR
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
    WHERE prop_id = p_prop_id

    RETURNING prop_status INTO p_prop_status;
END;
$$;

CREATE OR REPLACE PROCEDURE p_edit_prop(
    p_prop_id IN INT,
    p_prop_name IN VARCHAR,
    p_prop_loc IN VARCHAR,
    p_prop_unit IN INT,
    p_prop_status IN VARCHAR,
    p_prop_image IN VARCHAR,
    p_prop_built IN INT,
    r_prop_image OUT VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE properties
    SET PROP_NAME = p_prop_name,
        PROP_LOC = p_prop_loc,
        PROP_UNIT = p_prop_unit,
        PROP_STATUS = p_prop_status,
        PROP_IMAGE = COALESCE(p_prop_image::VARCHAR, prop_image),
        PROP_BUILT = p_prop_built
    WHERE PROP_ID = p_prop_id

    RETURNING prop_image INTO r_prop_image;
END;
$$;
