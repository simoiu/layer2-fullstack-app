package msg.onlineshopapi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import msg.onlineshopapi.dto.OrderRequestDto;
import msg.onlineshopapi.dto.OrderResponseDto;
import msg.onlineshopapi.dto.mapper.OrderMapper;
import msg.onlineshopapi.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order management")
public class OrderController {

    private final OrderService orderService;
    private final OrderMapper orderMapper;

    @GetMapping
    @Operation(summary = "Get all orders", description = "Returns a list of all orders. Requires authentication.")
    @ApiResponse(responseCode = "200", description = "Orders retrieved successfully")
    public List<OrderResponseDto> getAll() {
        return orderService.findAll().stream()
                .map(orderMapper::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID", description = "Returns a single order by its ID. Requires authentication.")
    @ApiResponse(responseCode = "200", description = "Order found")
    @ApiResponse(responseCode = "404", description = "Order not found")
    public ResponseEntity<OrderResponseDto> getById(@Parameter(description = "Order ID") @PathVariable UUID id) {
        return orderService.findById(id)
                .map(orderMapper::toDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create an order", description = "Creates a new order for the authenticated user. Requires authentication.")
    @ApiResponse(responseCode = "201", description = "Order created successfully")
    @ApiResponse(responseCode = "400", description = "Invalid order data")
    public OrderResponseDto create(@RequestBody @Valid OrderRequestDto dto, Principal principal) {
        return orderMapper.toDto(orderService.createOrder(orderMapper.toEntity(dto), principal.getName()));
    }
}
