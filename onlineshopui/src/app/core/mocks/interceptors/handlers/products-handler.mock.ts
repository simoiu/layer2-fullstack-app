import { HttpResponse } from '@angular/common/http';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_SUPPLIERS } from '../../data/products.mock';
import {
    CreateProductRequest,
    ProductDto,
    UpdateProductRequest
} from '../../../types/dtos/product.dto';

let mockProducts = [...MOCK_PRODUCTS];
let mockProductIdCounter = mockProducts.length + 1;

type ProductsHandlerContext = {
    method: string;
    path: string;
    body: unknown;
};

export function handleProductsFeature(
    context: ProductsHandlerContext
): HttpResponse<unknown> | null {
    const { method, path, body } = context;

    if (method === 'GET' && path === '/suppliers') {
        return handleGetSuppliers();
    }

    if (method === 'GET' && path === '/products/categories') {
        return handleGetCategories();
    }

    if (method === 'GET' && path.match(/^\/products\/[\w-]+$/)) {
        const id = path.split('/').pop()!;
        return handleGetProductById(id);
    }

    if (method === 'GET' && path === '/products') {
        return handleGetProducts();
    }

    if (method === 'POST' && path === '/products') {
        return handleCreateProduct(body as CreateProductRequest);
    }

    if (method === 'PUT' && path.match(/^\/products\/[\w-]+$/)) {
        const id = path.split('/').pop()!;
        return handleUpdateProduct(id, body as UpdateProductRequest);
    }

    if (method === 'DELETE' && path.match(/^\/products\/[\w-]+$/)) {
        const id = path.split('/').pop()!;
        return handleDeleteProduct(id);
    }

    return null;
}

function handleGetSuppliers(): HttpResponse<unknown> {
    return new HttpResponse({
        status: 200,
        body: MOCK_SUPPLIERS
    });
}

function handleGetCategories(): HttpResponse<unknown> {
    return new HttpResponse({
        status: 200,
        body: MOCK_CATEGORIES
    });
}

function handleGetProducts(): HttpResponse<unknown> {
    return new HttpResponse({
        status: 200,
        body: mockProducts
    });
}

function handleGetProductById(id: string): HttpResponse<unknown> {
    const product = mockProducts.find(p => p.id === id);

    if (!product) {
        return new HttpResponse({
            status: 404,
            statusText: 'Not Found',
            body: { message: 'Product not found' }
        });
    }

    return new HttpResponse({
        status: 200,
        body: product
    });
}

function handleCreateProduct(body: CreateProductRequest): HttpResponse<unknown> {
    const category = MOCK_CATEGORIES.find(c => c.id === body.categoryId);

    if (!category) {
        return new HttpResponse({
            status: 400,
            statusText: 'Bad Request',
            body: { message: 'Invalid category' }
        });
    }

    const supplier = MOCK_SUPPLIERS.find(s => s.id === body.supplierId) ?? null;

    const newProduct: ProductDto = {
        id: `prod-${mockProductIdCounter++}`,
        name: body.name,
        description: body.description,
        price: body.price,
        weight: body.weight,
        imageUrl: body.imageUrl,
        category,
        supplier
    };

    mockProducts.push(newProduct);

    return new HttpResponse({
        status: 201,
        body: newProduct
    });
}

function handleUpdateProduct(id: string, body: UpdateProductRequest): HttpResponse<unknown> {
    const index = mockProducts.findIndex(p => p.id === id);

    if (index === -1) {
        return new HttpResponse({
            status: 404,
            statusText: 'Not Found',
            body: { message: 'Product not found' }
        });
    }

    const existingProduct = mockProducts[index];
    let category = existingProduct.category;
    let supplier = existingProduct.supplier;

    if (body.categoryId) {
        const foundCategory = MOCK_CATEGORIES.find(c => c.id === body.categoryId);
        if (foundCategory) {
            category = foundCategory;
        }
    }

    if (body.supplierId) {
        const foundSupplier = MOCK_SUPPLIERS.find(s => s.id === body.supplierId);
        supplier = foundSupplier ?? null;
    }

    const updatedProduct: ProductDto = {
        ...existingProduct,
        name: body.name ?? existingProduct.name,
        description: body.description ?? existingProduct.description,
        price: body.price ?? existingProduct.price,
        weight: body.weight ?? existingProduct.weight,
        imageUrl: body.imageUrl ?? existingProduct.imageUrl,
        category,
        supplier
    };

    mockProducts[index] = updatedProduct;

    return new HttpResponse({
        status: 200,
        body: updatedProduct
    });
}

function handleDeleteProduct(id: string): HttpResponse<unknown> {
    const index = mockProducts.findIndex(p => p.id === id);

    if (index === -1) {
        return new HttpResponse({
            status: 404,
            statusText: 'Not Found',
            body: { message: 'Product not found' }
        });
    }

    mockProducts = mockProducts.filter(p => p.id !== id);

    return new HttpResponse({
        status: 204,
        body: null
    });
}
