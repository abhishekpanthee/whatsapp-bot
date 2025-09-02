# Auto-Reply Image Setup

To set up an auto-reply image:

1. **Upload an image using the API:**

   ```bash
   curl -X POST http://localhost:3000/auto-reply/image/upload \
     -F "image=@/path/to/your/image.jpg"
   ```

2. **Enable auto-reply image:**

   ```bash
   curl -X POST http://localhost:3000/auto-reply/image/toggle
   ```

3. **Check status:**
   ```bash
   curl http://localhost:3000/auto-reply/status
   ```

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## Recommendations

- Use professional images (company logo, business card, etc.)
- Keep file size under 5MB for faster sending
- Use landscape orientation for better mobile viewing
- Ensure image is clear and readable on mobile devices

## Example Professional Auto-Reply Images

- Company logo with contact information
- Professional headshot with business details
- Business card design
- Infographic with services offered
- QR code for easy contact sharing
