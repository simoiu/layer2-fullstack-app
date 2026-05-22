import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ProductUpdatePageComponent } from './product-update-page.component';
import { ProductService } from '../../../services/product.service';
import { SupplierService } from '../../../services/supplier.service';
import { NotificationsService } from '../../../../../core/services/notifications.service';
import { MOCK_CATEGORIES, MOCK_PRODUCTS, MOCK_SUPPLIERS } from '../../../../../core/mocks/data/products.mock';
import { AppNavRoutes } from '../../../../../core/config/constants/navigation.constants';
import { ValidationMessages } from '../../../../../core/types/providers/validation-messages';
import { DefaultValidationMessages } from '../../../../../core/config/constants/validation.constants';

describe('ProductUpdatePageComponent', () => {
    let component: ProductUpdatePageComponent;
    let fixture: ComponentFixture<ProductUpdatePageComponent>;
    let productServiceMock: {
        selectedProduct: ReturnType<typeof signal>;
        categories: ReturnType<typeof signal>;
        loading: ReturnType<typeof signal>;
        error: ReturnType<typeof signal>;
        loadById: ReturnType<typeof vi.fn>;
        loadCategories: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
    };
    let supplierServiceMock: {
        suppliers: ReturnType<typeof signal>;
        loadAll: ReturnType<typeof vi.fn>;
    };
    let routerMock: {
        navigate: ReturnType<typeof vi.fn>;
    };
    let activatedRouteMock: {
        snapshot: {
            paramMap: ReturnType<typeof convertToParamMap>;
        };
    };
    let notificationsServiceMock: {
        notifySuccess: ReturnType<typeof vi.fn>;
        notifyError: ReturnType<typeof vi.fn>;
    };
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Mock console.error to suppress expected error logs during error handling tests
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        productServiceMock = {
            selectedProduct: signal(MOCK_PRODUCTS[0]),
            categories: signal([...MOCK_CATEGORIES]),
            loading: signal(false),
            error: signal(null),
            loadById: vi.fn().mockReturnValue(of(MOCK_PRODUCTS[0])),
            loadCategories: vi.fn().mockReturnValue(of(MOCK_CATEGORIES)),
            update: vi.fn().mockReturnValue(of(MOCK_PRODUCTS[0]))
        };

        supplierServiceMock = {
            suppliers: signal([...MOCK_SUPPLIERS]),
            loadAll: vi.fn().mockReturnValue(of(MOCK_SUPPLIERS))
        };

        routerMock = {
            navigate: vi.fn()
        };

        activatedRouteMock = {
            snapshot: {
                paramMap: convertToParamMap({ id: 'prod-1' })
            }
        };

        notificationsServiceMock = {
            notifySuccess: vi.fn(),
            notifyError: vi.fn()
        };

        TestBed.configureTestingModule({
            imports: [ProductUpdatePageComponent],
            providers: [
                { provide: ProductService, useValue: productServiceMock },
                { provide: SupplierService, useValue: supplierServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: activatedRouteMock },
                { provide: NotificationsService, useValue: notificationsServiceMock },
                { provide: ValidationMessages, useValue: DefaultValidationMessages }
            ]
        });

        fixture = TestBed.createComponent(ProductUpdatePageComponent);
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

        it('should load product and categories on init', () => {
            // Prepare
            // (component created in beforeEach)

            // Action
            component.ngOnInit();

            // Verify
            expect(productServiceMock.loadById).toHaveBeenCalledWith('prod-1');
            expect(productServiceMock.loadCategories).toHaveBeenCalled();
        });

        it('should navigate to products overview when no id provided', () => {
            // Prepare
            activatedRouteMock.snapshot.paramMap = convertToParamMap({});

            // Action
            component.ngOnInit();

            // Verify
            expect(routerMock.navigate).toHaveBeenCalledWith([
                `/${AppNavRoutes.Products.root}/${AppNavRoutes.Products.features.overview}`
            ]);
        });

        it('should populate form with product data', () => {
            // Prepare
            fixture.detectChanges();

            // Action
            // (form auto-populated via effect)

            // Verify
            expect(component.form.value).toEqual({
                name: MOCK_PRODUCTS[0].name,
                description: MOCK_PRODUCTS[0].description,
                price: MOCK_PRODUCTS[0].price,
                weight: MOCK_PRODUCTS[0].weight,
                imageUrl: MOCK_PRODUCTS[0].imageUrl,
                categoryId: MOCK_PRODUCTS[0].category.id,
                supplierId: MOCK_PRODUCTS[0].supplier?.id ?? ''
            });
        });
    });

    describe('onSubmit()', () => {
        beforeEach(() => {
            component.ngOnInit();
            fixture.detectChanges();
        });

        it('should not submit when form is invalid', () => {
            // Prepare
            component.form.patchValue({ name: '' }); // Make form invalid

            // Action
            component.onSubmit();

            // Verify
            expect(productServiceMock.update).not.toHaveBeenCalled();
            expect(component.form.touched).toBe(true);
        });

        it('should update product and navigate on success', () => {
            // Prepare
            component.form.patchValue({
                name: 'Updated Product',
                price: 199.99
            });

            // Action
            component.onSubmit();

            // Verify
            expect(productServiceMock.update).toHaveBeenCalledWith('prod-1', {
                name: 'Updated Product',
                description: MOCK_PRODUCTS[0].description,
                price: 199.99,
                weight: MOCK_PRODUCTS[0].weight,
                imageUrl: MOCK_PRODUCTS[0].imageUrl,
                categoryId: MOCK_PRODUCTS[0].category.id,
                supplierId: MOCK_PRODUCTS[0].supplier?.id ?? ''
            });
            expect(notificationsServiceMock.notifySuccess).toHaveBeenCalledWith({
                title: 'Product updated',
                message: 'Changes have been saved.'
            });
            expect(routerMock.navigate).toHaveBeenCalledWith([
                `/${AppNavRoutes.Products.root}/${AppNavRoutes.Products.features.overview}`
            ]);
        });

        it('should not submit when no product id', () => {
            // Prepare
            activatedRouteMock.snapshot.paramMap = convertToParamMap({});

            const newFixture = TestBed.createComponent(ProductUpdatePageComponent);
            const newComponent = newFixture.componentInstance;
            newComponent.ngOnInit();
            productServiceMock.update.mockClear();

            // Action
            newComponent.onSubmit();

            // Verify
            expect(productServiceMock.update).not.toHaveBeenCalled();
        });

        it('should handle update failure', () => {
            // Prepare
            productServiceMock.update.mockReturnValue(throwError(() => new Error('Failed')));

            // Action
            component.onSubmit();

            // Verify
            expect(notificationsServiceMock.notifyError).toHaveBeenCalledWith({
                title: 'Update failed',
                message: 'Unable to save changes.'
            });
            expect(routerMock.navigate).not.toHaveBeenCalled();
        });

        it('should disable form while submitting', () => {
            // Prepare
            expect(component.form.enabled).toBe(true);

            // Action
            component.isSubmitting.set(true);
            fixture.detectChanges();

            // Verify
            expect(component.form.disabled).toBe(true);
        });
    });

    describe('onCancel()', () => {
        it('should navigate to products overview', () => {
            // Prepare
            // (component created in beforeEach)

            // Action
            component.onCancel();

            // Verify
            expect(routerMock.navigate).toHaveBeenCalledWith([
                `/${AppNavRoutes.Products.root}/${AppNavRoutes.Products.features.overview}`
            ]);
        });
    });

    describe('retry()', () => {
        it('should reload product and categories', () => {
            // Prepare
            component.ngOnInit();
            productServiceMock.loadById.mockClear();
            productServiceMock.loadCategories.mockClear();

            // Action
            component.retry();

            // Verify
            expect(productServiceMock.loadById).toHaveBeenCalledWith('prod-1');
            expect(productServiceMock.loadCategories).toHaveBeenCalled();
        });

        it('should not reload when no product id', () => {
            // Prepare
            activatedRouteMock.snapshot.paramMap = convertToParamMap({});
            component.ngOnInit();
            productServiceMock.loadById.mockClear();
            productServiceMock.loadCategories.mockClear();

            // Action
            component.retry();

            // Verify
            expect(productServiceMock.loadById).not.toHaveBeenCalled();
            expect(productServiceMock.loadCategories).not.toHaveBeenCalled();
        });
    });
});
