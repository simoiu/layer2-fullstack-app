import { FormControl, FormGroup, Validators } from '@angular/forms';

import { AddressFormGroup } from '../types/address-form.types';

export function createAddressForm(): AddressFormGroup {
    return new FormGroup({
        country: new FormControl<string>('', {
            nonNullable: true,
            validators: [Validators.required]
        }),
        city: new FormControl<string>('', {
            nonNullable: true,
            validators: [Validators.required]
        }),
        county: new FormControl<string>('', {
            nonNullable: true,
            validators: [Validators.required]
        }),
        streetAddress: new FormControl<string>('', {
            nonNullable: true,
            validators: [Validators.required]
        })
    });
}
