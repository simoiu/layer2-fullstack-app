import { ProductCategoryDto, ProductDto } from '../../types/dtos/product.dto';
import { SupplierDto } from '../../types/dtos/supplier.dto';

export const MOCK_CATEGORIES: ProductCategoryDto[] = [
    {
        id: 'cat-1',
        name: 'Electronics',
        description: 'Electronic devices and gadgets'
    },
    {
        id: 'cat-2',
        name: 'Clothing',
        description: 'Apparel and fashion items'
    },
    {
        id: 'cat-3',
        name: 'Home & Garden',
        description: 'Home improvement and garden supplies'
    },
    {
        id: 'cat-4',
        name: 'Sports',
        description: 'Sports equipment and accessories'
    }
];

export const MOCK_SUPPLIERS: SupplierDto[] = [
    {
        id: 'sup-1',
        name: 'TechWorld Distribution',
        contactEmail: 'orders@techworld.com',
        phone: '+40 21 555 0101'
    },
    {
        id: 'sup-2',
        name: 'FashionHub Wholesale',
        contactEmail: 'supply@fashionhub.com',
        phone: '+40 21 555 0202'
    },
    {
        id: 'sup-3',
        name: 'HomeGarden Supplies',
        contactEmail: 'contact@homegarden.com',
        phone: '+40 21 555 0303'
    },
    {
        id: 'sup-4',
        name: 'SportsPro Logistics',
        contactEmail: 'logistics@sportspro.com',
        phone: '+40 21 555 0404'
    }
];

export const MOCK_PRODUCTS: ProductDto[] = [
    {
        id: 'prod-1',
        name: 'Wireless Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 149.99,
        weight: 0.25,
        category: MOCK_CATEGORIES[0],
        supplier: MOCK_SUPPLIERS[0],
        imageUrl: 'https://picsum.photos/seed/headphones/400/300'
    },
    {
        id: 'prod-2',
        name: 'Smart Watch',
        description: 'Feature-rich smartwatch with health tracking',
        price: 299.99,
        weight: 0.05,
        category: MOCK_CATEGORIES[0],
        supplier: MOCK_SUPPLIERS[0],
        imageUrl: 'https://picsum.photos/seed/smartwatch/400/300'
    },
    {
        id: 'prod-3',
        name: 'Bluetooth Speaker',
        description: 'Portable bluetooth speaker with deep bass',
        price: 79.99,
        weight: 0.5,
        category: MOCK_CATEGORIES[0],
        supplier: MOCK_SUPPLIERS[0],
        imageUrl: 'https://picsum.photos/seed/speaker/400/300'
    },
    {
        id: 'prod-4',
        name: 'Cotton T-Shirt',
        description: 'Comfortable 100% cotton t-shirt',
        price: 24.99,
        weight: 0.2,
        category: MOCK_CATEGORIES[1],
        supplier: MOCK_SUPPLIERS[1],
        imageUrl: 'https://picsum.photos/seed/tshirt/400/300'
    },
    {
        id: 'prod-5',
        name: 'Denim Jeans',
        description: 'Classic fit denim jeans',
        price: 59.99,
        weight: 0.6,
        category: MOCK_CATEGORIES[1],
        supplier: MOCK_SUPPLIERS[1],
        imageUrl: 'https://picsum.photos/seed/jeans/400/300'
    },
    {
        id: 'prod-6',
        name: 'Garden Hose',
        description: 'Durable 50ft garden hose with spray nozzle',
        price: 34.99,
        weight: 2.5,
        category: MOCK_CATEGORIES[2],
        supplier: MOCK_SUPPLIERS[2],
        imageUrl: 'https://picsum.photos/seed/hose/400/300'
    },
    {
        id: 'prod-7',
        name: 'LED Desk Lamp',
        description: 'Adjustable LED desk lamp with multiple brightness levels',
        price: 44.99,
        weight: 0.8,
        category: MOCK_CATEGORIES[2],
        supplier: MOCK_SUPPLIERS[2],
        imageUrl: 'https://picsum.photos/seed/lamp/400/300'
    },
    {
        id: 'prod-8',
        name: 'Yoga Mat',
        description: 'Non-slip yoga mat with carrying strap',
        price: 29.99,
        weight: 1.2,
        category: MOCK_CATEGORIES[3],
        supplier: MOCK_SUPPLIERS[3],
        imageUrl: 'https://picsum.photos/seed/yogamat/400/300'
    },
    {
        id: 'prod-9',
        name: 'Running Shoes',
        description: 'Lightweight running shoes with cushioned sole',
        price: 89.99,
        weight: 0.7,
        category: MOCK_CATEGORIES[3],
        supplier: MOCK_SUPPLIERS[3],
        imageUrl: 'https://picsum.photos/seed/shoes/400/300'
    },
    {
        id: 'prod-10',
        name: 'Fitness Tracker',
        description: 'Water-resistant fitness tracker with heart rate monitor',
        price: 69.99,
        weight: 0.03,
        category: MOCK_CATEGORIES[3],
        supplier: MOCK_SUPPLIERS[3],
        imageUrl: 'https://picsum.photos/seed/tracker/400/300'
    }
];
