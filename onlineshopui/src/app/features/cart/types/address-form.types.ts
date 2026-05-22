import { FormControl, FormGroup } from '@angular/forms';

export type AddressFormControls = {
    country: FormControl<string>;
    city: FormControl<string>;
    county: FormControl<string>;
    streetAddress: FormControl<string>;
};

export type AddressFormGroup = FormGroup<AddressFormControls>;
