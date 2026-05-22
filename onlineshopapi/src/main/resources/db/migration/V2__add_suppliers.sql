CREATE TABLE suppliers
(
    id            UUID         PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    phone         VARCHAR(50)
);

ALTER TABLE products
    ADD COLUMN supplier_id UUID REFERENCES suppliers (id);
