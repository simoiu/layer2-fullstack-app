package msg.onlineshopapi.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import msg.onlineshopapi.dto.SupplierDto;
import msg.onlineshopapi.dto.mapper.SupplierMapper;
import msg.onlineshopapi.service.SupplierService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
@Tag(name = "Suppliers", description = "Supplier management")
public class SupplierController {

    private final SupplierService supplierService;
    private final SupplierMapper supplierMapper;

    @GetMapping
    @Operation(summary = "Get all suppliers", description = "Returns a list of all suppliers.")
    @ApiResponse(responseCode = "200", description = "Suppliers retrieved successfully")
    public List<SupplierDto> getAll() {
        return supplierService.findAll().stream()
                .map(supplierMapper::toDto)
                .toList();
    }
}
