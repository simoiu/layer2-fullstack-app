import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { take } from 'rxjs';
import { ProductService } from './product.service';
import { EnvironmentConfig } from '../../../core/types/providers/environment-config';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../../../core/mocks/data/products.mock';
import { MOCK_ENVIRONMENT_CONFIG } from '../../../core/mocks/data/environment.mock';
import { ProductDto } from '../../../core/types/dtos/product.dto';

describe('ProductService', () => {
    let service: ProductService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                ProductService,
                provideHttpClient(),
                provideHttpClientTesting(),
                {
                    provide: EnvironmentConfig,
                    useValue: MOCK_ENVIRONMENT_CONFIG
                }
            ]
        });

        service = TestBed.inject(ProductService);
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
            expect(service.products()).toEqual([]);
            expect(service.selectedProduct()).toBeNull();
            expect(service.categories()).toEqual([]);
            expect(service.loading()).toBe(false);
            expect(service.error()).toBeNull();
        });
    });

    describe('loadAll()', () => {
        it('should load all products successfully', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadAll().pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products`);
            expect(req.request.method).toBe('GET');
            req.flush(MOCK_PRODUCTS);

            // Verify
            expect(service.products()).toEqual(MOCK_PRODUCTS);
            expect(service.loading()).toBe(false);
            expect(service.error()).toBeNull();
        });

        it('should set loading to true while loading products', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadAll().subscribe();

            // Verify
            expect(service.loading()).toBe(true);

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products`);
            req.flush(MOCK_PRODUCTS);

            expect(service.loading()).toBe(false);
        });

        it('should handle error when loading products fails', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadAll().pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products`);
            req.flush('Error', { status: 500, statusText: 'Server Error' });

            // Verify
            expect(service.products()).toEqual([]);
            expect(service.error()).toBe('Failed to load products');
            expect(service.loading()).toBe(false);
        });

        it('should clear previous error when loading products', () => {
            // Prepare
            // Set initial error state
            service.loadAll().subscribe();
            const req1 = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products`);
            req1.flush('Error', { status: 500, statusText: 'Server Error' });

            expect(service.error()).toBe('Failed to load products');

            // Action
            // Load again successfully
            service.loadAll().subscribe();

            // Verify
            // Error should be cleared immediately
            expect(service.error()).toBeNull();

            const req2 = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products`);
            req2.flush(MOCK_PRODUCTS);
        });

        it('should handle empty products array', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadAll().pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products`);
            req.flush([]);

            // Verify
            expect(service.products()).toEqual([]);
            expect(service.error()).toBeNull();
        });
    });

    describe('loadById()', () => {
        it('should load product by id successfully', () => {
            // Prepare
            const productId = 'prod-1';
            const expectedProduct = MOCK_PRODUCTS[0];

            // Action
            service.loadById(productId).pipe(take(1)).subscribe();

            const req = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/${productId}`
            );
            expect(req.request.method).toBe('GET');
            req.flush(expectedProduct);

            // Verify
            expect(service.selectedProduct()).toEqual(expectedProduct);
            expect(service.loading()).toBe(false);
            expect(service.error()).toBeNull();
        });

        it('should set loading state correctly', () => {
            // Prepare
            const productId = 'prod-1';

            // Action
            service.loadById(productId).subscribe();

            // Verify
            expect(service.loading()).toBe(true);

            const req = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/${productId}`
            );
            req.flush(MOCK_PRODUCTS[0]);

            expect(service.loading()).toBe(false);
        });

        it('should handle error when product not found', () => {
            // Prepare
            const productId = 'invalid-id';

            // Action
            service.loadById(productId).pipe(take(1)).subscribe();

            const req = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/${productId}`
            );
            req.flush('Not Found', { status: 404, statusText: 'Not Found' });

            // Verify
            expect(service.selectedProduct()).toBeNull();
            expect(service.error()).toBe('Failed to load product');
            expect(service.loading()).toBe(false);
        });

        it('should clear selectedProduct on error', () => {
            // Prepare
            const productId = 'prod-1';

            // First, load a product successfully
            service.loadById(productId).pipe(take(1)).subscribe();
            const req1 = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/${productId}`
            );
            req1.flush(MOCK_PRODUCTS[0]);

            expect(service.selectedProduct()).toEqual(MOCK_PRODUCTS[0]);

            // Action
            // Now try to load an invalid product
            service
                .loadById('invalid-id')
                .pipe(take(1))
                .subscribe(() => {
                    expect(service.selectedProduct()).toBeNull();
                });

            // Verify
            const req2 = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/invalid-id`
            );
            req2.flush('Error', { status: 404, statusText: 'Not Found' });
        });
    });

    describe('loadCategories()', () => {
        it('should load categories successfully', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadCategories().pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/categories`);
            expect(req.request.method).toBe('GET');
            req.flush(MOCK_CATEGORIES);

            // Verify
            expect(service.categories()).toEqual(MOCK_CATEGORIES);
            expect(service.loading()).toBe(false);
            expect(service.error()).toBeNull();
        });

        it('should set loading state correctly', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadCategories().subscribe();

            // Verify
            expect(service.loading()).toBe(true);

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/categories`);
            req.flush(MOCK_CATEGORIES);

            expect(service.loading()).toBe(false);
        });

        it('should handle error when loading categories fails', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            service.loadCategories().pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/categories`);
            req.flush('Error', { status: 500, statusText: 'Server Error' });

            // Verify
            expect(service.categories()).toEqual([]);
            expect(service.error()).toBe('Failed to load categories');
            expect(service.loading()).toBe(false);
        });
    });

    describe('create()', () => {
        it('should create a new product and add to products signal', () => {
            // Prepare
            const newProductData = {
                name: 'New Product',
                description: 'Test product',
                price: 99.99,
                weight: 1.5,
                imageUrl: 'http://test.com/image.jpg',
                categoryId: 'cat-1',
                supplierId: 'sup-1'
            };

            const createdProduct: ProductDto = {
                id: 'prod-new',
                name: newProductData.name,
                description: newProductData.description,
                price: newProductData.price,
                weight: newProductData.weight,
                imageUrl: newProductData.imageUrl,
                category: MOCK_CATEGORIES[0],
                supplier: null
            };

            // Pre-populate with existing products
            service.loadAll().pipe(take(1)).subscribe();
            const loadReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products`);
            loadReq.flush([MOCK_PRODUCTS[0]]);

            // Action
            service
                .create(newProductData)
                .pipe(take(1))
                .subscribe(product => {
                    expect(product).toEqual(createdProduct);
                    expect(service.products()).toContain(createdProduct);
                    expect(service.products().length).toBe(2);
                });

            // Verify
            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(newProductData);
            req.flush(createdProduct);
        });

        it('should send correct request body', () => {
            // Prepare
            const newProductData = {
                name: 'Test Product',
                description: 'Description',
                price: 50.0,
                weight: 0.5,
                imageUrl: 'http://example.com/image.jpg',
                categoryId: 'cat-2',
                supplierId: 'sup-1'
            };

            // Action
            service.create(newProductData).pipe(take(1)).subscribe();

            // Verify
            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(newProductData);
            req.flush({
                id: 'prod-test',
                ...newProductData,
                category: MOCK_CATEGORIES[1],
                supplier: null
            });
        });

        it('should handle error when creating product fails', () => {
            // Prepare
            const newProductData = {
                name: 'New Product',
                description: 'Test product',
                price: 99.99,
                weight: 1.5,
                imageUrl: 'http://test.com/image.jpg',
                categoryId: 'cat-1',
                supplierId: 'sup-1'
            };

            // Action
            service
                .create(newProductData)
                .pipe(take(1))
                .subscribe({
                    error: error => {
                        expect(error).toBeTruthy();
                    }
                });

            // Verify
            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products`);
            req.flush('Error', { status: 400, statusText: 'Bad Request' });
        });
    });

    describe('update()', () => {
        it('should update product and update products signal', () => {
            // Prepare
            const productId = 'prod-1';
            const updateData = {
                name: 'Updated Product',
                price: 199.99
            };

            const updatedProduct: ProductDto = {
                ...MOCK_PRODUCTS[0],
                ...updateData
            };

            // Pre-populate products
            service.loadAll().pipe(take(1)).subscribe();
            const loadReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products`);
            loadReq.flush([MOCK_PRODUCTS[0], MOCK_PRODUCTS[1]]);

            // Action
            service
                .update(productId, updateData)
                .pipe(take(1))
                .subscribe(product => {
                    expect(product).toEqual(updatedProduct);
                    const products = service.products();
                    expect(products.find(p => p.id === productId)).toEqual(updatedProduct);
                });

            // Verify
            const req = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/${productId}`
            );
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(updateData);
            req.flush(updatedProduct);
        });

        it('should update selectedProduct when ID matches', () => {
            // Prepare
            const productId = 'prod-1';
            const updateData = { name: 'Updated Product' };
            const updatedProduct: ProductDto = {
                ...MOCK_PRODUCTS[0],
                ...updateData
            };

            // Set selected product
            service.loadById(productId).pipe(take(1)).subscribe();
            const loadReq = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/${productId}`
            );
            loadReq.flush(MOCK_PRODUCTS[0]);

            expect(service.selectedProduct()).toEqual(MOCK_PRODUCTS[0]);

            // Action
            service
                .update(productId, updateData)
                .pipe(take(1))
                .subscribe(() => {
                    expect(service.selectedProduct()).toEqual(updatedProduct);
                });

            // Verify
            const req = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/${productId}`
            );
            req.flush(updatedProduct);
        });

        it('should NOT update selectedProduct when ID differs', () => {
            // Prepare
            // Set selected product to prod-1
            service.loadById('prod-1').pipe(take(1)).subscribe();
            const loadReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/prod-1`);
            loadReq.flush(MOCK_PRODUCTS[0]);

            const selectedBefore = service.selectedProduct();

            // Action
            // Update prod-2
            service
                .update('prod-2', { name: 'Updated' })
                .pipe(take(1))
                .subscribe(() => {
                    expect(service.selectedProduct()).toEqual(selectedBefore);
                });

            // Verify
            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/prod-2`);
            req.flush({
                ...MOCK_PRODUCTS[1],
                name: 'Updated'
            });
        });

        it('should send correct request body', () => {
            // Prepare
            const productId = 'prod-1';
            const updateData = {
                name: 'Updated Name',
                price: 250.0,
                categoryId: 'cat-2'
            };

            // Action
            service.update(productId, updateData).pipe(take(1)).subscribe();

            // Verify
            const req = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/${productId}`
            );
            expect(req.request.method).toBe('PUT');
            expect(req.request.body).toEqual(updateData);
            req.flush({
                ...MOCK_PRODUCTS[0],
                ...updateData
            });
        });
    });

    describe('delete()', () => {
        it('should delete product and remove from products signal', () => {
            // Prepare
            const productId = 'prod-1';

            // Pre-populate products
            service.loadAll().pipe(take(1)).subscribe();
            const loadReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products`);
            loadReq.flush([MOCK_PRODUCTS[0], MOCK_PRODUCTS[1]]);

            expect(service.products().length).toBe(2);

            // Action
            service
                .delete(productId)
                .pipe(take(1))
                .subscribe(() => {
                    const products = service.products();
                    expect(products.length).toBe(1);
                    expect(products.find(p => p.id === productId)).toBeUndefined();
                });

            // Verify
            const req = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/${productId}`
            );
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });

        it('should clear selectedProduct when ID matches', () => {
            // Prepare
            const productId = 'prod-1';

            // Set selected product
            service.loadById(productId).pipe(take(1)).subscribe();
            const loadReq = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/${productId}`
            );
            loadReq.flush(MOCK_PRODUCTS[0]);

            expect(service.selectedProduct()).toEqual(MOCK_PRODUCTS[0]);

            // Action
            service
                .delete(productId)
                .pipe(take(1))
                .subscribe(() => {
                    expect(service.selectedProduct()).toBeNull();
                });

            // Verify
            const req = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/${productId}`
            );
            req.flush(null);
        });

        it('should NOT clear selectedProduct when ID differs', () => {
            // Prepare
            // Set selected product to prod-1
            service.loadById('prod-1').pipe(take(1)).subscribe();
            const loadReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/prod-1`);
            loadReq.flush(MOCK_PRODUCTS[0]);

            const selectedBefore = service.selectedProduct();

            // Action
            // Delete prod-2
            service
                .delete('prod-2')
                .pipe(take(1))
                .subscribe(() => {
                    expect(service.selectedProduct()).toEqual(selectedBefore);
                });

            // Verify
            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/prod-2`);
            req.flush(null);
        });

        it('should send correct DELETE request', () => {
            // Prepare
            const productId = 'prod-5';

            // Action
            service.delete(productId).pipe(take(1)).subscribe();

            // Verify
            const req = httpMock.expectOne(
                `${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/${productId}`
            );
            expect(req.request.method).toBe('DELETE');
            req.flush(null);
        });
    });

    describe('clearSelectedProduct()', () => {
        it('should clear selected product', () => {
            // Prepare
            // Set selected product first
            service.loadById('prod-1').subscribe();
            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/products/prod-1`);
            req.flush(MOCK_PRODUCTS[0]);

            expect(service.selectedProduct()).toEqual(MOCK_PRODUCTS[0]);

            // Action
            service.clearSelectedProduct();

            // Verify
            expect(service.selectedProduct()).toBeNull();
        });

        it('should handle when selectedProduct is already null', () => {
            // Prepare
            expect(service.selectedProduct()).toBeNull();

            // Action
            service.clearSelectedProduct();

            // Verify
            expect(service.selectedProduct()).toBeNull();
        });
    });
});
