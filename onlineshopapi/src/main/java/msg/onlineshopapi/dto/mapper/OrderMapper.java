package msg.onlineshopapi.dto.mapper;

import lombok.RequiredArgsConstructor;
import msg.onlineshopapi.dto.OrderDetailResponseDto;
import msg.onlineshopapi.dto.OrderRequestDto;
import msg.onlineshopapi.dto.OrderResponseDto;
import msg.onlineshopapi.model.Order;
import msg.onlineshopapi.model.OrderDetail;
import msg.onlineshopapi.model.Product;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OrderMapper {

    private final OrderDetailMapper orderDetailMapper;
    private final AddressMapper addressMapper;

    public OrderResponseDto toDto(Order order) {
        List<OrderDetailResponseDto> details = order.getOrderDetails().stream()
                .map(orderDetailMapper::toDto)
                .toList();

        return OrderResponseDto.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .createdAt(order.getCreatedAt())
                .address(order.getAddress() != null ? addressMapper.toDto(order.getAddress()) : null)
                .details(details)
                .build();
    }

    public Order toEntity(OrderRequestDto dto) {
        Set<OrderDetail> details = dto.getItems().stream()
                .map(item -> OrderDetail.builder()
                        .product(Product.builder().id(item.getProductId()).build())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toSet());

        return Order.builder()
                .address(addressMapper.toEntity(dto.getAddress()))
                .orderDetails(details)
                .build();
    }
}
