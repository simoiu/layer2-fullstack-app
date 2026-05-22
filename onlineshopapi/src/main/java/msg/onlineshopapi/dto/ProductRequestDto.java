package msg.onlineshopapi.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequestDto {

    private String name;
    private String description;
    private BigDecimal price;
    private Double weight;
    private String imageUrl;
    private UUID categoryId;
    private UUID supplierId;
}
