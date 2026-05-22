INSERT INTO suppliers (id, name, contact_email, phone)
VALUES ('5001b000-0000-0000-0000-000000000001', 'TechWorld Distribution', 'orders@techworld.com', '+40 21 555 0101'),
       ('5001b000-0000-0000-0000-000000000002', 'FashionHub Wholesale', 'supply@fashionhub.com', '+40 21 555 0202'),
       ('5001b000-0000-0000-0000-000000000003', 'HomeGarden Supplies', 'contact@homegarden.com', '+40 21 555 0303'),
       ('5001b000-0000-0000-0000-000000000004', 'SportsPro Logistics', 'logistics@sportspro.com', '+40 21 555 0404');

-- Electronics → TechWorld
UPDATE products SET supplier_id = '5001b000-0000-0000-0000-000000000001'
WHERE id IN ('fade0001-0000-0000-0000-000000000001',
             'fade0002-0000-0000-0000-000000000002',
             'fade0003-0000-0000-0000-000000000003');

-- Clothing → FashionHub
UPDATE products SET supplier_id = '5001b000-0000-0000-0000-000000000002'
WHERE id IN ('fade0004-0000-0000-0000-000000000004',
             'fade0005-0000-0000-0000-000000000005');

-- Home & Garden → HomeGarden
UPDATE products SET supplier_id = '5001b000-0000-0000-0000-000000000003'
WHERE id IN ('fade0006-0000-0000-0000-000000000006',
             'fade0007-0000-0000-0000-000000000007');

-- Sports → SportsPro
UPDATE products SET supplier_id = '5001b000-0000-0000-0000-000000000004'
WHERE id IN ('fade0008-0000-0000-0000-000000000008',
             'fade0009-0000-0000-0000-000000000009',
             'fade000a-0000-0000-0000-00000000000a');
