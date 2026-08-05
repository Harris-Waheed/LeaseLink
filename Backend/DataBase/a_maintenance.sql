CREATE TABLE MAINTENANCE_REQUESTS (
    request_id SERIAL PRIMARY KEY,
    lease_id INT NOT NULL REFERENCES LEASES(lease_id) ON DELETE CASCADE ,
    issue_title VARCHAR(255) NOT NULL,
    description text,
    priority VARCHAR(50) NOT NULL DEFAULT 'Low',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    request_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE OR REPLACE PROCEDURE p_add_maintenance(
    p_lease_id IN INT,
    p_issue_title IN VARCHAR,
    p_priority IN VARCHAR,
    p_description IN VARCHAR,
    r_request_id OUT VARCHAR,
    r_request_date OUT DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO MAINTENANCE_REQUESTS (lease_id, issue_title, priority, description, status, request_date)
    VALUES (p_lease_id, p_issue_title, p_priority,
            p_description,'Pending', CURRENT_DATE)

    RETURNING request_id, request_date INTO r_request_id, r_request_date;

END;
$$;

CREATE OR REPLACE PROCEDURE p_get_maintenance(
    p_cursor INOUT refcursor
)
LANGUAGE plpgsql
AS $$
BEGIN
    OPEN p_cursor FOR
    SELECT
        M.request_id,
        M.request_date,
        M.issue_title,
        P.prop_name AS location,
        L.unit_assign,
        M.priority,
        M.description,
        M.status
    FROM MAINTENANCE_REQUESTS M
    LEFT JOIN LEASES L
        ON M.lease_id = L.lease_id
    LEFT JOIN PROPERTIES P
        ON L.prop_id = P.prop_id
    WHERE L.lease_status = 'Active'
    ORDER BY M.request_date DESC;
END;
$$;

CREATE OR REPLACE PROCEDURE p_update_maintenance_status(
    p_request_id IN INT,
    p_new_status IN VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE maintenance_requests
    SET status = p_new_status
    WHERE request_id = p_request_id;
END;
$$;

CREATE OR REPLACE PROCEDURE p_delete_request(
    p_request_id IN INT
)
LANGUAGE plpgsql
AS $$
BEGIN

    DELETE FROM MAINTENANCE_REQUESTS
    WHERE request_id = p_request_id;
end;
    $$;
