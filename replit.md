# Get Spark - Voice Interactive Web Project

## Overview

Get Spark is a voice-interactive web application that transforms spoken words into visual experiences through two distinct modes: Keyflow and Img Key Mode. The application uses speech recognition to capture user speech and displays corresponding images based on detected keywords.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Speech Recognition**: Web Speech API for voice capture and processing

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **File Handling**: Multer for image upload processing
- **Session Management**: In-memory storage with fallback to database

### Key Components

#### Core Features
1. **Landing Page**: Simple entry point with "Get Started" CTA
2. **Main Interaction Page**: Central hub with mode switching and speech interface
3. **Keywords Management**: Modal for bulk keyword entry
4. **Image-Keyword Mapping**: Custom image association with keywords
5. **Speech Display**: Real-time speech-to-text visualization with 6-line scrolling window

#### Speech Recognition System
- Real-time speech capture and transcription
- Keyword detection and matching
- Image generation triggering (first occurrence only)
- Speech text display with automatic scrolling

#### Data Models
- **Keywords**: Simple keyword storage with usage tracking
- **Image-Key Mappings**: Custom keyword-to-image associations with timing controls
- **Images**: File storage for custom uploaded images

### Data Flow

1. **Speech Input**: User speech captured via Web Speech API
2. **Text Processing**: Speech converted to text and displayed in scrolling window
3. **Keyword Detection**: Text analyzed for matching keywords from database
4. **Image Triggering**: First-time keyword matches trigger image display
5. **Visual Output**: Images shown for configured duration (default 6 seconds)

#### Keyflow Mode
- Uses ClipDrop API for automatic image generation from keywords
- One-time image generation per keyword per session
- 6-second image display duration

#### Img Key Mode
- Custom image-to-keyword mappings
- User-uploaded images with configurable display settings
- Optional bullet point display feature

### External Dependencies

#### Core Libraries
- **@radix-ui/***: Comprehensive UI component primitives
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: Type-safe database ORM
- **wouter**: Lightweight routing solution
- **multer**: File upload handling

#### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the application
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Fast JavaScript bundling for production

#### External APIs
- **ClipDrop API**: AI-powered image generation for Keyflow mode
- **Web Speech API**: Browser-native speech recognition

### Deployment Strategy

#### Build Process
- **Development**: `npm run dev` - Runs TypeScript server with hot reload
- **Production Build**: `npm run build` - Vite builds frontend, ESBuild bundles server
- **Database**: `npm run db:push` - Pushes schema changes to database

#### Architecture Decisions

**Database Choice**: PostgreSQL with Drizzle
- **Problem**: Need for reliable data persistence and type safety
- **Solution**: PostgreSQL via Neon with Drizzle ORM
- **Rationale**: Strong typing, excellent developer experience, cloud-ready

**Frontend Framework**: React + Vite
- **Problem**: Need for reactive UI with fast development cycles
- **Solution**: React with Vite build system
- **Rationale**: Mature ecosystem, excellent TypeScript support, fast HMR

**State Management**: React Query
- **Problem**: Server state synchronization and caching
- **Solution**: TanStack Query for API state management
- **Rationale**: Automatic caching, background updates, optimistic updates

**UI Components**: Shadcn/ui + Radix
- **Problem**: Need for accessible, customizable components
- **Solution**: Shadcn/ui built on Radix primitives
- **Rationale**: Accessibility by default, full customization, copy-paste approach

**Speech Recognition**: Web Speech API
- **Problem**: Real-time voice input processing
- **Solution**: Browser-native Speech Recognition API
- **Rationale**: No external dependencies, good browser support, real-time processing

**File Storage**: In-memory with database fallback
- **Problem**: Image storage for custom mappings
- **Solution**: Memory storage for development, extensible to cloud storage
- **Rationale**: Simple implementation, easy to extend to S3/CloudFront later

## Recent Changes (January 2025)

### UI/UX Improvements
- **Color Scheme Update**: Changed from black/gray to light blue and white theme
- **Landing Page Enhancement**: Added animated background elements and blue gradient design
- **Fixed Voice Button**: Implemented floating circular voice control button in bottom-right with wave animations
- **Mode-Specific UI**: Insert Keywords button and keyword count only visible in Keyflow mode
- **Multiple Image Upload**: Enhanced Img Key mode to support adding multiple images incrementally
- **Visual Feedback**: Added image counters and improved upload interface

### Design System Changes
- **Theme**: Dark theme with vibrant neon accents
- **Primary colors**: Purple, pink, cyan gradients with glass morphism
- **Background**: Black with animated particle effects and floating neon orbs
- **Interactive elements**: Glass morphism with glowing borders and hover effects
- **Voice button**: 64px circular button with animated rainbow gradient and wave effects
- **Typography**: Neon glow effects on headings with white text on dark backgrounds
- **Effects**: Floating animations, gradient shifts, backdrop blur, and glass morphism throughout