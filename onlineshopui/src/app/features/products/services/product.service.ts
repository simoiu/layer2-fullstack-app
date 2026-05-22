import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap, finalize, catchError, of, map } from 'rxjs';
import { ProductDto, ProductCategoryDto, CreateProductRequest, UpdateProductRequest } from '../../../core/types/dtos/product.dto';
import { EnvironmentConfig } from '../../../core/types/providers/environment-config';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private readonly http = inject(HttpClient);
    private readonly environmentConfig = inject(EnvironmentConfig);
    private readonly productsUrl = `${this.environmentConfig.apiUrl}/products`;
    private readonly categoriesUrl = `${this.environmentConfig.apiUrl}/products/categories`;

    private readonly _products = signal<ProductDto[]>([]);
    private readonly _selectedProduct = signal<ProductDto | null>(null);
    private readonly _categories = signal<ProductCategoryDto[]>([]);
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);

    readonly products = this._products.asReadonly();
    readonly selectedProduct = this._selectedProduct.asReadonly();
    readonly categories = this._categories.asReadonly();
    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();

    loadAll(): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return this.http.get<ProductDto[]>(this.productsUrl).pipe(
            tap(products => this._products.set(products)),
            tap(() => this._error.set(null)),
            catchError(() => {
                this._error.set('Failed to load products');
                return of([]);
            }),
            finalize(() => this._loading.set(false)),
            map(() => undefined)
        );
    }

    loadById(id: string): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return this.http.get<ProductDto>(`${this.productsUrl}/${id}`).pipe(
            tap(product => this._selectedProduct.set(product)),
            tap(() => this._error.set(null)),
            catchError(() => {
                this._error.set('Failed to load product');
                this._selectedProduct.set(null);
                return of(null);
            }),
            finalize(() => this._loading.set(false)),
            map(() => undefined)
        );
    }

    loadCategories(): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return this.http.get<ProductCategoryDto[]>(this.categoriesUrl).pipe(
            tap(categories => this._categories.set(categories)),
            tap(() => this._error.set(null)),
            catchError(() => {
                this._error.set('Failed to load categories');
                return of([]);
            }),
            finalize(() => this._loading.set(false)),
            map(() => undefined)
        );
    }

    create(data: CreateProductRequest): Observable<ProductDto> {
        return this.http.post<ProductDto>(this.productsUrl, data).pipe(
            tap(newProduct => {
                this._products.update(products => [...products, newProduct]);
            })
        );
    }

    update(id: string, data: UpdateProductRequest): Observable<ProductDto> {
        return this.http.put<ProductDto>(`${this.productsUrl}/${id}`, data).pipe(
            tap(updatedProduct => {
                this._products.update(products =>
                    products.map(p => (p.id === id ? updatedProduct : p))
                );
                if (this._selectedProduct()?.id === id) {
                    this._selectedProduct.set(updatedProduct);
                }
            })
        );
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.productsUrl}/${id}`).pipe(
            tap(() => {
                this._products.update(products => products.filter(p => p.id !== id));
                if (this._selectedProduct()?.id === id) {
                    this._selectedProduct.set(null);
                }
            })
        );
    }

    clearSelectedProduct(): void {
        this._selectedProduct.set(null);
    }
}
