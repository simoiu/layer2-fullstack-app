package msg.onlineshopapi.dto.mapper;

import msg.onlineshopapi.dto.AddressDto;
import msg.onlineshopapi.model.Address;
import org.springframework.stereotype.Component;

@Component
public class AddressMapper {

    public AddressDto toDto(Address address) {
        return AddressDto.builder()
                .country(address.getCountry())
                .city(address.getCity())
                .county(address.getCounty())
                .streetAddress(address.getStreetAddress())
                .build();
    }

    public Address toEntity(AddressDto dto) {
        return Address.builder()
                .country(dto.getCountry())
                .city(dto.getCity())
                .county(dto.getCounty())
                .streetAddress(dto.getStreetAddress())
                .build();
    }
}
