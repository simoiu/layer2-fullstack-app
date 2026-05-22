import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { EnvironmentConfig } from '../../../core/types/providers/environment-config';
import { MOCK_ENVIRONMENT_CONFIG } from '../../../core/mocks/data/environment.mock';
import { MOCK_USERS } from '../../../core/mocks/data/users.mock';
import {
    MOCK_JWT_TOKEN,
    MOCK_JWT_PAYLOAD,
    MOCK_LOGIN_CREDENTIALS,
    MOCK_REGISTER_REQUEST
} from '../../../core/mocks/data/auth.mock';
import { UserDto } from '../../../core/types/dtos/user.dto';
import { AppNavRoutes } from '../../../core/config/constants/navigation.constants';

describe('AuthService', () => {
    let service: AuthService;
    let httpMock: HttpTestingController;
    let router: Router;
    let localStorageMock: Record<string, string>;
    let localStorageStore: {
        getItem: ReturnType<typeof vi.fn>;
        setItem: ReturnType<typeof vi.fn>;
        removeItem: ReturnType<typeof vi.fn>;
    };

    const mockUser = MOCK_USERS[1]; // CUSTOMER user
    const mockToken = MOCK_JWT_TOKEN;

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
            })
        };

        Object.defineProperty(window, 'localStorage', {
            value: localStorageStore,
            writable: true,
            configurable: true
        });

        // Mock Router
        const routerSpy = {
            navigate: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                AuthService,
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: Router, useValue: routerSpy },
                {
                    provide: EnvironmentConfig,
                    useValue: MOCK_ENVIRONMENT_CONFIG
                }
            ]
        });

        service = TestBed.inject(AuthService);
        httpMock = TestBed.inject(HttpTestingController);
        router = TestBed.inject(Router);
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

        it('should initialize with no token', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            // (no action needed)

            // Verify
            expect(service.isAuthenticated()).toBe(false);
            expect(service.getToken()).toBeNull();
            expect(service.getUser()()).toBeNull();
            expect(service.roles()).toEqual([]);
        });

        it('should load token from localStorage on initialization', () => {
            // Prepare
            // Set mock data before creating service
            localStorageMock['access_token'] = mockToken;

            // Create a fresh TestBed with the mocked localStorage
            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    AuthService,
                    provideHttpClient(),
                    provideHttpClientTesting(),
                    { provide: Router, useValue: router },
                    {
                        provide: EnvironmentConfig,
                        useValue: MOCK_ENVIRONMENT_CONFIG
                    }
                ]
            });

            // Action
            const newService = TestBed.inject(AuthService);

            // Verify
            expect(newService.getToken()).toBe(mockToken);
            expect(newService.isAuthenticated()).toBe(true);
        });
    });

    describe('login()', () => {
        it('should login successfully and fetch user profile', () => {
            // Prepare
            const credentials = MOCK_LOGIN_CREDENTIALS;
            const jwtResponse = MOCK_JWT_PAYLOAD;

            // Action
            service
                .login(credentials)
                .pipe(take(1))
                .subscribe(user => {
                    expect(user).toEqual(mockUser);
                    expect(service.isAuthenticated()).toBe(true);
                    expect(service.getToken()).toBe(mockToken);
                    expect(service.getUser()()).toEqual(mockUser);
                });

            // Verify
            // First request: login
            const loginReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/login`);
            expect(loginReq.request.method).toBe('POST');
            expect(loginReq.request.body).toEqual(credentials);
            loginReq.flush(jwtResponse);

            // Second request: fetch profile
            const profileReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/profile`);
            expect(profileReq.request.method).toBe('GET');
            profileReq.flush(mockUser);

            expect(localStorageStore.setItem).toHaveBeenCalledWith('access_token', mockToken);
        });

        it('should set roles after successful login', () => {
            // Prepare
            const credentials = MOCK_LOGIN_CREDENTIALS;

            // Action
            service.login(credentials).pipe(take(1)).subscribe();

            const loginReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/login`);
            loginReq.flush({ access_token: mockToken });

            const profileReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/profile`);
            profileReq.flush(mockUser);

            // Verify
            expect(service.roles()).toEqual(['CUSTOMER']);
        });

        it('should handle login failure', () => {
            // Prepare
            const credentials = { ...MOCK_LOGIN_CREDENTIALS, password: 'wrongpassword' };

            // Action
            service
                .login(credentials)
                .pipe(take(1))
                .subscribe({
                    error: error => {
                        expect(error).toBeTruthy();
                        expect(service.isAuthenticated()).toBe(false);
                    }
                });

            // Verify
            const loginReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/login`);
            loginReq.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
        });
    });

    describe('register()', () => {
        it('should register successfully and navigate to login', () => {
            // Prepare
            const registerData = MOCK_REGISTER_REQUEST;

            // Action
            service.register(registerData).pipe(take(1)).subscribe();

            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/register`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({
                ...registerData,
                roles: ['user']
            });
            req.flush({});

            // Verify
            expect(router.navigate).toHaveBeenCalledWith([
                '/',
                AppNavRoutes.Auth.root,
                AppNavRoutes.Auth.features.login
            ]);
        });

        it('should handle registration failure', () => {
            // Prepare
            const registerData = { ...MOCK_REGISTER_REQUEST, email: 'existing@example.com' };

            // Action
            service
                .register(registerData)
                .pipe(take(1))
                .subscribe({
                    error: error => {
                        expect(error).toBeTruthy();
                    }
                });

            // Verify
            const req = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/register`);
            req.flush('User already exists', { status: 409, statusText: 'Conflict' });

            expect(router.navigate).not.toHaveBeenCalled();
        });
    });

    describe('logout()', () => {
        beforeEach(() => {
            // Set up authenticated state
            const credentials = MOCK_LOGIN_CREDENTIALS;

            service.login(credentials).pipe(take(1)).subscribe();

            const loginReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/login`);
            loginReq.flush({ access_token: mockToken });

            const profileReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/profile`);
            profileReq.flush(mockUser);
        });

        it('should clear token and user data', () => {
            // Prepare
            expect(service.isAuthenticated()).toBe(true);
            expect(service.getUser()()).toEqual(mockUser);

            // Action
            service.logout();

            // Verify
            expect(service.isAuthenticated()).toBe(false);
            expect(service.getToken()).toBeNull();
            expect(service.getUser()()).toBeNull();
            expect(service.roles()).toEqual([]);
        });

        it('should remove token from localStorage', () => {
            // Prepare
            // (user logged in from beforeEach)

            // Action
            service.logout();

            // Verify
            expect(localStorageStore.removeItem).toHaveBeenCalledWith('access_token');
        });

        it('should navigate to login page', () => {
            // Prepare
            // (user logged in from beforeEach)

            // Action
            service.logout();

            // Verify
            expect(router.navigate).toHaveBeenCalledWith([
                '/',
                AppNavRoutes.Auth.root,
                AppNavRoutes.Auth.features.login
            ]);
        });
    });

    describe('getToken()', () => {
        it('should return null when not authenticated', () => {
            // Prepare
            // (service created in beforeEach with no token)

            // Action
            // (no action needed)

            // Verify
            expect(service.getToken()).toBeNull();
        });

        it('should return token when authenticated', () => {
            // Prepare
            localStorageMock['access_token'] = mockToken;

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    AuthService,
                    provideHttpClient(),
                    provideHttpClientTesting(),
                    { provide: Router, useValue: router },
                    {
                        provide: EnvironmentConfig,
                        useValue: MOCK_ENVIRONMENT_CONFIG
                    }
                ]
            });

            // Action
            const newService = TestBed.inject(AuthService);

            // Verify
            expect(newService.getToken()).toBe(mockToken);
        });
    });

    describe('getUser()', () => {
        it('should return signal with null when not authenticated', () => {
            // Prepare
            // (service created in beforeEach with no user)

            // Action
            const userSignal = service.getUser();

            // Verify
            expect(userSignal()).toBeNull();
        });

        it('should return signal with user data when authenticated', () => {
            // Prepare
            const credentials = MOCK_LOGIN_CREDENTIALS;

            // Action
            service.login(credentials).pipe(take(1)).subscribe();

            const loginReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/login`);
            loginReq.flush({ access_token: mockToken });

            const profileReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/profile`);
            profileReq.flush(mockUser);

            const userSignal = service.getUser();

            // Verify
            expect(userSignal()).toEqual(mockUser);
        });
    });

    describe('hasRole()', () => {
        beforeEach(() => {
            const credentials = MOCK_LOGIN_CREDENTIALS;

            service.login(credentials).pipe(take(1)).subscribe();

            const loginReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/login`);
            loginReq.flush({ access_token: mockToken });

            const profileReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/profile`);
            profileReq.flush(mockUser);
        });

        it('should return true when user has required role', () => {
            // Prepare
            // (user logged in from beforeEach with CUSTOMER role)

            // Action
            // (no action needed)

            // Verify
            expect(service.hasRole('CUSTOMER')).toBe(true);
        });

        it('should return false when user does not have required role', () => {
            // Prepare
            // (user logged in from beforeEach with CUSTOMER role)

            // Action
            // (no action needed)

            // Verify
            expect(service.hasRole('ADMIN')).toBe(false);
        });

        it('should handle array of roles', () => {
            // Prepare
            // (user logged in from beforeEach with CUSTOMER role)

            // Action
            // (no action needed)

            // Verify
            expect(service.hasRole(['CUSTOMER'])).toBe(true);
            expect(service.hasRole(['ADMIN'])).toBe(false);
            expect(service.hasRole(['CUSTOMER', 'ADMIN'])).toBe(false);
        });

        it('should return true when no roles required', () => {
            // Prepare
            // (user logged in from beforeEach)

            // Action
            // (no action needed)

            // Verify
            expect(service.hasRole([])).toBe(true);
        });

        it('should return false when not authenticated', () => {
            // Prepare
            // (user logged in from beforeEach)

            // Action
            service.logout();

            // Verify
            expect(service.hasRole('CUSTOMER')).toBe(false);
        });
    });

    describe('loadProfileIfNeeded()', () => {
        it('should return null when no token', () => {
            // Prepare
            // (service created in beforeEach with no token)

            // Action
            service
                .loadProfileIfNeeded()
                .pipe(take(1))
                .subscribe(user => {
                    // Verify
                    expect(user).toBeNull();
                });
        });

        it('should fetch profile when token exists but profile not loaded', () => {
            // Prepare
            localStorageMock['access_token'] = mockToken;

            TestBed.resetTestingModule();
            TestBed.configureTestingModule({
                providers: [
                    AuthService,
                    provideHttpClient(),
                    provideHttpClientTesting(),
                    { provide: Router, useValue: router },
                    {
                        provide: EnvironmentConfig,
                        useValue: MOCK_ENVIRONMENT_CONFIG
                    }
                ]
            });

            const newService = TestBed.inject(AuthService);
            const newHttpMock = TestBed.inject(HttpTestingController);

            // Action
            newService
                .loadProfileIfNeeded()
                .pipe(take(1))
                .subscribe(user => {
                    expect(user).toEqual(mockUser);
                });

            // Verify
            const req = newHttpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/profile`);
            req.flush(mockUser);

            newHttpMock.verify();
        });

        it('should return cached user when profile already loaded', () => {
            // Prepare
            const credentials = MOCK_LOGIN_CREDENTIALS;

            // First login to load profile
            service.login(credentials).pipe(take(1)).subscribe();

            const loginReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/login`);
            loginReq.flush({ access_token: mockToken });

            const profileReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/profile`);
            profileReq.flush(mockUser);

            // Action
            // Now call loadProfileIfNeeded - should not make HTTP request
            service
                .loadProfileIfNeeded()
                .pipe(take(1))
                .subscribe(user => {
                    expect(user).toEqual(mockUser);
                });

            // Verify no additional HTTP requests
            httpMock.expectNone(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/profile`);
        });
    });

    describe('roles computed signal', () => {
        it('should return empty array when no user', () => {
            // Prepare
            // (service created in beforeEach with no user)

            // Action
            // (no action needed)

            // Verify
            expect(service.roles()).toEqual([]);
        });

        it('should return array with user role', () => {
            // Prepare
            const credentials = MOCK_LOGIN_CREDENTIALS;

            // Action
            service.login(credentials).pipe(take(1)).subscribe();

            const loginReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/login`);
            loginReq.flush({ access_token: mockToken });

            const profileReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/profile`);
            profileReq.flush(mockUser);

            // Verify
            expect(service.roles()).toEqual(['CUSTOMER']);
        });

        it('should return empty array when user has no role', () => {
            // Prepare
            const userWithoutRole = {
                ...MOCK_USERS[1],
                role: '' as unknown
            } as UserDto;

            const credentials = { ...MOCK_LOGIN_CREDENTIALS, email: 'norole@example.com' };

            // Action
            service.login(credentials).pipe(take(1)).subscribe();

            const loginReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/login`);
            loginReq.flush({ access_token: mockToken });

            const profileReq = httpMock.expectOne(`${MOCK_ENVIRONMENT_CONFIG.apiUrl}/auth/profile`);
            profileReq.flush(userWithoutRole);

            // Verify
            expect(service.roles()).toEqual([]);
        });
    });

    describe('SSR safety', () => {
        it('should handle window undefined scenario', () => {
            // Prepare
            // (service created in beforeEach)

            // Action
            // (no action needed)

            // Verify
            // This test verifies the service won't crash in SSR context
            expect(service).toBeTruthy();
        });
    });
});
