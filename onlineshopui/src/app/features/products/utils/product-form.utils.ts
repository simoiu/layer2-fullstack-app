import { FormControl, Validators } from '@angular/forms';
import { ProductDto } from '../../../core/types/dtos/product.dto';
import { ProductFormGroup } from '../types/product-form.types';
import { FormGroup } from '@angular/forms';

export function createProductForm(product?: ProductDto): ProductFormGroup {
    return new FormGroup({
        name: new FormControl<string>(product?.name ?? '', {
            nonNullable: true,
            validators: [Validators.required, Validators.minLength(3)]
        }),
        description: new FormControl<string>(product?.description ?? '', {
            nonNullable: true,
            validators: [Validators.required]
        }),
        price: new FormControl<number>(product?.price ?? 0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)]
        }),
        weight: new FormControl<number>(product?.weight ?? 0, {
            nonNullable: true,
            validators: [Validators.required, Validators.min(0)]
        }),
        categoryId: new FormControl<string>(product?.category?.id ?? '', {
            nonNullable: true,
            validators: [Validators.required]
        }),
        supplierId: new FormControl<string>(product?.supplier?.id ?? '', {
            nonNullable: true,
            validators: [Validators.required]
        }),
        imageUrl: new FormControl<string>(product?.imageUrl ?? '', {
            nonNullable: true,
            validators: [Validators.required]
        })
    });
}
