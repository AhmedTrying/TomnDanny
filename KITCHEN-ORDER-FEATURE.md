# Kitchen Order Feature

## Overview

The Kitchen Order Feature allows cashiers to easily identify which orders require kitchen preparation versus those that can be served immediately (like drinks, pastries, etc.).

## Features

### 1. Visual Indicators

- **🍳 Kitchen Order Badge**: Orange animated badge that appears on orders containing kitchen items
- **Product-level Indicators**: Kitchen products are marked with 🍳 Kitchen badges in dropdowns
- **Dashboard Stats**: Separate counters for kitchen and non-kitchen pending orders

### 2. Where to See Kitchen Indicators

#### Live Orders Tab
- Orders with kitchen items display an orange "🍳 Kitchen Order" badge
- Located next to the table number, status, and dining type badges

#### Order History Tab
- Historical orders also show kitchen indicators for reference

#### Manual Order Creation
- Product dropdown shows 🍳 Kitchen badges for kitchen items
- Order summary shows kitchen indicator if any kitchen items are added
- Individual items in the cart show kitchen badges

#### Dashboard
- **Kitchen Orders Pending**: Shows count of pending orders with kitchen items
- **Non-Kitchen Orders Pending**: Shows count of pending orders without kitchen items

### 3. How It Works

The system determines kitchen orders by checking the `show_in_kitchen` field in the products table:

- Products with `show_in_kitchen: true` are considered kitchen items
- Products with `show_in_kitchen: false` are considered non-kitchen items
- An order is marked as a kitchen order if it contains at least one kitchen item

### 4. Benefits

1. **Clear Communication**: Cashiers immediately know which orders need kitchen preparation
2. **Better Workflow**: Helps prioritize orders and manage customer expectations
3. **Reduced Confusion**: Eliminates uncertainty about order preparation requirements
4. **Improved Customer Service**: Cashiers can inform customers about preparation times

### 5. Configuration

Kitchen items are configured in the Admin panel:
- Go to Admin → Products
- Toggle "Show in Kitchen Display" for each product
- Kitchen items will appear in the kitchen display and be marked in cashier interface

### 6. Examples

**Kitchen Items (show_in_kitchen: true):**
- Hot food items
- Items requiring cooking/preparation
- Custom-made beverages

**Non-Kitchen Items (show_in_kitchen: false):**
- Pre-made drinks
- Packaged snacks
- Items served directly from counter

## Technical Implementation

- Uses the existing `show_in_kitchen` field from the products table
- Fetches kitchen product IDs on component mount
- Checks each order's items against kitchen product IDs
- Displays visual indicators based on the check results
- Updates in real-time as orders change

## Future Enhancements

Potential improvements could include:
- Separate preparation time estimates for kitchen vs non-kitchen orders
- Different notification sounds for kitchen orders
- Kitchen order priority levels
- Integration with kitchen display system for better coordination 