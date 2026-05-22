package msg.onlineshopapi.integration;

import msg.onlineshopapi.exception.OrderNotProcessableException;
import msg.onlineshopapi.model.Address;
import msg.onlineshopapi.model.Location;
import msg.onlineshopapi.model.Order;
import msg.onlineshopapi.model.OrderDetail;
import msg.onlineshopapi.model.Product;
import msg.onlineshopapi.model.ProductCategory;
import msg.onlineshopapi.model.Stock;
import msg.onlineshopapi.model.StockId;
import msg.onlineshopapi.model.User;
import msg.onlineshopapi.model.UserRole;
import msg.onlineshopapi.repository.LocationRepository;
import msg.onlineshopapi.repository.OrderDetailRepository;
import msg.onlineshopapi.repository.OrderRepository;
import msg.onlineshopapi.repository.ProductCategoryRepository;
import msg.onlineshopapi.repository.ProductRepository;
import msg.onlineshopapi.repository.StockRepository;
import msg.onlineshopapi.repository.UserRepository;
import msg.onlineshopapi.service.OrderService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
class OrderServiceTest {

    private static final String POSTGRES_IMAGE = "postgres:18";

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(POSTGRES_IMAGE);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private OrderService orderService;

    @Autowired
    private ProductCategoryRepository productCategoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private StockRepository stockRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderDetailRepository orderDetailRepository;

    @Autowired
    private OrderRepository orderRepository;

    private static final Address TEST_ADDRESS = Address.builder()
            .country("Romania").city("Cluj-Napoca").county("Cluj").streetAddress("Str. Observatorului 72")
            .build();

    private Product laptop;
    private Location location;
    private User user;
    private StockId stockId;

    @BeforeEach
    void setUp() {
        ProductCategory category = new ProductCategory();
        category.setName("Electronics");
        category = productCategoryRepository.save(category);

        laptop = Product.builder()
                .name("Laptop")
                .price(BigDecimal.valueOf(999.99))
                .category(category)
                .build();
        laptop = productRepository.save(laptop);

        location = new Location();
        location.setName("Warehouse A");
        location = locationRepository.save(location);

        user = User.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@test.com")
                .password("encodedPassword")
                .role(UserRole.CUSTOMER)
                .build();
        user = userRepository.save(user);

        stockId = new StockId();
        stockId.setProductId(laptop.getId());
        stockId.setLocationId(location.getId());
    }

    @AfterEach
    void cleanUp() {
        orderDetailRepository.deleteAllInBatch();
        orderRepository.deleteAllInBatch();
        stockRepository.deleteAllInBatch();
        productRepository.deleteAllInBatch();
        userRepository.deleteAllInBatch();
        locationRepository.deleteAllInBatch();
        productCategoryRepository.deleteAllInBatch();
    }

    @Test
    void createOrder_succeeds_whenStockIsSufficient() {
        stockRepository.save(Stock.builder()
                .id(stockId)
                .product(laptop)
                .location(location)
                .quantity(10)
                .build());

        OrderDetail detail = OrderDetail.builder()
                .product(laptop)
                .quantity(3)
                .build();
        Order order = Order.builder()
                .address(TEST_ADDRESS)
                .orderDetails(new HashSet<>(Set.of(detail)))
                .build();

        Order result = orderService.createOrder(order, user.getEmail());

        assertThat(result.getId()).isNotNull();
        assertThat(result.getUser().getEmail()).isEqualTo(user.getEmail());
        assertThat(result.getOrderDetails()).hasSize(1);

        Stock updatedStock = stockRepository.findById(stockId).orElseThrow();
        assertThat(updatedStock.getQuantity()).isEqualTo(7);
    }

