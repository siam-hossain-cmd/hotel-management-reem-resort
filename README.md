# Invoice Generator System Dashboard - Reem Resort

A comprehensive React-based invoice generator system built with modern technologies for efficient invoice management and PDF generation.

## Features

### ✨ Core Functionality
- **Dashboard Overview**: Real-time statistics and recent invoice tracking
- **Invoice Management**: Create, edit, view, and delete invoices
- **Customer Management**: Add, edit, and manage customer information
- **PDF Generation**: Generate professional PDF invoices
- **Invoice Preview**: Preview invoices before sending
- **Responsive Design**: Mobile-friendly interface

### 🎨 User Interface
- Modern, clean dashboard design
- Intuitive navigation with sidebar
- Professional styling with smooth animations
- Mobile-responsive layout
- Interactive components and forms

### 📊 Dashboard Features
- Real-time statistics (Total Invoices, Customers, Revenue, Growth)
- Recent invoices overview
- Color-coded status indicators
- Quick action buttons

### 📄 Invoice Features
- Dynamic item addition/removal
- Automatic calculations (subtotal, tax, total)
- Customizable terms and conditions
- Multiple export options (PDF, Preview)
- Invoice status tracking

### 👥 Customer Management
- Customer database with contact information
- Customer statistics (total invoices, amounts)
- Easy add/edit/delete functionality
- Search and filter capabilities

## Technology Stack

- **Frontend**: React 19.1.1
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **PDF Generation**: jsPDF + html2canvas
- **Styling**: Custom CSS with modern design principles
- **Package Manager**: npm

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "INVOIVE REEM RESORT"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## Project Structure

```
src/
├── components/
│   └── Layout/
│       ├── Header.jsx        # Top header with user actions
│       ├── Sidebar.jsx       # Navigation sidebar
│       └── Layout.jsx        # Main layout wrapper
├── pages/
│   ├── Dashboard.jsx         # Dashboard with statistics
│   ├── Invoices.jsx          # Invoice list and management
│   ├── CreateInvoice.jsx     # Invoice creation form
│   └── Customers.jsx         # Customer management
├── utils/
│   └── pdfGenerator.js       # PDF generation utilities
├── App.jsx                   # Main app component with routing
├── App.css                   # Main application styles
├── index.css                 # Global styles
└── main.jsx                  # Application entry point
```

## Usage Guide

### Creating an Invoice
1. Navigate to "Create Invoice" from the sidebar
2. Fill in customer information
3. Add invoice items with descriptions, quantities, and rates
4. Review calculated totals
5. Add notes and terms if needed
6. Save as draft or send the invoice
7. Generate PDF or preview before sending

### Managing Customers
1. Go to the "Customers" section
2. Click "Add Customer" to create new customer records
3. Edit existing customers using the edit button
4. View customer statistics and contact information

### Dashboard Overview
- View key metrics at a glance
- Monitor recent invoice activity
- Track revenue and growth statistics
- Quick access to main functions

## Features in Detail

### PDF Generation
- Professional invoice layout
- Company branding (Reem Resort)
- Detailed itemization
- Tax calculations
- Terms and conditions
- Printable format

### Responsive Design
- Mobile-first approach
- Tablet and desktop optimization
- Touch-friendly interface
- Adaptive layouts

### Modern UI/UX
- Clean, professional design
- Intuitive navigation
- Color-coded status indicators
- Smooth animations and transitions
- Accessible design principles

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Dependencies
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^6.x",
  "lucide-react": "^0.x",
  "html2canvas": "^1.x",
  "jspdf": "^2.x",
  "date-fns": "^2.x",
  "uuid": "^9.x"
}
```

## Future Enhancements

- [ ] Database integration for persistent data
- [ ] User authentication and authorization
- [ ] Email integration for sending invoices
- [ ] Payment tracking and reminders
- [ ] Multi-currency support
- [ ] Advanced reporting and analytics
- [ ] Invoice templates customization
- [ ] Bulk operations
- [ ] Export to various formats (Excel, CSV)
- [ ] Dark mode support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please contact: contact@reemresort.com

---

**Built with ❤️ for efficient invoice management**

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
