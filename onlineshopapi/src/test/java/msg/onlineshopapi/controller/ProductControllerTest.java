package msg.onlineshopapi.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import msg.onlineshopapi.config.TestSecurityConfig;
import msg.onlineshopapi.dto.ProductCategoryDto;
import msg.onlineshopapi.dto.ProductRequestDto;
import msg.onlineshopapi.dto.ProductResponseDto;
import msg.onlineshopapi.dto.SupplierDto;
import msg.onlineshopapi.dto.mapper.ProductMapper;
import msg.onlineshopapi.exception.ResourceNotFoundException;
import msg.onlineshopapi.model.Product;
import msg.onlineshopapi.security.JwtService;
import msg.onlineshopapi.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@Import(TestSecurityConfig.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private ProductMapper productMapper;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    private final UUID laptopId = UUID.randomUUID();
    private final UUID categoryId = UUID.randomUUID();
    private final UUID supplierId = UUID.randomUUID();

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getAll_returnsProducts() throws Exception {
        Product laptop = Product.builder().id(laptopId).name("Laptop").build();
        ProductResponseDto dto = productResponse(laptopId, "Laptop");

        when(productService.findAll()).thenReturn(List.of(laptop));
        when(productMapper.toDto(laptop)).thenReturn(dto);

        mockMvc.perform(get("/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(laptopId.toString()))
                .andExpect(jsonPath("$[0].name").value("Laptop"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getById_returnsProduct_whenFound() throws Exception {
        Product laptop = Product.builder().id(laptopId).name("Laptop").build();
        ProductResponseDto dto = productResponse(laptopId, "Laptop");

        when(productService.findById(laptopId)).thenReturn(Optional.of(laptop));
        when(productMapper.toDto(laptop)).thenReturn(dto);

        mockMvc.perform(get("/products/{id}", laptopId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(laptopId.toString()))
                .andExpect(jsonPath("$.name").value("Laptop"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void getById_returns404_whenNotFound() throws Exception {
        when(productService.findById(laptopId)).thenReturn(Optional.empty());

        mockMvc.perform(get("/products/{id}", laptopId))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_returnsProduct_whenAdmin() throws Exception {
        ProductRequestDto request = ProductRequestDto.builder()
                .name("Laptop").price(BigDecimal.valueOf(999.99)).categoryId(categoryId).supplierId(supplierId).build();
        Product entity = Product.builder().name("Laptop").build();
        Product saved = Product.builder().id(laptopId).name("Laptop").build();
        ProductResponseDto dto = productResponse(laptopId, "Laptop");

        when(productMapper.toEntity(any(ProductRequestDto.class))).thenReturn(entity);
        when(productService.save(entity)).thenReturn(saved);
        when(productMapper.toDto(saved)).thenReturn(dto);

        mockMvc.perform(post("/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(laptopId.toString()))
                .andExpect(jsonPath("$.name").value("Laptop"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void create_returns403_whenNotAdmin() throws Exception {
        ProductRequestDto request = ProductRequestDto.builder()
                .name("Laptop").price(BigDecimal.valueOf(999.99)).categoryId(categoryId).build();

        mockMvc.perform(post("/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void update_returnsProduct_whenAdmin() throws Exception {
        ProductRequestDto request = ProductRequestDto.builder()
                .name("Updated Laptop").price(BigDecimal.valueOf(1099.99)).categoryId(categoryId).supplierId(supplierId).build();
        Product entity = Product.builder().name("Updated Laptop").build();
        Product updated = Product.builder().id(laptopId).name("Updated Laptop").build();
        ProductResponseDto dto = productResponse(laptopId, "Updated Laptop");

        when(productMapper.toEntity(any(ProductRequestDto.class))).thenReturn(entity);
        when(productService.update(eq(laptopId), eq(entity))).thenReturn(updated);
        when(productMapper.toDto(updated)).thenReturn(dto);

        mockMvc.perform(put("/products/{id}", laptopId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Laptop"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void update_returns404_whenProductNotFound() throws Exception {
        ProductRequestDto request = ProductRequestDto.builder()
                .name("Laptop").price(BigDecimal.valueOf(999.99)).categoryId(categoryId).build();
        Product entity = Product.builder().name("Laptop").build();

        when(productMapper.toEntity(any(ProductRequestDto.class))).thenReturn(entity);
        when(productService.update(eq(laptopId), eq(entity)))
                .thenThrow(new ResourceNotFoundException("Product not found with id: " + laptopId));

        mockMvc.perform(put("/products/{id}", laptopId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Product not found with id: " + laptopId));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void update_returns403_whenNotAdmin() throws Exception {
        ProductRequestDto request = ProductRequestDto.builder()
                .name("Laptop").price(BigDecimal.valueOf(999.99)).categoryId(categoryId).build();

        mockMvc.perform(put("/products/{id}", laptopId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void delete_returns204_whenAdmin() throws Exception {
        doNothing().when(productService).deleteById(laptopId);

        mockMvc.perform(delete("/products/{id}", laptopId))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void delete_returns403_whenNotAdmin() throws Exception {
        mockMvc.perform(delete("/products/{id}", laptopId))
                .andExpect(status().isForbidden());
    }

    private ProductResponseDto productResponse(UUID id, String name) {
        return ProductResponseDto.builder()
                .id(id)
                .name(name)
                .price(BigDecimal.valueOf(999.99))
                .category(ProductCategoryDto.builder().id(categoryId).name("Electronics").build())
                .supplier(SupplierDto.builder().id(supplierId).name("TechWorld Distribution").build())
                .build();
    }
}