    @Test
    void createOrder_throwsOrderNotProcessableException_whenStockIsInsufficient() {
        stockRepository.save(Stock.builder()
                .id(stockId)
                .product(laptop)
                .location(location)
                .quantity(2)
                .build());

        OrderDetail detail = OrderDetail.builder()
                .product(laptop)
                .quantity(5)
                .build();
        Order order = Order.builder()
                .address(TEST_ADDRESS)
                .orderDetails(new HashSet<>(Set.of(detail)))
                .build();

        assertThatThrownBy(() -> orderService.createOrder(order, user.getEmail()))
                .isInstanceOf(OrderNotProcessableException.class);
    }

    @Test
    void createOrder_succeeds_withMultipleProducts() {
        ProductCategory category = productCategoryRepository.findAll().getFirst();

        Product mouse = Product.builder()
                .name("Mouse")
                .price(BigDecimal.valueOf(29.99))
                .category(category)
                .build();
        mouse = productRepository.save(mouse);

        StockId mouseStockId = new StockId();
        mouseStockId.setProductId(mouse.getId());
        mouseStockId.setLocationId(location.getId());

        stockRepository.save(Stock.builder()
                .id(stockId)
                .product(laptop)
                .location(location)
                .quantity(10)
                .build());
        stockRepository.save(Stock.builder()
                .id(mouseStockId)
                .product(mouse)
                .location(location)
                .quantity(5)
                .build());

        OrderDetail laptopDetail = OrderDetail.builder()
                .product(laptop)
                .quantity(2)
                .build();
        OrderDetail mouseDetail = OrderDetail.builder()
                .product(mouse)
                .quantity(3)
                .build();
        Order order = Order.builder()
                .address(TEST_ADDRESS)
                .orderDetails(new HashSet<>(Set.of(laptopDetail, mouseDetail)))
                .build();

        Order result = orderService.createOrder(order, user.getEmail());

        assertThat(result.getId()).isNotNull();
        assertThat(result.getOrderDetails()).hasSize(2);

        Stock updatedLaptopStock = stockRepository.findById(stockId).orElseThrow();
        Stock updatedMouseStock = stockRepository.findById(mouseStockId).orElseThrow();
        assertThat(updatedLaptopStock.getQuantity()).isEqualTo(8);
        assertThat(updatedMouseStock.getQuantity()).isEqualTo(2);
    }

    @Test
    void createOrder_throwsAndStockUnchanged_whenOneProductUnavailable() {
        ProductCategory category = productCategoryRepository.findAll().getFirst();

        Product keyboard = Product.builder()
                .name("Keyboard")
                .price(BigDecimal.valueOf(49.99))
                .category(category)
                .build();
        keyboard = productRepository.save(keyboard);

        StockId keyboardStockId = new StockId();
        keyboardStockId.setProductId(keyboard.getId());
        keyboardStockId.setLocationId(location.getId());

        stockRepository.save(Stock.builder()
                .id(stockId)
                .product(laptop)
                .location(location)
                .quantity(10)
                .build());
        stockRepository.save(Stock.builder()
                .id(keyboardStockId)
                .product(keyboard)
                .location(location)
                .quantity(1)
                .build());

        OrderDetail laptopDetail = OrderDetail.builder()
                .product(laptop)
                .quantity(2)
                .build();
        OrderDetail keyboardDetail = OrderDetail.builder()
                .product(keyboard)
                .quantity(5)
                .build();
        Order order = Order.builder()
                .address(TEST_ADDRESS)
                .orderDetails(new HashSet<>(Set.of(laptopDetail, keyboardDetail)))
                .build();

        assertThatThrownBy(() -> orderService.createOrder(order, user.getEmail()))
                .isInstanceOf(OrderNotProcessableException.class);

        Stock unchangedLaptopStock = stockRepository.findById(stockId).orElseThrow();
        Stock unchangedKeyboardStock = stockRepository.findById(keyboardStockId).orElseThrow();
        assertThat(unchangedLaptopStock.getQuantity()).isEqualTo(10);
        assertThat(unchangedKeyboardStock.getQuantity()).isEqualTo(1);
    }
}
