import { FormControl, FormGroup } from '@angular/forms';

export type ProductFormControls = {
    name: FormControl<string>;
    description: FormControl<string>;
    price: FormControl<number>;
    weight: FormControl<number>;
    categoryId: FormControl<string>;
    supplierId: FormControl<string>;
    imageUrl: FormControl<string>;
};

export type ProductFormGroup = FormGroup<ProductFormControls>;
