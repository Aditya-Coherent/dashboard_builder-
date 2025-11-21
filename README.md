# Coherent Market Insights Dashboard

Interactive dashboard for market analysis with advanced filtering, charting, and data visualization capabilities.

## Features

- **Market Analysis**: Comprehensive market data visualization with multiple chart types
- **Coherent Opportunity Matrix**: Geography × Product Type analysis with CAGR aggregations
- **Competitive Intelligence**: Market share and competitive analysis
- **Customer Intelligence**: Customer segmentation and analysis
- **Advanced Filtering**: Multi-level cascade filters, geography selection, aggregation levels
- **Real-time Data Processing**: Dynamic JSON processing with large file support

## Tech Stack

- **Framework**: Next.js 16
- **UI Library**: React 19
- **State Management**: Zustand
- **Charts**: Recharts, D3.js
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3002`

### Build

```bash
npm run build
npm start
```

## Data Files

The dashboard requires JSON data files in `public/data/`:

- `value.json` - Market value data (required)
- `volume.json` - Market volume data (optional)
- `segmentation_analysis.json` - Segmentation data (optional)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel deployment instructions.

## Project Structure

```
frontend-clean/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── charts/           # Chart components
│   ├── filters/          # Filter components
│   └── ui/               # UI components
├── lib/                   # Utilities and processors
├── public/                # Static assets
│   ├── data/             # JSON data files
│   └── logo.png          # Logo
└── styles/               # Global styles
```

## License

Private - Coherent Market Insights
