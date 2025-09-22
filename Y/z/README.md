# Phone Screen Stock Control System

A professional Progressive Web App (PWA) for managing phone screen inventory with real-time tracking, analytics, and modern UI design.

## 🚀 Features

### 📱 Phone Brand Support
- **iPhone**: Complete model range from iPhone 8 to iPhone 15 Pro Max
- **Oppo**: Find X6, Reno series, A series, F series
- **Vivo**: X100, V29, V27, Y series, T series
- **Redmi**: Note series, Redmi 12, 11, 10, 9, 8, 7
- **Huawei/Honor**: Magic 6, Honor 90/80/70/50, Huawei P60/Mate 60
- **Tecno**: Camon 20, Spark 10, Pova 5, Phantom series

### 📊 Stock Management
- **Real-time Inventory**: Live stock level tracking
- **SKU Management**: Unique product identification
- **Price Tracking**: Cost price and selling price management in Yuan (¥)
- **Stock Alerts**: Automatic low stock and out-of-stock notifications
- **Quick Edit**: Inline quantity updates

### 🔍 Advanced Search & Filtering
- **Smart Search**: Search by model, brand, or SKU
- **Brand Filter**: Filter by specific phone brands
- **Stock Level Filter**: Filter by stock status (In Stock, Low Stock, Out of Stock)
- **Real-time Results**: Instant filtering and search results

### 📈 Analytics Dashboard
- **Total Items**: Complete inventory count
- **Stock Status**: In Stock, Low Stock, Out of Stock counters
- **Visual Indicators**: Color-coded status badges
- **Real-time Updates**: Live statistics updates

### 🔐 Security & Authentication
- **Google Authentication**: Secure sign-in with Google
- **User Isolation**: Each user sees only their own data
- **Firebase Security Rules**: Protected database access
- **HTTPS Required**: Secure data transmission

### 📱 Progressive Web App (PWA)
- **Installable**: Add to home screen on mobile devices
- **Offline Support**: Works without internet connection
- **App Shortcuts**: Quick access to add stock and view inventory
- **Native-like Experience**: Full-screen app experience

## 🛠️ Installation & Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase project setup
- Web server (for PWA functionality)

### Step 1: Firebase Configuration
1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication with Google provider
3. Create Firestore database
4. Update security rules with `phone-stock-firestore.rules`

### Step 2: Deploy Files
1. Upload all files to your web server:
   - `phone-stock-control.html` (main app)
   - `phone-stock-manifest.json` (PWA manifest)
   - `phone-stock-sw.js` (service worker)
   - `phone-stock-firestore.rules` (Firebase rules)

2. Ensure HTTPS is enabled (required for PWA)

### Step 3: Access the Application
1. Open `phone-stock-control.html` in your browser
2. Sign in with Google account
3. Start managing your phone screen inventory!

## 📱 Mobile App Installation

### Android
1. Open the app in Chrome browser
2. Tap the "Install App" button when prompted
3. Or go to Chrome menu → "Add to Home screen"
4. The app will appear on your home screen like a native app

### iOS
1. Open the app in Safari browser
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will be installed as a native-like app

## 🎯 How to Use

### Adding Stock Items
1. Click "Add Stock" button
2. Select brand from dropdown
3. Choose model (automatically populated based on brand)
4. Enter SKU (unique identifier)
5. Set quantity, cost price, and selling price
6. Add optional description
7. Click "Add Item"

### Managing Inventory
- **View All Items**: See complete inventory in table format
- **Search**: Use search bar to find specific items
- **Filter**: Use brand and stock level filters
- **Edit Quantity**: Click "Edit" to update stock levels
- **Delete Items**: Remove items you no longer stock

### Stock Monitoring
- **Dashboard Stats**: View total items, in-stock, low-stock, and out-of-stock counts
- **Status Indicators**: Color-coded badges show stock status
- **Real-time Updates**: Statistics update automatically when you make changes

## 🔧 Customization

### Adding New Phone Models
Edit the `phoneData` object in `phone-stock-control.html`:

