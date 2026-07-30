CREATE TABLE properties(

    prop_id SERIAL primary key ,
    prop_name VARCHAR(50) NOT NULL UNIQUE ,
    prop_loc VARCHAR(100) NOT NULL ,
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
    p_prop_id IN INT
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

CREATE OR REPLACE PROCEDURE p_update_prop_status(
    p_prop_name IN VARCHAR,
    p_prop_status IN VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE properties
    SET PROP_STATUS = p_prop_status
    WHERE PROP_NAME = p_prop_name;
END;
$$;

CREATE OR REPLACE PROCEDURE p_edit_prop(
    p_prop_id IN INT,
    p_prop_name IN VARCHAR,
    p_prop_loc IN VARCHAR,
    p_prop_unit IN INT,
    p_prop_built IN INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE properties
    SET PROP_NAME = p_prop_name,
        PROP_LOC = p_prop_loc,
        PROP_UNIT = p_prop_unit,
        PROP_BUILT = p_prop_built
    WHERE PROP_ID = p_prop_id;
END;
$$;

select * from properties;