package msg.onlineshopapi.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressDto {

    @NotBlank
    private String country;

    @NotBlank
    private String city;

    @NotBlank
    private String county;

    @NotBlank
    private String streetAddress;
}
