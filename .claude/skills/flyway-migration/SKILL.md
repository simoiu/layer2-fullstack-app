---
name: flyway-migration
description: Generates Flyway SQL migration files (schema DDL and local mock data) from JPA entity changes. Use when adding or modifying JPA entities or creating database schema migrations. Detects entity changes via git diff, produces versioned schema and mock data SQL files, and validates migrations by running Spring Boot.
---

# Flyway Migration Generator

Generate Flyway migration files for schema changes and local mock data based on JPA entity changes in this project.

## Usage

Use this skill whenever:
- A new entity is added to `onlineshopapi/src/main/java/msg/onlineshopapi/model/`
- An existing entity's fields, relationships, or constraints are modified
- The user asks to create a Flyway migration

## Workflow

### 1. Get the diff

Compare current branch against target branch (default: main):
```bash
git --no-pager diff target-branch...HEAD
```

Focus on changes in `onlineshopapi/src/main/java/msg/onlineshopapi/model/` to identify JPA entity modifications.

### 2. Detect the change

Read the changed entity file(s) in `onlineshopapi/src/main/java/msg/onlineshopapi/model/`. Compare the JPA annotations and field definitions against the current schema to determine what SQL operations are needed.

To understand the current schema, read the existing migrations in order:
- `onlineshopapi/src/main/resources/db/migration/V1__create_tables.sql` (and any subsequent `V*` files)

### 3. Determine the next version number

List files in `onlineshopapi/src/main/resources/db/migration/` to find the highest existing version. Increment by 1 for the new migration.

Naming convention: `V{N}__{description}.sql` (two underscores between version and description).

Examples:
- `V2__add_reviews_table.sql`
- `V3__add_status_to_orders.sql`
- `V4__drop_weight_from_products.sql`

### 4. Write the schema migration

Create the migration file in `onlineshopapi/src/main/resources/db/migration/`.

Follow these SQL conventions:

- PostgreSQL dialect - use `UUID`, `VARCHAR(n)`, `DECIMAL(p,s)`, `DOUBLE PRECISION`, `TIMESTAMP`, `INTEGER`, `BOOLEAN`, `TEXT`
- Uppercase SQL keywords - `CREATE TABLE`, `ALTER TABLE`, `NOT NULL`, `PRIMARY KEY`, `REFERENCES`
- Lowercase identifiers - table and column names in `snake_case`
- Inline foreign keys for simple single-column references: `column_name UUID NOT NULL REFERENCES other_table (id)`
- Composite primary keys via `PRIMARY KEY (col_a, col_b)` at end of `CREATE TABLE`

#### JPA-to-SQL mapping rules

| JPA annotation / type                                                | SQL output                                                  |
|----------------------------------------------------------------------|-------------------------------------------------------------|
| `@Id @GeneratedValue(strategy = GenerationType.UUID)` + `UUID` field | `id UUID PRIMARY KEY`                                       |
| `@EmbeddedId` (composite key)                                        | Declare columns individually + `PRIMARY KEY (col_a, col_b)` |
| `String`                                                             | `VARCHAR(255)` (adjust length if `@Column(length=N)`)       |
| `BigDecimal`                                                         | `DECIMAL(10, 2)`                                            |
| `Double` / `double`                                                  | `DOUBLE PRECISION`                                          |
| `Integer` / `int`                                                    | `INTEGER`                                                   |
| `Boolean` / `boolean`                                                | `BOOLEAN`                                                   |
| `LocalDateTime`                                                      | `TIMESTAMP`                                                 |
| `@ManyToOne` + `@JoinColumn(name = "fk_col")`                        | `fk_col UUID [NOT NULL] REFERENCES target_table (id)`       |
| `@Embedded`                                                          | Flatten fields from the embeddable class into the table     |
| `@Enumerated(EnumType.STRING)`                                       | `VARCHAR(50)` (or appropriate length)                       |
| `@Column(nullable = false)`                                          | Add `NOT NULL`                                              |
| `@Column(unique = true)`                                             | Add `UNIQUE`                                                |

#### Operation patterns

Add column:
```sql
ALTER TABLE table_name ADD COLUMN column_name TYPE [NOT NULL] [DEFAULT value];
```

Add column with foreign key:
```sql
ALTER TABLE table_name ADD COLUMN column_name UUID REFERENCES other_table (id);
```

Drop column:
```sql
ALTER TABLE table_name DROP COLUMN column_name;
```

Create table - follow the exact formatting from `V1__create_tables.sql`: aligned columns, constraints inline.

Rename column:
```sql
ALTER TABLE table_name RENAME COLUMN old_name TO new_name;
```

Add constraint:
```sql
ALTER TABLE table_name ADD CONSTRAINT constraint_name UNIQUE (column_name);
```

If adding a `NOT NULL` column to a table that already has data, provide a `DEFAULT` value.

### 5. Write the mock data migration

Create or update a mock data file in `onlineshopapi/src/main/resources/db/migration/local/`.

Determine the next local version by listing existing files in the `local/` directory. The local mock data uses dot-versions under the schema migration version (e.g., if schema is `V2`, mock data is `V2.1`).

Naming convention: `V{N}.1__{description}.sql`

Examples:
- `V2.1__populate_reviews.sql`
- `V3.1__populate_order_status.sql`

Follow these mock data conventions:
- Insert 2-3 realistic rows with varied data
- Maintain referential integrity - use UUIDs from existing mock data when referencing other tables
- Use multi-row VALUES syntax for compactness:
  ```sql
  INSERT INTO table_name (col1, col2, col3)
  VALUES ('val1a', 'val2a', 'val3a'),
         ('val1b', 'val2b', 'val3b');
  ```

### 6. Validate the migration

After creating the migration files, validate them by starting the Spring Boot application, which will automatically run Flyway migrations:

```bash
cd onlineshopapi
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

Watch the console output for:
- `Flyway Community Edition X.X.X by Redgate`
- `Migrating schema "onlineshop" to version "X.X"`
- `Successfully applied X migrations`

## Error Handling

### 1. No entity changes found
If the git diff contains no changes under `onlineshopapi/src/main/java/msg/onlineshopapi/model/`, inform the user that no JPA entity modifications were detected.

### 2. Target branch does not exist
If the git diff command fails because the target branch is not found, list available branches with `git branch -a` and ask the user to specify a valid target branch.

### 3. Unmapped JPA type
If an entity field uses a Java type or JPA annotation not covered in the JPA-to-SQL mapping table, stop and ask the user to confirm the desired SQL type before writing the migration.

### 4. Validation failure
If `mvn spring-boot:run` fails during validation:
1. Read the error output and identify the root cause (syntax error, constraint violation, missing reference, etc.)
2. If the error is related to the new Flyway migration, fix the generated migration SQL, run `mvn flyway:repair` or inform the user to adjust `flyway_schema_history`. Re-run the validation.
3. If the error is more general, and it is related to the Maven execution, adjust the start command and re-try.