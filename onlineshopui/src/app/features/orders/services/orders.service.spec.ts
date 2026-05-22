import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { take } from 'rxjs';
import { OrdersService } from './orders.service';
import { EnvironmentConfig } from '../../../core/types/providers/environment-config';
import { MOCK_ENVIRONMENT_CONFIG } from '../../../core/mocks/data/environment.mock';
import { MOCK_ORDERS } from '../../../core/mocks/data/orders.mock';
import { OrderDto, CreateOrderDto } from '../../../core/types/dtos/order.dto';

describe('OrdersService', () => {
    let service: OrdersService;
    let httpMock: HttpTestingController;

    const mockOrder = MOCK_ORDERS[0];
    const mockOrders = MOCK_ORDERS;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                OrdersService,
                provideHttpClient(),
                provideHttpClientTesting(),
                {
                    provide: EnvironmentConfig,
                    useValue: MOCK_ENVIRONMENT_CONFIG
                }
            ]
        });

        service = TestBed.inject(OrdersService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('Initialization', () => {
        it('should be created', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            // (no action needed)

            // Verify
            expect(service).toBeTruthy();
        });

        it('should initialize with empty signals', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            // (no action needed)

            // Verify
            expect(service.orders()).toEqual([]);
            expect(service.selectedOrder()).toBeNull();
            expect(service.loading()).toBe(false);
            expect(service.error()).toBeNull();
        });
    });

    describe('loadAll()', () => {
        it('should load all orders successfully', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadAll().pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders`);
            expect(req.request.method).toBe('GET');
            req.flush(mockOrders);

            // Verify
            expect(service.orders()).toEqual(mockOrders);
            expect(service.loading()).toBe(false);
            expect(service.error()).toBeNull();
        });

        it('should set loading to true while loading orders', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadAll().subscribe();

            // Verify
            expect(service.loading()).toBe(true);

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders`);
            req.flush(mockOrders);

            expect(service.loading()).toBe(false);
        });

        it('should handle error when loading orders fails', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadAll().pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders`);
            req.flush('Error', { status: 500, statusText: 'Server Error' });

            // Verify
            expect(service.orders()).toEqual([]);
            expect(service.error()).toBe('Failed to load orders');
            expect(service.loading()).toBe(false);
        });

        it('should clear previous error when loading orders', () => {
            // Prepare
            // Set initial error state
            service.loadAll().subscribe();
            const req1 = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders`);
            req1.flush('Error', { status: 500, statusText: 'Server Error' });

            expect(service.error()).toBe('Failed to load orders');

            // Action
            // Load again successfully
            service.loadAll().subscribe();

            // Verify
            // Error should be cleared immediately
            expect(service.error()).toBeNull();

            const req2 = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders`);
            req2.flush(mockOrders);
        });

        it('should handle empty orders array', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadAll().pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders`);
            req.flush([]);

            // Verify
            expect(service.orders()).toEqual([]);
            expect(service.error()).toBeNull();
        });
    });

    describe('loadById()', () => {
        it('should load order by id successfully', () => {
            // Prepare
            const orderId = 'order-1';

            // Action
            service.loadById(orderId).pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders/${orderId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockOrder);

            // Verify
            expect(service.selectedOrder()).toEqual(mockOrder);
            expect(service.loading()).toBe(false);
            expect(service.error()).toBeNull();
        });

        it('should set loading state correctly', () => {
            // Prepare
            const orderId = 'order-1';

            // Action
            service.loadById(orderId).subscribe();

            // Verify
            expect(service.loading()).toBe(true);

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders/${orderId}`);
            req.flush(mockOrder);

            expect(service.loading()).toBe(false);
        });

        it('should handle error when order not found', () => {
            // Prepare
            const orderId = 'invalid-id';

            // Action
            service.loadById(orderId).pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders/${orderId}`);
            req.flush('Not Found', { status: 404, statusText: 'Not Found' });

            // Verify
            expect(service.selectedOrder()).toBeNull();
            expect(service.error()).toBe('Failed to load order');
            expect(service.loading()).toBe(false);
        });

        it('should clear selectedOrder on error', () => {
            // Prepare
            const orderId = 'order-1';

            // First, load an order successfully
            service.loadById(orderId).pipe(take(1)).subscribe();
            const req1 = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders/${orderId}`);
            req1.flush(mockOrder);

            expect(service.selectedOrder()).toEqual(mockOrder);

            // Action
            // Now try to load an invalid order
            service.loadById('invalid-id').pipe(take(1)).subscribe();

            // Verify
            const req2 = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders/invalid-id`);
            req2.flush('Error', { status: 404, statusText: 'Not Found' });

            expect(service.selectedOrder()).toBeNull();
        });
    });

    describe('create()', () => {
        it('should create a new order and add to orders signal', () => {
            // Prepare
            const createOrderData: CreateOrderDto = {
                items: [
                    {
                        productId: 'prod-3',
                        quantity: 1
                    }
                ],
                address: {
                    country: 'Romania',
                    city: 'Bucharest',
                    county: 'Ilfov',
                    streetAddress: '1 Main St'
                }
            };

            const createdOrder: OrderDto = {
                ...MOCK_ORDERS[0],
                id: 'order-new',
                createdAt: '2024-01-03T00:00:00Z'
            };

            // Pre-populate with existing orders
            service.loadAll().pipe(take(1)).subscribe();
            const loadReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders`);
            loadReq.flush([mockOrders[0]]);

            // Action
            service
                .create(createOrderData)
                .pipe(take(1))
                .subscribe(order => {
                    expect(order).toEqual(createdOrder);
                    expect(service.orders()).toContain(createdOrder);
                    expect(service.orders().length).toBe(2);
                    // New order should be at the beginning
                    expect(service.orders()[0]).toEqual(createdOrder);
                });

            // Verify
            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(createOrderData);
            req.flush(createdOrder);
        });

        it('should send correct request body', () => {
            // Prepare
            const createOrderData: CreateOrderDto = {
                items: [
                    {
                        productId: 'prod-1',
                        quantity: 2
                    },
                    {
                        productId: 'prod-2',
                        quantity: 1
                    }
                ],
                address: {
                    country: 'Romania',
                    city: 'Bucharest',
                    county: 'Ilfov',
                    streetAddress: '1 Main St'
                }
            };

            // Action
            service.create(createOrderData).pipe(take(1)).subscribe();

            // Verify
            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(createOrderData);
            req.flush(mockOrder);
        });

        it('should handle error when creating order fails', () => {
            // Prepare
            const createOrderData: CreateOrderDto = {
                items: [
                    {
                        productId: 'prod-1',
                        quantity: 1
                    }
                ],
                address: {
                    country: 'Romania',
                    city: 'Bucharest',
                    county: 'Ilfov',
                    streetAddress: '1 Main St'
                }
            };

            // Action
            service
                .create(createOrderData)
                .pipe(take(1))
                .subscribe({
                    error: error => {
                        expect(error).toBeTruthy();
                    }
                });

            // Verify
            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders`);
            req.flush('Error', { status: 400, statusText: 'Bad Request' });
        });
    });

    describe('clearSelectedOrder()', () => {
        it('should clear selected order', () => {
            // Prepare
            // Set selected order first
            service.loadById('order-1').subscribe();
            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/orders/order-1`);
            req.flush(mockOrder);

            expect(service.selectedOrder()).toEqual(mockOrder);

            // Action
            service.clearSelectedOrder();

            // Verify
            expect(service.selectedOrder()).toBeNull();
        });

        it('should handle when selectedOrder is already null', () => {
            // Prepare
            expect(service.selectedOrder()).toBeNull();

            // Action
            service.clearSelectedOrder();

            // Verify
            expect(service.selectedOrder()).toBeNull();
        });
    });
});
