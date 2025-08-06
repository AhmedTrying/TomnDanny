-- Add 'is_supply' column to products table for supply-only items
ALTER TABLE products ADD COLUMN is_supply BOOLEAN NOT NULL DEFAULT FALSE; 