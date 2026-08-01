CREATE TABLE MAINTENANCE_REQUESTS (
    request_id SERIAL PRIMARY KEY,
    lease_id INT NOT NULL,
    issue_title VARCHAR(255) NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Low',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    request_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE OR REPLACE PROCEDURE p_add_maintenance(
    p_lease_id IN INT,
    p_issue_title IN VARCHAR,
    p_priority IN VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO MAINTENANCE_REQUESTS (lease_id, issue_title, priority, status, request_date)
    VALUES (p_lease_id, p_issue_title, p_priority, 'Pending', CURRENT_DATE);
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
        M.request_date,
        M.issue_title,
        P.prop_name AS location,
        M.priority,
        M.status
    FROM MAINTENANCE_REQUESTS M
    JOIN LEASES L
        ON M.lease_id = L.lease_id
    JOIN PROPERTIES P
        ON L.prop_id = P.prop_id
    ORDER BY M.request_date DESC;
END;
$$;