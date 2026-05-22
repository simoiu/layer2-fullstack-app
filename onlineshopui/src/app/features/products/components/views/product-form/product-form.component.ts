import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ProductCategoryDto } from '../../../../../core/types/dtos/product.dto';
import { SupplierDto } from '../../../../../core/types/dtos/supplier.dto';
import { ProductFormGroup } from '../../../types/product-form.types';
import { ErrorMessageComponent } from '../../../../../clib/components/error-message/error-message.component';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [ReactiveFormsModule, ErrorMessageComponent],
    templateUrl: './product-form.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductFormComponent {
    form = input.required<ProductFormGroup>();
    categories = input.required<ProductCategoryDto[]>();
    suppliers = input.required<SupplierDto[]>();
    isSubmitting = input<boolean>(false);
    submitLabel = input<string>('Submit');

    formSubmit = output<void>();
    cancelled = output<void>();

    onSubmitClick(): void {
        this.formSubmit.emit();
    }

    onCancelClick(): void {
        this.cancelled.emit();
    }
}
