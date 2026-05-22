import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ProductCatalogPageComponent } from './product-catalog-page.component';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../../cart/services/cart.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { NotificationsService } from '../../../../../core/services/notifications.service';
import { MOCK_PRODUCTS } from '../../../../../core/mocks/data/products.mock';
import { AppNavRoutes } from '../../../../../core/config/constants/navigation.constants';
import { EnvironmentConfig } from '../../../../../core/types/providers/environment-config';
import { MOCK_ENVIRONMENT_CONFIG } from '../../../../../core/mocks/data/environment.mock';

describe('ProductCatalogPageComponent', () => {
    let component: ProductCatalogPageComponent;
    let fixture: ComponentFixture<ProductCatalogPageComponent>;
    let productServiceMock: {
        products: ReturnType<typeof signal>;
        loading: ReturnType<typeof signal>;
        error: ReturnType<typeof signal>;
        loadAll: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
    };
    let cartServiceMock: {
        addItem: ReturnType<typeof vi.fn>;
    };
    let routerMock: {
        navigate: ReturnType<typeof vi.fn>;
    };
    let notificationsServiceMock: {
        notifySuccess: ReturnType<typeof vi.fn>;
    };
    let authServiceMock: {
        isAuthenticated: ReturnType<typeof signal>;
        roles: ReturnType<typeof signal>;
        hasRole: ReturnType<typeof vi.fn>;
        loadProfileIfNeeded: ReturnType<typeof vi.fn>;
    };
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Mock console.error to suppress expected error logs during error handling tests
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        productServiceMock = {
            products: signal([...MOCK_PRODUCTS]),
            loading: signal(false),
            error: signal(null),
            loadAll: vi.fn().mockReturnValue(of(MOCK_PRODUCTS)),
            delete: vi.fn().mockReturnValue(of(void 0))
        };

        cartServiceMock = {
            addItem: vi.fn()
        };

        routerMock = {
            navigate: vi.fn()
        };

        notificationsServiceMock = {
            notifySuccess: vi.fn()
        };

        authServiceMock = {
            isAuthenticated: signal(false),
            roles: signal([]),
            hasRole: vi.fn().mockReturnValue(false),
            loadProfileIfNeeded: vi.fn().mockReturnValue(of(null))
        };

        TestBed.configureTestingModule({
            imports: [ProductCatalogPageComponent],
            providers: [
                { provide: ProductService, useValue: productServiceMock },
                { provide: CartService, useValue: cartServiceMock },
                { provide: AuthService, useValue: authServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: NotificationsService, useValue: notificationsServiceMock },
                { provide: EnvironmentConfig, useValue: MOCK_ENVIRONMENT_CONFIG }
            ]
        });

        fixture = TestBed.createComponent(ProductCatalogPageComponent);
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
    });

    describe('onViewDetails()', () => {
        it('should navigate to product details page', () => {
            // Prepare
            const productId = 'prod-1';

            // Action
            component.onViewDetails(productId);

            // Verify
            expect(routerMock.navigate).toHaveBeenCalledWith([
                `/${AppNavRoutes.Products.root}`,
                productId
            ]);
        });
    });

    describe('onAddToCart()', () => {
        it('should add product to cart and show notification', () => {
            // Prepare
            fixture.detectChanges();
            const productId = MOCK_PRODUCTS[0].id;

            // Action
            component.onAddToCart(productId);

            // Verify
            expect(cartServiceMock.addItem).toHaveBeenCalledWith(productId, 1);
            expect(notificationsServiceMock.notifySuccess).toHaveBeenCalledWith({
                title: 'Added to cart',
                message: `${MOCK_PRODUCTS[0].name} was added to your cart.`
            });
        });

        it('should handle product not found in list', () => {
            // Prepare
            fixture.detectChanges();
            const nonExistentId = 'non-existent';

            // Action
            component.onAddToCart(nonExistentId);

            // Verify
            expect(cartServiceMock.addItem).toHaveBeenCalledWith(nonExistentId, 1);
            expect(notificationsServiceMock.notifySuccess).toHaveBeenCalledWith({
                title: 'Added to cart',
                message: 'Product was added to your cart.'
            });
        });
    });

    describe('onEdit()', () => {
        it('should navigate to product update page', () => {
            // Prepare
            const productId = 'prod-1';

            // Action
            component.onEdit(productId);

            // Verify
            expect(routerMock.navigate).toHaveBeenCalledWith([
                `/${AppNavRoutes.Products.root}/${AppNavRoutes.Products.features.update}`,
                productId
            ]);
        });
    });

    describe('onDelete()', () => {
        it('should set product to delete and show modal', () => {
            // Prepare
            const productId = 'prod-1';

            // Action
            component.onDelete(productId);

            // Verify
            expect(component.productToDelete()).toBe(productId);
            expect(component.showDeleteModal()).toBe(true);
        });
    });

    describe('confirmDelete()', () => {
        it('should delete product and reload products on success', () => {
            // Prepare
            const productId = 'prod-1';
            component.onDelete(productId);

            // Action
            component.confirmDelete();

            // Verify
            expect(productServiceMock.delete).toHaveBeenCalledWith(productId);
            expect(component.showDeleteModal()).toBe(false);
            expect(component.productToDelete()).toBeNull();
            expect(productServiceMock.loadAll).toHaveBeenCalled();
        });

        it('should not delete when no product selected', () => {
            // Prepare
            component.productToDelete.set(null);

            // Action
            component.confirmDelete();

            // Verify
            expect(productServiceMock.delete).not.toHaveBeenCalled();
        });

        it('should handle delete failure', () => {
            // Prepare
            const productId = 'prod-1';
            component.onDelete(productId);
            productServiceMock.delete.mockReturnValue(throwError(() => new Error('Failed')));

            // Action
            component.confirmDelete();

            // Verify
            expect(component.isDeleting()).toBe(false);
        });
    });

    describe('cancelDelete()', () => {
        it('should hide modal and clear product to delete', () => {
            // Prepare
            component.onDelete('prod-1');

            // Action
            component.cancelDelete();

            // Verify
            expect(component.showDeleteModal()).toBe(false);
            expect(component.productToDelete()).toBeNull();
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
});
