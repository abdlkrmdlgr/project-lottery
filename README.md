# 🎲 Lottery System

Modern, interactive and visually impressive lottery system. A professional lottery application built using a snake game visualization.

## ✨ Features

### 🎯 Snake Game Visualization
- **Grid-Based Display**: Names are placed randomly on a grid
- **Snake Movement**: A snake moves around the grid to select winners
- **Visual Effects**: Selected names are highlighted with animations
- **Adjustable Speed**: Control the speed of the snake movement (0.5x - 5x)
- **Grid Size Options**: Choose from different grid sizes (16x9, 32x18, 48x27, 80x45)

### 🏆 Winners List
- **Right Panel**: Winners are listed as numbered cards on the right side
- **Staggered Animation**: Each card appears sequentially (fade-in + slide-in)
- **Scrollable**: Scrollable panel for long lists
- **Numbering**: Each winner is numbered as 1st, 2nd, 3rd, etc.

### 🎨 Professional UI/UX
- **Glassmorphism**: Modern glass effect control panel
- **Gradient Backgrounds**: Professional appearance with dark theme
- **Responsive Design**: Optimized for mobile, tablet and desktop
- **Real-Time Counters**: Name and character counts update instantly
- **Form Validation**: Warning messages for invalid inputs

### ⚡ Interactive Features
- **Name Input**: Accepts names separated by newlines or commas
- **Copy Results**: Copy all results to clipboard with one click
- **Reset**: Reset all data and start a new draw
- **Speed Control**: Adjust movement speed with slider

## 🚀 Usage

### Local Development

1. Clone or download the project:
```bash
git clone <repository-url>
cd project-lottery
```

2. Start a simple HTTP server (Python example):
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

3. Open in your browser:
```
http://localhost:8000
```

### Publishing with GitHub Pages

#### Otomatik Deploy (Önerilen - GitHub Actions ile)

Proje GitHub Actions workflow ile otomatik olarak deploy edilir. Sadece şu adımları izleyin:

1. **Repository'yi GitHub'a push edin:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **GitHub Repository Ayarları:**
   - Repository'nize gidin: `https://github.com/<username>/project-lottery`
   - **Settings** > **Pages** bölümüne gidin
   - **Source** kısmında **"GitHub Actions"** seçeneğini seçin
   - Kaydedin

3. **Otomatik Deploy:**
   - `main` veya `master` branch'ine her push yaptığınızda otomatik olarak deploy edilir
   - Actions sekmesinden deploy durumunu takip edebilirsiniz
   - Birkaç dakika içinde siteniz canlı olacak:
     ```
     https://<username>.github.io/project-lottery/
     ```

#### Manuel Deploy (Alternatif)

Eğer GitHub Actions kullanmak istemiyorsanız:

1. Repository'yi GitHub'a push edin
2. **Settings** > **Pages** bölümüne gidin
3. **Source** kısmında **"Deploy from a branch"** seçin
4. Branch olarak **"main"** veya **"master"** seçin
5. Folder olarak **"/ (root)"** seçin
6. **Save** butonuna tıklayın
7. Birkaç dakika içinde siteniz canlı olacak

## 📋 How to Use?

1. **Enter Names**: Write names in the textarea separated by newlines or commas
   - Example 1 (newlines):
     ```
     John Smith
     Jane Doe
     Bob Johnson
     ```
   - Example 2 (commas):
     ```
     Alice Brown, Charlie Wilson, David Lee
     ```

2. **Set Number of Winners**: Enter how many people will be drawn in the input field

3. **Adjust Speed** (optional): Use the slider to set how fast the snake moves

4. **Start Draw**: Click the "Start Draw" button

5. **View Results**: Winners are listed as numbered cards on the right side

6. **Copy Results**: Copy all results to clipboard using the "Copy Results" button

## 🛠️ Technologies

- **HTML5**: Semantic markup
- **CSS3**: Modern styling, animations, glassmorphism
- **JavaScript (ES6+)**: Vanilla JavaScript
- **GitHub Pages**: Hosting

## 📁 File Structure

```
project-lottery/
├── index.html                    # Main HTML file
├── styles.css                    # CSS styles
├── script.js                     # JavaScript logic and snake game code
├── README.md                     # This file
├── .nojekyll                     # GitHub Pages için Jekyll'i devre dışı bırakır
└── .github/
    └── workflows/
        └── deploy.yml            # GitHub Actions deploy workflow
```

## 🎨 Customization

### Changing Colors

You can customize colors by editing CSS variables in the `styles.css` file:

```css
:root {
    --bg-primary: #0a0e27;
    --accent-blue: #4f46e5;
    --accent-purple: #7c3aed;
    /* ... */
}
```

### Grid Settings

You can change grid and snake settings in the `script.js` file:

```javascript
let GRID_ROWS = 9;  // Number of rows
let GRID_COLS = 16; // Number of columns
```

## 📝 Notes

- A person's name can only be drawn once
- Duplicate names are automatically filtered
- Number of winners cannot be greater than total number of names
- On mobile devices, the grid appears on top, list at the bottom

## 🤝 Contributing

We welcome your contributions! Please before sending a pull request:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and can be used freely.

## 🙏 Acknowledgments

- [Google Fonts](https://fonts.google.com/) - Inter font family

---

**Created**: 2024
**Version**: 1.0.0
