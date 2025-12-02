# DronePortfolio

A modern, sleek portfolio website showcasing drone aerial photography, videography, 360° virtual tours, and 3D models from Boise, Idaho.

## Features

- **360° Landing Experience**: Full-screen interactive 360° photo of Boise's Idaho State Capitol with prominent location text
- **Responsive Navigation**: Clean header with tabs for Home, 3D Models, 360° Tours, and Videos
- **Featured Work Gallery**: Showcases your best drone work on the homepage
- **3D Models Section**: Ready for Kiri Engine 3D model embeds
- **360° Tours Section**: Multiple Kuula virtual tour embeds for immersive experiences
- **Videos Section**: Dedicated space for your aerial video content
- **Modern Design**: Sleek, professional styling with smooth animations
- **Fully Responsive**: Mobile-friendly layout that adapts to all screen sizes

## Technology Stack

- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with Grid, Flexbox, animations, and transitions
- **Vanilla JavaScript**: No frameworks - pure, lightweight JavaScript for navigation and interactivity
- **Single-Page Application**: Hash-based routing for smooth navigation

## How to Use

1. **Clone the repository**:
   ```bash
   git clone https://github.com/JEBennett204/DronePortfolio.git
   cd DronePortfolio
   ```

2. **Open the website**:
   - Simply open `index.html` in a web browser, or
   - Use a local server: `python3 -m http.server 8080` and visit `http://localhost:8080`

3. **Customize Your Content**:
   - Replace Kuula embed URLs with your own 360° tour links
   - Add your Kiri Engine 3D model embed URLs
   - Add your video embeds (YouTube, Vimeo, etc.)
   - Update text content, titles, and descriptions
   - Customize colors in `styles.css` (see `:root` CSS variables)

## Customization Guide

### Adding Your 360° Tours
Replace the Kuula embed URLs in `index.html`:
```html
<iframe src="YOUR_KUULA_SHARE_URL"></iframe>
```

### Adding Your 3D Models
Replace the Kiri Engine URLs in the 3D Models section:
```html
<iframe src="YOUR_KIRI_ENGINE_SHARE_URL"></iframe>
```

### Adding Your Videos
Replace the video placeholder divs with your video embeds (YouTube example):
```html
<iframe width="100%" height="400" 
        src="https://www.youtube.com/embed/YOUR_VIDEO_ID" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>
```

### Customizing Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #1a1a2e;
    --secondary-color: #16213e;
    --accent-color: #0f4c75;
    --highlight-color: #3282b8;
}
```

## File Structure

```
DronePortfolio/
├── index.html      # Main HTML structure
├── styles.css      # All styling and responsive design
├── script.js       # Navigation and interactivity
└── README.md       # This file
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Screenshots

### Home Page
![Homepage](https://github.com/user-attachments/assets/734f51f2-9176-4354-9561-41f20a2a44b3)

### 3D Models Page
![3D Models](https://github.com/user-attachments/assets/a5e99bed-d05d-4fd6-9455-438fcbd82afa)

### 360° Tours Page
![360 Tours](https://github.com/user-attachments/assets/3caaacdd-a10d-4d0a-bb66-be1e1209b002)

### Videos Page
![Videos](https://github.com/user-attachments/assets/16d14bc3-0ba4-4884-87e9-8a3c9c96ef7b)

## License

All rights reserved © 2024 Boise Aerial Photography

## Contact

For questions or collaborations, please open an issue in this repository.
