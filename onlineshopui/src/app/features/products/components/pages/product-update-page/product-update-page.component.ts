import { Component, OnInit, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { CardComponent } from '../../../../../clib/components/card/card.component';
import { SpinnerComponent } from '../../../../../clib/components/spinner/spinner.component';
import { ProductFormComponent } from '../../views/product-form/product-form.component';
import { ProductService } from '../../../services/product.service';
import { SupplierService } from '../../../services/supplier.service';
import { createProductForm } from '../../../utils/product-form.utils';
import { AppNavRoutes } from '../../../../../core/config/constants/navigation.constants';
import { NotificationsService } from '../../../../../core/services/notifications.service';

@Component({
    selector: 'app-product-update-page',
    standalone: true,
    imports: [CardComponent, SpinnerComponent, ProductFormComponent],
    templateUrl: './product-update-page.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductUpdatePageComponent implements OnInit {
    private readonly productService = inject(ProductService);
    private readonly supplierService = inject(SupplierService);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly notificationsService = inject(NotificationsService);

    readonly form = createProductForm();
    readonly product = this.productService.selectedProduct;
    readonly categories = this.productService.categories;
    readonly suppliers = this.supplierService.suppliers;
    readonly loading = this.productService.loading;
    readonly error = this.productService.error;
    readonly isSubmitting = signal(false);
    private readonly productId = signal<string | null>(null);

    constructor() {
        effect(() => {
            const prod = this.product();
            if (prod) {
                this.form.patchValue({
                    name: prod.name,
                    description: prod.description,
                    price: prod.price,
                    weight: prod.weight,
                    imageUrl: prod.imageUrl,
                    categoryId: prod.category.id,
                    supplierId: prod.supplier?.id ?? ''
                });
            }
        });

        effect(() => {
            const disabled = this.isSubmitting();
            if (disabled) {
                this.form.disable();
            } else {
                this.form.enable();
            }
        });
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.productId.set(id);
            this.productService.loadById(id).pipe(take(1)).subscribe();
            this.productService.loadCategories().pipe(take(1)).subscribe();
            this.supplierService.loadAll().pipe(take(1)).subscribe();
        } else {
            this.router.navigate([
                `/${AppNavRoutes.Products.root}/${AppNavRoutes.Products.features.overview}`
            ]);
        }
    }

    onSubmit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const id = this.productId();
        if (!id) return;

        const formValue = this.form.getRawValue();
        const productData = {
            name: formValue.name,
            description: formValue.description,
            price: formValue.price,
            weight: formValue.weight,
            imageUrl: formValue.imageUrl,
            categoryId: formValue.categoryId,
            supplierId: formValue.supplierId
        };

        this.isSubmitting.set(true);
        this.productService
            .update(id, productData)
            .pipe(take(1))
            .subscribe({
                next: () => {
                    this.isSubmitting.set(false);
                    this.notificationsService.notifySuccess({
                        title: 'Product updated',
                        message: 'Changes have been saved.'
                    });
                    this.router.navigate([
                        `/${AppNavRoutes.Products.root}/${AppNavRoutes.Products.features.overview}`
                    ]);
                },
                error: err => {
                    console.error('Failed to update product:', err);
                    this.notificationsService.notifyError({
                        title: 'Update failed',
                        message: 'Unable to save changes.'
                    });
                    this.isSubmitting.set(false);
                }
            });
    }

    onCancel(): void {
        this.router.navigate([
            `/${AppNavRoutes.Products.root}/${AppNavRoutes.Products.features.overview}`
        ]);
    }

    retry(): void {
        const id = this.productId();
        if (id) {
            this.productService.loadById(id).pipe(take(1)).subscribe();
            this.productService.loadCategories().pipe(take(1)).subscribe();
            this.supplierService.loadAll().pipe(take(1)).subscribe();
        }
    }
}
