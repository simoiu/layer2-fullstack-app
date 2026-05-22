import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CartOverviewPageComponent } from './cart-overview-page.component';
import { CartService } from '../../../services/cart.service';
import { ProductService } from '../../../../products/services/product.service';
import { OrdersService } from '../../../../orders/services/orders.service';
import { NotificationsService } from '../../../../../core/services/notifications.service';
import { MOCK_CART_ITEMS } from '../../../../../core/mocks/data/cart.mock';
import { MOCK_PRODUCTS } from '../../../../../core/mocks/data/products.mock';
import { MOCK_ORDERS } from '../../../../../core/mocks/data/orders.mock';
import { signal } from '@angular/core';

describe('CartOverviewPageComponent', () => {
    let component: CartOverviewPageComponent;
    let fixture: ComponentFixture<CartOverviewPageComponent>;
    let cartServiceMock: {
        items: ReturnType<typeof signal>;
        totalItems: ReturnType<typeof signal>;
        updateQuantity: ReturnType<typeof vi.fn>;
        removeItem: ReturnType<typeof vi.fn>;
        clear: ReturnType<typeof vi.fn>;
    };
    let productServiceMock: {
        products: ReturnType<typeof signal>;
        loading: ReturnType<typeof signal>;
        error: ReturnType<typeof signal>;
        loadAll: ReturnType<typeof vi.fn>;
    };
    let ordersServiceMock: {
        create: ReturnType<typeof vi.fn>;
    };
    let routerMock: {
        navigate: ReturnType<typeof vi.fn>;
    };
    let notificationsServiceMock: {
        notifySuccess: ReturnType<typeof vi.fn>;
        notifyError: ReturnType<typeof vi.fn>;
    };
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Mock console.error to suppress expected error logs during error handling tests
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        cartServiceMock = {
            items: signal([...MOCK_CART_ITEMS]),
            totalItems: signal(3),
            updateQuantity: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn()
        };

        productServiceMock = {
            products: signal([...MOCK_PRODUCTS]),
            loading: signal(false),
            error: signal(null),
            loadAll: vi.fn().mockReturnValue(of(MOCK_PRODUCTS))
        };

        ordersServiceMock = {
            create: vi.fn().mockReturnValue(of(MOCK_ORDERS[0]))
        };

        routerMock = {
            navigate: vi.fn()
        };

        notificationsServiceMock = {
            notifySuccess: vi.fn(),
            notifyError: vi.fn()
        };

        TestBed.configureTestingModule({
            imports: [CartOverviewPageComponent],
            providers: [
                { provide: CartService, useValue: cartServiceMock },
                { provide: ProductService, useValue: productServiceMock },
                { provide: OrdersService, useValue: ordersServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: NotificationsService, useValue: notificationsServiceMock }
            ]
        });

        fixture = TestBed.createComponent(CartOverviewPageComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    describe('Initialization', () => {
        it('should create', () => {
            // Prepare
            // (component created in beforeEach)

            // Action
            // (no action needed)

            // Verify
            expect(component).toBeTruthy();
        });

        it('should load products on init', () => {
            // Prepare
            // (component created in beforeEach)

            // Action
            component.ngOnInit();

            // Verify
            expect(productServiceMock.loadAll).toHaveBeenCalled();
        });

        it('should initialize with cart items from service', () => {
            // Prepare
            // (component created in beforeEach)

            // Action
            fixture.detectChanges();

            // Verify
            expect(component.cartItems()).toEqual(MOCK_CART_ITEMS);
        });
    });

    describe('onQuantityChange()', () => {
        it('should update quantity in cart service', () => {
            // Prepare
            const productId = 'prod-1';
            const quantity = 5;

            // Action
            component.onQuantityChange(productId, quantity);

            // Verify
            expect(cartServiceMock.updateQuantity).toHaveBeenCalledWith(productId, quantity);
        });
    });

    describe('onRemoveItem()', () => {
        it('should remove item from cart service', () => {
            // Prepare
            const productId = 'prod-1';

            // Action
            component.onRemoveItem(productId);

            // Verify
            expect(cartServiceMock.removeItem).toHaveBeenCalledWith(productId);
        });
    });

    describe('onClearCart()', () => {
        it('should clear cart service', () => {
            // Prepare
            // (component created in beforeEach)

            // Action
            component.onClearCart();

            // Verify
            expect(cartServiceMock.clear).toHaveBeenCalled();
        });
    });

    describe('onCheckout()', () => {
        it('should not proceed when cart is empty', () => {
            // Prepare
            cartServiceMock.items.set([]);

            // Action
            component.onCheckout();

            // Verify
            expect(ordersServiceMock.create).not.toHaveBeenCalled();
        });

        it('should create order and navigate to orders on success', () => {
            // Prepare
            fixture.detectChanges();
            component.addressForm.patchValue({
                country: 'Romania',
                city: 'Bucharest',
                county: 'Ilfov',
                streetAddress: '1 Main St'
            });

            // Action
            component.onCheckout();

            // Verify
            expect(ordersServiceMock.create).toHaveBeenCalled();
            expect(cartServiceMock.clear).toHaveBeenCalled();
            expect(notificationsServiceMock.notifySuccess).toHaveBeenCalledWith({
                title: 'Order placed',
                message: 'Your order is being processed.'
            });
            expect(routerMock.navigate).toHaveBeenCalled();
        });

        it('should handle checkout failure', () => {
            // Prepare
            ordersServiceMock.create.mockReturnValue(throwError(() => new Error('Failed')));
            fixture.detectChanges();
            component.addressForm.patchValue({
                country: 'Romania',
                city: 'Bucharest',
                county: 'Ilfov',
                streetAddress: '1 Main St'
            });

            // Action
            component.onCheckout();

            // Verify
            expect(notificationsServiceMock.notifyError).toHaveBeenCalledWith({
                title: 'Order failed',
                message: 'Please try again in a moment.'
            });
            expect(routerMock.navigate).not.toHaveBeenCalled();
        });
    });

    describe('retry()', () => {
        it('should reload products', () => {
            // Prepare
            productServiceMock.loadAll.mockClear();

            // Action
            component.retry();

            // Verify
            expect(productServiceMock.loadAll).toHaveBeenCalled();
        });
    });

    describe('computed values', () => {
        it('should calculate subtotal correctly', () => {
            // Prepare
            fixture.detectChanges();

            // Action
            const subtotal = component.subtotal();

            // Verify
            expect(parseFloat(subtotal)).toBeGreaterThan(0);
        });

        it('should build productsById map', () => {
            // Prepare
            fixture.detectChanges();

            // Action
            const productsById = component.productsById();

            // Verify
            expect(productsById.size).toBeGreaterThan(0);
        });
    });
});
