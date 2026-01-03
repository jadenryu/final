# modlr

<div align="center">
  
  **AI-Powered CAD Design Tool**
  
  A production-ready CAD application that translates natural language into 3D designs using AI. Describe what you want to build, and watch it come to life.
  
  *Built for the xAI Hackathon (December 2025)*
  
  [![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://www.python.org/downloads/)
  [![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
  [![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
  [![Three.js](https://img.shields.io/badge/Three.js-0.181-000000.svg)](https://threejs.org/)
</div>

---

## Features

- **Natural Language CAD**: Describe shapes in plain English and watch them appear in 3D
- **AI-Powered Design**: Powered by xAI's Grok model for intelligent shape generation
- **Real-Time 3D Rendering**: Interactive Three.js-based viewport with React Three Fiber
- **CAD DSL Patches**: Structured patch format for precise shape manipulation
- **Boolean Operations**: Support for complex CSG (Constructive Solid Geometry) operations
- **Feature-Based Modeling**: Fillets, chamfers, extrusions, and more
- **User Authentication**: Secure authentication via Supabase

## Architecture

### Backend (Python)
- **xAI SDK**: Integration with Grok models for natural language processing
- **CAD Agent**: Converts natural language to structured CAD DSL patches
- **Patch Format**: `AT <feature_id> <ACTION> <JSON_content>`

### Frontend (Next.js)
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React features
- **React Three Fiber**: React renderer for Three.js
- **Three.js**: 3D graphics library
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Supabase**: Authentication and database
- **TypeScript**: Type-safe development
- **Zustand**: State management

### CAD DSL

The CAD agent uses a domain-specific language for defining 3D shapes:

**Supported Primitives:**
- `cube`: Box with width, height, depth
- `cylinder`: Cylinder with radius and height
- `sphere`: Sphere with radius
- `cone`: Cone with radius and height
- `torus`: Torus with radius and tube size

**Supported Features:**
- `fillet`: Round edges
- `chamfer`: Bevel edges
- `extrude`: Extrude sketches

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- xAI API key
- Supabase account

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/jadenryu/final.git
   cd final
   ```

2. **Install Python dependencies**
   ```bash
   pip install xai-sdk python-dotenv
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   # xAI Configuration (Required for CAD AI)
   XAI_API_KEY=your_xai_api_key
   ```

4. **Test the CAD agent**
   ```bash
   python cad_agent.py
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd resyft-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create `.env.local` in the `resyft-frontend` directory:
   ```env
   # Supabase Configuration (Required)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # xAI API Key (Required for CAD AI features)
   XAI_API_KEY=xai-your-api-key-here
   
   # Optional
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

### Environment Variables

#### Backend Configuration
| Variable | Description | Required |
|----------|-------------|----------|
| `XAI_API_KEY` | xAI API key for Grok models (standalone Python scripts) | Yes |

#### Frontend Configuration
| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `XAI_API_KEY` | xAI API key for CAD AI (server-side API routes) | Yes |
| `NEXT_PUBLIC_API_URL` | Backend API URL | No |
| `OPEN_ROUTER_API_KEY` | OpenRouter API key (research features) | No |
| `OPEN_ROUTER_MODEL` | OpenRouter model | No |

See [CONFIGURATION.md](CONFIGURATION.md) for detailed setup instructions.

## Project Structure

```
final/
├── cad_agent.py            # CAD Agent - NL to CAD DSL
├── test.py                 # xAI SDK test script
├── resyft-frontend/        # Frontend Next.js application
│   ├── app/                # Next.js app router
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── editor/         # CAD editor page
│   │   ├── projects/       # Projects management
│   │   └── ...
│   ├── components/         # React components
│   │   ├── cad/            # CAD-specific components
│   │   ├── ui/             # UI primitives
│   │   └── ...
│   ├── lib/                # Utilities
│   ├── hooks/              # Custom React hooks
│   └── public/             # Static assets
├── CONFIGURATION.md        # Configuration guide
├── LICENSE                 # Apache 2.0 License
└── README.md               # This file
```

## License

This project is open source and available under the [Apache License 2.0](LICENSE).

---

