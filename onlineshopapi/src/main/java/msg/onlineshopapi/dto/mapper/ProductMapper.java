package msg.onlineshopapi.dto.mapper;

import lombok.RequiredArgsConstructor;
import msg.onlineshopapi.dto.ProductRequestDto;
import msg.onlineshopapi.dto.ProductResponseDto;
import msg.onlineshopapi.model.Product;
import msg.onlineshopapi.model.ProductCategory;
import msg.onlineshopapi.model.Supplier;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProductMapper {

    private final ProductCategoryMapper productCategoryMapper;
    private final SupplierMapper supplierMapper;

    public ProductResponseDto toDto(Product product) {
        return ProductResponseDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .weight(product.getWeight())
                .imageUrl(product.getImageUrl())
                .category(productCategoryMapper.toDto(product.getCategory()))
                .supplier(product.getSupplier() != null ? supplierMapper.toDto(product.getSupplier()) : null)
                .build();
    }

    public Product toEntity(ProductRequestDto dto) {
        return Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .weight(dto.getWeight())
                .imageUrl(dto.getImageUrl())
                .category(ProductCategory.builder().id(dto.getCategoryId()).build())
                .supplier(dto.getSupplierId() != null ? Supplier.builder().id(dto.getSupplierId()).build() : null)
                .build();
    }
}
