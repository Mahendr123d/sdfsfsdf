/*
  # Portfolio Items Table

  ## Overview
  Creates a table for storing portfolio items including videos (Vimeo URLs) and images.

  ## New Tables
  - `portfolio_items`
    - `id` (uuid, primary key) - Unique identifier for each portfolio item
    - `title` (text) - Title of the portfolio item
    - `description` (text, optional) - Description of the portfolio item
    - `vimeo_url` (text, optional) - URL to Vimeo video
    - `image_url` (text, optional) - URL to cover/thumbnail image (fallback if no video thumbnail)
    - `video_thumbnail_url` (text, optional) - URL to custom video thumbnail (used when vimeo_url is present)
    - `photo_360_url` (text, optional) - URL to 360-degree equirectangular photo for panoramic viewer
    - `category` (text) - Category of the item (e.g., "360", "Drone", "Brug")
    - `order_index` (integer) - For custom ordering of items
    - `is_visible` (boolean) - Whether item should be displayed
    - `created_at` (timestamptz) - When the item was created
    - `updated_at` (timestamptz) - When the item was last updated

  ## Security
  - Enable RLS on `portfolio_items` table
  - Add policy for public read access (anyone can view portfolio items)
  - Add policy for authenticated users to manage items
*/

CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  vimeo_url text,
  image_url text,
  video_thumbnail_url text,
  photo_360_url text,
  category text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible portfolio items"
  ON portfolio_items
  FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Authenticated users can insert portfolio items"
  ON portfolio_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update portfolio items"
  ON portfolio_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete portfolio items"
  ON portfolio_items
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_order ON portfolio_items(order_index);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_visible ON portfolio_items(is_visible);
