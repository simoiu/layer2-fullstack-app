# Warehouse Fulfillment Strategy

## Pattern: Strategy Pattern

The app uses the **Strategy design pattern** to decide which warehouse (called a "location" in the codebase) fulfills an order. The strategy is abstracted behind the `OrderStrategy` interface and injected into `OrderService`. Switching strategies requires only a config value change — no code changes.

---

## How It Works

### Interface

`onlineshopapi/src/main/java/msg/onlineshopapi/service/strategy/OrderStrategy.java`

```java
public interface OrderStrategy {
    List<Stock> findStocks(Set<OrderDetail> orderDetails);
}
```

`OrderService` calls `orderStrategy.findStocks(orderDetails)` to get a list of `Stock` records (each linking a product to a location/warehouse and a quantity). It then sets the `shippedFrom` field on each `OrderDetail` to whichever location was selected.

---

## Two Concrete Strategies

### 1. `SINGLE_LOCATION` (default)

**File:** `service/strategy/SingleLocationStrategy.java`

Tries to fulfill the entire order from **one single warehouse**. Steps:
1. Queries for all location IDs that have stock for **all** ordered products (`findLocationIdsHavingAllProducts`).
2. Among those candidates, selects the first location that also has sufficient quantity for every item.
3. Throws `OrderNotProcessableException` if no single location can satisfy the full order.

**Use case:** Minimizes the number of shipments — the customer receives everything from one place.

### 2. `MOST_ABUNDANT`

**File:** `service/strategy/MostAbundantStrategy.java`

Fulfills each ordered product **independently** from the warehouse that holds the most stock for that product. Steps:
1. For each product, queries for the location with the maximum quantity (`findMaxStockLocations`).
2. Each product can therefore come from a different warehouse.
3. Throws `OrderNotProcessableException` if the best-stocked location for any product still doesn't have enough to cover the ordered quantity.

**Use case:** Maximizes the chance of order fulfillment by spreading across warehouses.

---

## Configuration

The active strategy is selected by a single property in `application.yml`:

**File:** `onlineshopapi/src/main/resources/application.yml`

```yaml
app:
  order:
    strategy: SINGLE_LOCATION
```

The value is read in `OrderStrategyConfig` (`service/strategy/OrderStrategyConfig.java`) via `@Value("${app.order.strategy}")`. At startup, a Spring `@Bean` of type `OrderStrategy` is created based on this value:

```java
@Bean
public OrderStrategy orderStrategy() {
    if (orderStrategy == Strategy.MOST_ABUNDANT) {
        return new MostAbundantStrategy(stockRepository);
    }
    return new SingleLocationStrategy(stockRepository);  // default
}
```

To switch strategies, change the property to `MOST_ABUNDANT` (in `application.yml` or override it in `application-local.yml` for local dev). No code changes are needed.

---

## Summary

| Aspect | Detail |
|---|---|
| Pattern | Strategy (Gang of Four) |
| Interface | `OrderStrategy` in `service/strategy/` |
| Implementations | `SingleLocationStrategy`, `MostAbundantStrategy` |
| Factory / wiring | `OrderStrategyConfig` (`@Configuration` + `@Bean`) |
| Config property | `app.order.strategy` in `application.yml` |
| Default value | `SINGLE_LOCATION` |
| Consumer | `OrderService.createOrder()` |

---

## Work Transcript

Files examined to produce this answer:

1. `service/strategy/OrderStrategy.java` — interface definition
2. `service/strategy/OrderStrategyConfig.java` — `@Configuration` that reads the property and wires the correct bean
3. `service/strategy/SingleLocationStrategy.java` — single-warehouse fulfillment implementation
4. `service/strategy/MostAbundantStrategy.java` — per-product most-stocked-warehouse implementation
5. `service/OrderService.java` — confirmed the strategy is called at `orderStrategy.findStocks(orderDetails)` and that the resulting location is stored as `shippedFrom` on each `OrderDetail`
6. `repository/StockRepository.java` — JPQL queries backing each strategy (`findLocationIdsHavingAllProducts`, `findMaxStockLocations`)
7. `src/main/resources/application.yml` — confirmed `app.order.strategy: SINGLE_LOCATION` is the live default
8. `src/main/resources/application-local.yml` — confirmed no local override of the strategy property
