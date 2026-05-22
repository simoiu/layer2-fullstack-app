import { HttpResponse } from '@angular/common/http';
import { MOCK_ORDERS } from '../../data/orders.mock';
import { MOCK_USERS } from '../../data/users.mock';
import { CreateOrderDto, OrderDto } from '../../../types/dtos/order.dto';
import { MOCK_PRODUCTS } from '../../data/products.mock';

let mockOrders = [...MOCK_ORDERS];
let mockOrderIdCounter = mockOrders.length + 1003;

type OrdersHandlerContext = {
    method: string;
    path: string;
    body: unknown;
};

export function handleOrdersFeature(context: OrdersHandlerContext): HttpResponse<unknown> | null {
    const { method, path, body } = context;

    if (method === 'GET' && path === '/orders') {
        return handleGetOrders();
    }

    if (method === 'GET' && path.match(/^\/orders\/[\w-]+$/)) {
        const id = path.split('/').pop()!;
        return handleGetOrderById(id);
    }

    if (method === 'POST' && path === '/orders') {
        return handleCreateOrder(body as CreateOrderDto);
    }

    return null;
}

function handleGetOrders(): HttpResponse<unknown> {
    return new HttpResponse({
        status: 200,
        body: mockOrders
    });
}

function handleGetOrderById(id: string): HttpResponse<unknown> {
    const order = mockOrders.find(o => o.id === id);

    if (!order) {
        return new HttpResponse({
            status: 404,
            statusText: 'Not Found',
            body: { message: 'Order not found' }
        });
    }

    return new HttpResponse({
        status: 200,
        body: order
    });
}

function handleCreateOrder(body: CreateOrderDto): HttpResponse<unknown> {
    const items = body.items ?? [];
    const details = items
        .map(item => {
            const product = MOCK_PRODUCTS.find(p => p.id === item.productId);
            if (!product) {
                return null;
            }

            return {
                orderId: 'pending',
                product,
                shippedFrom: {
                    id: 'loc-1',
                    name: 'Main Warehouse',
                    address: {
                        country: 'USA',
                        city: 'Seattle',
                        county: 'King',
                        streetAddress: '500 Market Street'
                    }
                },
                quantity: item.quantity
            };
        })
        .filter((detail): detail is NonNullable<typeof detail> => detail !== null);

    const createdOrder: OrderDto = {
        id: `order-${mockOrderIdCounter++}`,
        userId: MOCK_USERS[0]?.id ?? 'user-1',
        createdAt: new Date().toISOString(),
        address: body.address,
        details
    };

    mockOrders = [createdOrder, ...mockOrders];

    return new HttpResponse({
        status: 201,
        body: createdOrder
    });
}
