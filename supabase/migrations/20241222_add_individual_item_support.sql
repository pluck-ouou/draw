-- Migration: Add individual item image support
-- This migration adds support for individual item images alongside the existing sprite mode
-- BACKWARD COMPATIBLE: Existing Christmas template will continue to work unchanged

-- 1. Add item_mode column to templates table
-- 'sprite' = existing behavior (single sprite sheet, crop to get items)
-- 'individual' = new behavior (separate image per slot)
ALTER TABLE templates
ADD COLUMN IF NOT EXISTS item_mode TEXT DEFAULT 'sprite' CHECK (item_mode IN ('sprite', 'individual'));

-- 2. Add item_image_url column to template_slots table
-- For 'individual' mode: URL of the individual item image for this slot
-- For 'sprite' mode: NULL (uses sprite_image from template)
ALTER TABLE template_slots
ADD COLUMN IF NOT EXISTS item_image_url TEXT;

-- 3. Add item_image_url column to prizes table
-- Copied from template_slots when game is created
ALTER TABLE prizes
ADD COLUMN IF NOT EXISTS item_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN templates.item_mode IS 'Item rendering mode: sprite (crop from sheet) or individual (separate images per slot)';
COMMENT ON COLUMN template_slots.item_image_url IS 'Individual item image URL (only used when template.item_mode = individual)';
COMMENT ON COLUMN prizes.item_image_url IS 'Individual item image URL (copied from template_slot when game is created)';
