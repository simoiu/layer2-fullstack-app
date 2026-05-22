import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CartService } from './cart.service';
import { MOCK_CART_ITEMS } from '../../../core/mocks/data/cart.mock';

describe('CartService', () => {
    let service: CartService;
    let localStorageMock: Record<string, string>;
    let localStorageStore: {
        getItem: ReturnType<typeof vi.fn>;
        setItem: ReturnType<typeof vi.fn>;
        removeItem: ReturnType<typeof vi.fn>;
        clear: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        // Mock localStorage — window.localStorage may be undefined in the test environment,
        // so we assign a fake directly rather than spying on Storage.prototype
        localStorageMock = {};

        localStorageStore = {
            getItem: vi.fn((key: string) => localStorageMock[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                localStorageMock[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete localStorageMock[key];
            }),
            clear: vi.fn(() => {
                localStorageMock = {};
            })
        };

        Object.defineProperty(window, 'localStorage', {
            value: localStorageStore,
            writable: true,
            configurable: true
        });

        TestBed.configureTestingModule({
            providers: [CartService]
        });

        service = TestBed.inject(CartService);
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

        it('should initialize with empty cart when no storage data', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            // (no action needed)

            // Verify
            expect(service.items()).toEqual([]);
            expect(service.totalItems()).toBe(0);
        });

        it('should load items from localStorage on initialization', () => {
            // Prepare
            const storedItems = [MOCK_CART_ITEMS[0], MOCK_CART_ITEMS[1]];

            localStorageMock['cart_state'] = JSON.stringify({ items: storedItems });

            // Create a fresh TestBed with the mocked localStorage
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [CartService]
            });

            // Action
            const newService = TestBed.inject(CartService);

            // Verify
            expect(newService.items()).toEqual(storedItems);
            expect(newService.totalItems()).toBe(3); // 2 + 1
        });

        it('should handle corrupted localStorage data', () => {
            // Prepare
            localStorageMock['cart_state'] = 'invalid-json';

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [CartService]
            });

            // Action
            const newService = TestBed.inject(CartService);

            // Verify
            expect(newService.items()).toEqual([]);
            expect(newService.totalItems()).toBe(0);
        });

        it('should filter out invalid items from storage', () => {
            // Prepare
            const storedData = {
                items: [
                    { productId: 'prod-1', quantity: 2 },
                    { productId: '', quantity: 1 }, // Invalid: empty productId
                    { productId: 'prod-2', quantity: 0 }, // Invalid: zero quantity
                    { productId: 'prod-3', quantity: -1 } // Invalid: negative quantity
                ]
            };

            localStorageMock['cart_state'] = JSON.stringify(storedData);

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [CartService]
            });

            // Action
            const newService = TestBed.inject(CartService);

            // Verify
            expect(newService.items()).toEqual([{ productId: 'prod-1', quantity: 2 }]);
        });
    });

    describe('addItem()', () => {
        it('should add new item to cart', () => {
            // Prepare
            // (service initialized in beforeEach)

            // Action
            service.addItem('prod-1', 2);

            // Verify
            expect(service.items()).toEqual([{ productId: 'prod-1', quantity: 2 }]);
            expect(service.totalItems()).toBe(2);
        });

        it('should increase quantity when adding existing item', () => {
            // Prepare
            // (service initialized in beforeEach)

            // Action
            service.addItem('prod-1', 2);
            service.addItem('prod-1', 3);

            // Verify
            expect(service.items()).toEqual([{ productId: 'prod-1', quantity: 5 }]);
            expect(service.totalItems()).toBe(5);
        });

        it('should add multiple different items', () => {
            // Prepare
            // (service initialized in beforeEach)

            // Action
            service.addItem('prod-1', 2);
            service.addItem('prod-2', 1);
            service.addItem('prod-3', 3);

            // Verify
            expect(service.items().length).toBe(3);
            expect(service.totalItems()).toBe(6);
        });

        it('should not add item with zero quantity', () => {
            // Prepare
            // (service initialized in beforeEach)

            // Action
            service.addItem('prod-1', 0);

            // Verify
            expect(service.items()).toEqual([]);
            expect(service.totalItems()).toBe(0);
        });

        it('should not add item with negative quantity', () => {
            // Prepare
            // (service initialized in beforeEach)

            // Action
            service.addItem('prod-1', -5);

            // Verify
            expect(service.items()).toEqual([]);
            expect(service.totalItems()).toBe(0);
        });

        it('should persist to localStorage', () => {
            // Prepare
            // (service initialized in beforeEach)

            // Action
            service.addItem('prod-1', 2);

            // Verify
            expect(localStorageStore.setItem).toHaveBeenCalledWith(
                'cart_state',
                JSON.stringify({ items: [{ productId: 'prod-1', quantity: 2 }] })
            );
        });
    });

    describe('updateQuantity()', () => {
        beforeEach(() => {
            service.addItem('prod-1', 2);
            service.addItem('prod-2', 3);
        });

        it('should update quantity of existing item', () => {
            // Prepare
            // (items added in beforeEach)

            // Action
            service.updateQuantity('prod-1', 5);

            // Verify
            const item = service.items().find(i => i.productId === 'prod-1');
            expect(item?.quantity).toBe(5);
            expect(service.totalItems()).toBe(8); // 5 + 3
        });

        it('should remove item when quantity is zero', () => {
            // Prepare
            // (items added in beforeEach)

            // Action
            service.updateQuantity('prod-1', 0);

            // Verify
            expect(service.items().find(i => i.productId === 'prod-1')).toBeUndefined();
            expect(service.items().length).toBe(1);
            expect(service.totalItems()).toBe(3);
        });

        it('should remove item when quantity is negative', () => {
            // Prepare
            // (items added in beforeEach)

            // Action
            service.updateQuantity('prod-1', -1);

            // Verify
            expect(service.items().find(i => i.productId === 'prod-1')).toBeUndefined();
            expect(service.items().length).toBe(1);
        });

        it('should handle updating non-existent item', () => {
            // Prepare
            const initialItems = [...service.items()];

            // Action
            service.updateQuantity('prod-999', 5);

            // Verify
            expect(service.items()).toEqual(initialItems);
        });

        it('should persist to localStorage', () => {
            // Prepare
            // (items added in beforeEach)

            // Action
            service.updateQuantity('prod-1', 10);

            // Verify
            expect(localStorageStore.setItem).toHaveBeenCalled();
        });
    });

    describe('removeItem()', () => {
        beforeEach(() => {
            service.addItem('prod-1', 2);
            service.addItem('prod-2', 3);
            service.addItem('prod-3', 1);
        });

        it('should remove item from cart', () => {
            // Prepare
            // (items added in beforeEach)

            // Action
            service.removeItem('prod-2');

            // Verify
            expect(service.items().find(i => i.productId === 'prod-2')).toBeUndefined();
            expect(service.items().length).toBe(2);
            expect(service.totalItems()).toBe(3); // 2 + 1
        });

        it('should handle removing non-existent item', () => {
            // Prepare
            const initialLength = service.items().length;

            // Action
            service.removeItem('prod-999');

            // Verify
            expect(service.items().length).toBe(initialLength);
        });

        it('should persist to localStorage', () => {
            // Prepare
            // (items added in beforeEach)

            // Action
            service.removeItem('prod-1');

            // Verify
            expect(localStorageStore.setItem).toHaveBeenCalled();
        });
    });

    describe('clear()', () => {
        beforeEach(() => {
            service.addItem('prod-1', 2);
            service.addItem('prod-2', 3);
        });

        it('should clear all items from cart', () => {
            // Prepare
            // (items added in beforeEach)

            // Action
            service.clear();

            // Verify
            expect(service.items()).toEqual([]);
            expect(service.totalItems()).toBe(0);
        });

        it('should persist empty cart to localStorage', () => {
            // Prepare
            // (items added in beforeEach)

            // Action
            service.clear();

            // Verify
            expect(localStorageStore.setItem).toHaveBeenCalledWith(
                'cart_state',
                JSON.stringify({ items: [] })
            );
        });
    });

    describe('totalItems computed signal', () => {
        it('should calculate total items correctly', () => {
            // Prepare
            expect(service.totalItems()).toBe(0);

            // Action
            service.addItem('prod-1', 2);
            expect(service.totalItems()).toBe(2);

            service.addItem('prod-2', 3);
            expect(service.totalItems()).toBe(5);

            service.addItem('prod-1', 1);
            expect(service.totalItems()).toBe(6);

            service.removeItem('prod-2');
            expect(service.totalItems()).toBe(3);

            service.clear();

            // Verify
            expect(service.totalItems()).toBe(0);
        });
    });
});
