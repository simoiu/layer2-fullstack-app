import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap, finalize, catchError, of, map } from 'rxjs';
import { SupplierDto } from '../../../core/types/dtos/supplier.dto';
import { EnvironmentConfig } from '../../../core/types/providers/environment-config';

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private readonly http = inject(HttpClient);
    private readonly environmentConfig = inject(EnvironmentConfig);
    private readonly suppliersUrl = `${this.environmentConfig.apiUrl}/suppliers`;

    private readonly _suppliers = signal<SupplierDto[]>([]);
    private readonly _loading = signal(false);

    readonly suppliers = this._suppliers.asReadonly();
    readonly loading = this._loading.asReadonly();

    loadAll(): Observable<void> {
        this._loading.set(true);

        return this.http.get<SupplierDto[]>(this.suppliersUrl).pipe(
            tap(suppliers => this._suppliers.set(suppliers)),
            catchError(() => {
                this._suppliers.set([]);
                return of([]);
            }),
            finalize(() => this._loading.set(false)),
            map(() => undefined)
        );
    }
}
