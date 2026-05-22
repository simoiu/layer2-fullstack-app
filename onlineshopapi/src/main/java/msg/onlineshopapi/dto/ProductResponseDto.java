package msg.onlineshopapi.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponseDto {

    private UUID id;
    private String name;
    private String description;
    private BigDecimal price;
    private Double weight;
    private ProductCategoryDto category;
    private SupplierDto supplier;
    private String imageUrl;
}
