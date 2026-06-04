# Task: What pattern does the app use to pick which warehouse fulfills an order, and where is it configured?

## Work Transcript

### Step 1: Read SKILL.md
Read the skill at `.claude/skills/architecture-expert/SKILL.md`. The skill instructs reading `references/ARCHITECTURE.md` at the start of every session.

### Step 2: Read ARCHITECTURE.md reference
Read `.claude/skills/architecture-expert/references/ARCHITECTURE.md`. Found the "Order fulfillment strategy" section documenting the `OrderStrategy` interface and two implementations.

### Step 3: Read source files for ground truth
Read the following source files:
- `onlineshopapi/src/main/java/msg/onlineshopapi/service/strategy/OrderStrategy.java`
- `onlineshopapi/src/main/java/msg/onlineshopapi/service/strategy/OrderStrategyConfig.java`
- `onlineshopapi/src/main/java/msg/onlineshopapi/service/strategy/SingleLocationStrategy.java`
- `onlineshopapi/src/main/java/msg/onlineshopapi/service/strategy/MostAbundantStrategy.java`
- `onlineshopapi/src/main/resources/application.yml`

---

## Answer

The app uses the **Strategy pattern** for warehouse (fulfillment location) selection.

### The interface

```java
// msg.onlineshopapi.service.strategy.OrderStrategy
public interface OrderStrategy {
    List<Stock> findStocks(Set<OrderDetail> orderDetails);
}
```

`OrderService.createOrder` calls `orderStrategy.findStocks(orderDetails)` — it never knows which warehouse algorithm is active.

### The two implementations

| Class | Behavior |
|---|---|
| `SingleLocationStrategy` | Finds all warehouses that stock every product in the order, then picks the first one that meets all quantity requirements. If no single warehouse can fulfill the whole order, throws `OrderNotProcessableException`. |
| `MostAbundantStrategy` | For each product independently, picks the warehouse with the highest stock for that product. Products in the same order can ship from different warehouses. Also throws `OrderNotProcessableException` if no warehouse has enough stock for a given product. |

### Where it's configured

**`application.yml`** (line 29–30):

```yaml
app:
  order:
    strategy: SINGLE_LOCATION
```

Change the value to `MOST_ABUNDANT` to switch strategies. Both enum values are declared in `OrderStrategyConfig.Strategy`.

**`OrderStrategyConfig`** (`service/strategy/OrderStrategyConfig.java`) reads that property via `@Value("${app.order.strategy}")` and uses a `@Bean` factory method to instantiate and register the correct strategy:

```java
@Bean
public OrderStrategy orderStrategy() {
    if (orderStrategy == Strategy.MOST_ABUNDANT) {
        return new MostAbundantStrategy(stockRepository);
    }
    return new SingleLocationStrategy(stockRepository);
}
```

### Extension rule

Per the architectural rules: adding a new warehouse-selection behavior means adding a new `OrderStrategy` implementation class. Never add a conditional branch inside an existing strategy. Register the new bean in `OrderStrategyConfig` and add its enum value to `OrderStrategyConfig.Strategy`.

### File locations

| File | Path |
|---|---|
| Interface | `onlineshopapi/src/main/java/msg/onlineshopapi/service/strategy/OrderStrategy.java` |
| Strategy 1 | `onlineshopapi/src/main/java/msg/onlineshopapi/service/strategy/SingleLocationStrategy.java` |
| Strategy 2 | `onlineshopapi/src/main/java/msg/onlineshopapi/service/strategy/MostAbundantStrategy.java` |
| Config bean | `onlineshopapi/src/main/java/msg/onlineshopapi/service/strategy/OrderStrategyConfig.java` |
| Property | `onlineshopapi/src/main/resources/application.yml` → `app.order.strategy` |