```javascript
const phoneData = {
    iPhone: [
        'iPhone 15 Pro Max', 'iPhone 15 Pro', // ... existing models
        'iPhone 16 Pro Max', 'iPhone 16 Pro'  // ... add new models
    ],
    // Add new brands
    Samsung: [
        'Galaxy S24 Ultra', 'Galaxy S24', 'Galaxy A55'
    ]
};
```

### Modifying Stock Thresholds
Change the low stock threshold in the `getStockStatus` function:

```javascript
function getStockStatus(quantity) {
    if (quantity === 0) {
        return { text: 'Out of Stock', class: 'bg-red-100 text-red-800' };
    } else if (quantity <= 5) { // Changed from 10 to 5
        return { text: 'Low Stock', class: 'bg-yellow-100 text-yellow-800' };
    } else {
        return { text: 'In Stock', class: 'bg-green-100 text-green-800' };
    }
}
```

## 📊 Database Structure

### Stock Item Document
```javascript
{
    brand: "iPhone",
    model: "iPhone 15 Pro Max",
    sku: "IPH15PM-BLK",
    quantity: 25,
    costPrice: 150000,  // ¥150,000
    sellingPrice: 200000,  // ¥200,000
    description: "Black color, original quality",
    createdAt: "2024-01-15T10:30:00Z",
    userId: "user123"
}
```

## 🚀 Advanced Features

### Future Enhancements
- **Barcode Scanner**: QR code scanning for quick item addition
- **Supplier Management**: Track suppliers and purchase orders
- **Sales Tracking**: Record sales and profit calculations
- **Automated Reordering**: Set minimum stock levels for automatic alerts
- **Multi-location Support**: Manage inventory across multiple stores
- **Advanced Analytics**: Sales trends, profit margins, popular models
- **Export/Import**: CSV/Excel file support for bulk operations
- **Mobile Camera**: Take photos of damaged screens for reference

## 🔒 Security Features

### Data Protection
- Firebase Authentication with Google
- User-specific data isolation
- Secure data transmission (HTTPS)
- Protected database rules

### Privacy
- No data sharing with third parties
- User controls all data
- Secure Firebase integration
- Local caching for offline access

## 📈 Performance

### Optimization Features
- Efficient Firebase queries
- Local caching for faster access
- Responsive design for all devices
- Optimized loading with service worker

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🛠️ Development

### File Structure
```
/
├── phone-stock-control.html    # Main application
├── phone-stock-manifest.json  # PWA manifest
├── phone-stock-sw.js          # Service worker
├── phone-stock-firestore.rules # Firebase security rules
└── PHONE_STOCK_README.md      # This file
```

### Key Technologies
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Charts**: Chart.js (ready for future analytics)
- **Backend**: Firebase (Authentication, Firestore)
- **PWA**: Service Worker, Web App Manifest

## 🚀 Deployment Options

### Web Hosting
- **Firebase Hosting**: Recommended for Firebase integration
- **Netlify**: Easy deployment with continuous integration
- **Vercel**: Fast deployment with global CDN
- **GitHub Pages**: Free hosting for public repositories

### Mobile App Stores
- **Google Play Store**: Convert PWA to Android APK using Capacitor
- **Apple App Store**: Convert PWA to iOS app using Capacitor

## 📞 Support & Troubleshooting

### Common Issues
1. **Authentication errors**: Verify Firebase configuration
2. **Data not loading**: Check internet connection and Firebase rules
3. **PWA not installing**: Ensure HTTPS and manifest accessibility
4. **Search not working**: Clear browser cache and reload

### Getting Help
- Check browser console for error messages
- Verify Firebase project configuration
- Ensure all files are properly uploaded
- Test with different browsers

## 🔄 Updates & Maintenance

### Regular Tasks
- Monitor stock levels and update quantities
- Review and update phone model lists
- Backup data regularly
- Update Firebase security rules as needed

### Version History
- **v1.0**: Initial release with basic stock management
- **v1.1**: Added advanced search and filtering
- **v1.2**: Implemented PWA features
- **v1.3**: Enhanced UI/UX design

---

**Phone Screen Stock Control System** - Professional inventory management made simple and efficient.

Perfect for phone repair shops, mobile service centers, and electronics retailers who need reliable stock management for phone screens and accessories.
