---
name: onboard-app
description: Interactive onboarding guide for the fullstack e-commerce application. Use this skill when the user asks for onboarding, wants to see how the app works, needs a demo of the online shop, or wants to test the full user flow. This skill guides users through starting the application stack (UI, backend, database) and then automates a complete user journey using browser automation - registration, login, product browsing, adding items to cart, and order creation. ALWAYS use this when users mention "onboard", "demo the app", "show me how it works", "test the user flow", or "walk me through the online shop".
---

# App Onboarding

This skill provides an interactive onboarding experience for the fullstack e-commerce application by guiding users through starting the services and automating a complete user journey through the application.

## Workflow

### Step 1: Guide User to Start Applications

Before automating anything, check if the applications are running. Ask the user to start the required services:

**Ask the user:**
> To begin the onboarding, please start these services:
>
> 1. **Database**: `cd docker/development && docker-compose up -d`
> 2. **Backend**: `cd onlineshopapi && mvn spring-boot:run -Dspring-boot.run.profiles=local`
> 3. **Frontend**: `cd onlineshopui && npm start`
>
> The frontend will be available at http://localhost:4200 and the backend at http://localhost:3000/api.
>
> Let me know when all services are running.

Wait for the user to confirm all services are up before proceeding.

### Step 2: Automated Browser Journey

Once services are confirmed running, use the Chrome DevTools MCP to automate the complete user flow. For each major step, take a screenshot and create an accompanying .txt file with a concise explanation.

**Test User Credentials** (use these throughout):
- Email: `onboarduser@example.com`
- First Name: `onboarduser`
- Last Name: `onboarduser`
- Password: `onboarduser`

**Automated Flow:**

#### 2.1: Open Browser and Navigate to App
- Use `mcp__chrome-devtools__new_page` to create a new browser page
- Use `mcp__chrome-devtools__navigate_page` to go to `http://localhost:4200`
- Take screenshot: `01-homepage.png`
- Create explanation: `01-homepage.txt` with text like "Application homepage showing the product catalog and navigation"

#### 2.2: Register New User
- Click the Register/Sign Up link or button (use `mcp__chrome-devtools__click`)
- Fill registration form using `mcp__chrome-devtools__fill_form` with:
  - Email: `onboarduser@example.com`
  - First Name: `onboarduser`
  - Last Name: `onboarduser`
  - Password: `onboarduser`
- Submit the form
- Take screenshot: `02-registration.png`
- Create explanation: `02-registration.txt` describing the registration success

#### 2.3: Login
- Navigate to login page if redirected elsewhere
- Fill login form using `mcp__chrome-devtools__fill_form` with:
  - Username/Email: `onboarduser@example.com`
  - Password: `onboarduser`
- Submit login
- Take screenshot: `03-login-success.png`
- Create explanation: `03-login-success.txt` describing successful authentication

#### 2.4: Browse Products
- Wait for product catalog to load (`mcp__chrome-devtools__wait_for` if needed)
- Take screenshot: `04-product-catalog.png`
- Create explanation: `04-product-catalog.txt` listing visible products and describing the catalog UI

#### 2.5: Navigate to Specific Product
- Click on a product card/link to view product details
- Wait for product detail page to load
- Take screenshot: `05-product-detail.png`
- Create explanation: `05-product-detail.txt` describing the product details shown (name, price, description, etc.)

#### 2.6: Add Product to Cart
- Click "Add to Cart" button (use `mcp__chrome-devtools__click`)
- Wait for confirmation or cart update
- Take screenshot: `06-add-to-cart.png`
- Create explanation: `06-add-to-cart.txt` confirming the item was added to cart

#### 2.7: Navigate to Cart
- Click cart icon or navigate to cart page
- Take screenshot: `07-cart-view.png`
- Create explanation: `07-cart-view.txt` showing cart contents with product and quantity

#### 2.8: Create Order
- Click checkout or "Create Order" button
- Complete any required checkout steps (shipping, payment info if applicable)
- Submit/confirm the order
- Take screenshot: `08-order-created.png`
- Create explanation: `08-order-created.txt` confirming order creation with order ID if visible

#### 2.9: View Orders Page
- Navigate to orders/order history page
- Take screenshot: `09-orders-page.png`
- Create explanation: `09-orders-page.txt` showing the newly created order in the order list

### Step 3: Summary

After completing all steps, provide a brief summary:
- Total steps completed
- Location of screenshots and explanations
- Note about the browser state (left open for exploration or closed)

## Error Handling

If any step fails:
- Take a screenshot of the error state
- Create an explanation file describing what went wrong
- Report the failure to the user with context
- Do not continue to subsequent steps if a critical step fails (e.g., login failure blocks all subsequent steps)

## Screenshot Naming Convention

Use sequential numbering with descriptive names:
- `01-homepage.png` / `01-homepage.txt`
- `02-registration.png` / `02-registration.txt`
- etc.

Store all screenshots and explanations in a timestamped directory like `onboarding-screenshots-YYYYMMDD-HHMMSS/` for organization.

## Notes

- Keep explanations in .txt files concise (1-3 sentences max)
- If the UI differs from expected (different button labels, layout changes), adapt the automation accordingly
- The Chrome DevTools MCP provides tools like `mcp__chrome-devtools__take_screenshot`, `mcp__chrome-devtools__click`, `mcp__chrome-devtools__fill_form`, `mcp__chrome-devtools__navigate_page`, `mcp__chrome-devtools__wait_for`
- Always verify elements are visible/loaded before interacting with them
- Use `mcp__chrome-devtools__take_snapshot` if you need to inspect the DOM structure to find correct selectors
