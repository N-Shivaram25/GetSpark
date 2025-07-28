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

### Migration to Replit Environment (January 26, 2025)
- **Database Setup**: Successfully migrated from Replit Agent to full Replit environment with PostgreSQL database
- **Speech Display Update**: Changed speech display from 6 lines to 4 lines fixed box and removed border
- **Environment Configuration**: All dependencies installed and configured for production-ready deployment
- **Security**: Implemented proper client/server separation following Replit best practices
- **Speech Display Fixes**: Removed blue interim text overlay and fixed line compression between lines 3 and 4
- **Layout Improvements**: Implemented consistent 32px line heights with proper spacing to prevent text compression
- **Enhanced Pause Detection**: Added automatic punctuation insertion (comma after 5 seconds of pause, period after 10 seconds)
- **Improved Typing Flow**: Enhanced real-time character-by-character typing from end of line 4 with smooth continuation
- **Speech Recognition Optimization**: Better handling of interim results and final speech processing for uninterrupted text flow
- **Continuous Listening Mode**: Implemented persistent speech recognition that maintains listening state even during long pauses
- **Auto-Recovery System**: Speech recognition automatically restarts if interrupted by network issues or browser limitations
- **Manual Control Only**: Speech recognition only stops when user manually clicks the stop button, ensuring uninterrupted long-form dictation

### Core Functionality Implementation
- **Keyword Detection System**: Implemented real-time keyword detection for both Keyflow and Img Key modes using `useKeywordDetection` hook
- **Speech Recognition**: Simplified speech recognition system with continuous speech capture and 4-line scrolling display
- **Voice Button Effects**: Added sophisticated voice button animations including:
  - Glow pulse animation when listening (green glow with box-shadow effects)
  - Microphone/stop icon toggle based on listening state
  - Circular wave animations around button during recording
- **Light Theme Migration**: Switched from dark cyberpunk theme to clean, minimal light theme for better readability
- **Mode Integration**: Keywords detection works seamlessly across both Keyflow and Img Key modes
- **Real-time Feedback**: Display detected keywords with timestamps as they are found in speech

### Design System Changes (January 2025)
- **Theme**: Clean light theme with minimal design
- **Primary colors**: Simple black/gray color scheme with white backgrounds
- **Background**: Light gray to white gradients for better readability
- **Interactive elements**: Standard button styles with subtle shadows
- **Voice button**: 64px circular button with green glow pulse animation when active, microphone/stop icon toggle, and circular wave animations
- **Speech Display**: 4-line fixed box without border for cleaner appearance
- **Typography**: Standard text colors optimized for readability
- **Effects**: Focused on voice button animations - pulse glow, circular waves, and smooth transitions

### Accuracy and Timing Improvements (January 26, 2025)
- **Enhanced Keyword Detection**: Implemented multi-strategy keyword matching including exact phrase, word boundary, and fuzzy matching for 80% character accuracy
- **Keyword Highlighting**: Real-time highlighting of detected keywords in speech display with green animated highlighting
- **Individual Timing Controls**: Added per-keyword timing options in Insert Keywords modal with common time toggle
- **Visual Feedback**: Detected keywords display with timestamps showing when each keyword was found
- **Improved Image Generation**: Enhanced ClipDrop prompts with category-specific enhancements for better visual accuracy
- **Fallback Image Services**: Multiple fallback image sources (LoremFlickr, Unsplash, Picsum) for better image availability
- **Duration Integration**: Full support for custom duration per keyword in both Keyflow and Img Key modes
- **Timing Display**: Active keywords now show individual timing settings in the management interface

### Real-Time Character-by-Character Speech System (January 26, 2025)
- **Live Character Typing**: Characters appear immediately as speech is processed, creating typewriter effect
- **True LIFO Implementation**: Character-by-character removal from beginning when capacity reached (400 chars total)
- **Fixed Line Spacing**: Consistent 4-line layout with proper spacing that doesn't compress during speech
- **Full-Width Text Flow**: 100 characters per line with proper word wrapping to utilize complete 80% screen width
- **Real-Time Colorful Indicator**: Animated box at end of line 4 that blinks during active speech
- **Immediate Speech Processing**: No waiting for word completion - characters processed instantly
- **Character-Level LIFO**: When full, text disappears character-by-character from beginning
- **Stable Layout**: Lines maintain consistent height and spacing regardless of speech state
- **Live Typing Preview**: Current interim speech shows as typing effect on line 4
- **Responsive Design**: 80% viewport width with 10% margins on each side
- **Enhanced Visual Feedback**: Colorful gradient box with pulsing and ping animations during speech
- **Seamless Text Flow**: Natural progression from line 1→2→3→4, then LIFO behavior when capacity reached

### Major Enhancement Update (January 28, 2025)
- **Web Speech API Implementation**: Robust continuous speech recognition with auto-restart functionality for uninterrupted long-form dictation
- **Continuous Speech Recognition**: Automatic restart mechanism prevents mid-sentence stops during continuous speaking
- **Character-Based Text Flow**: Enhanced LIFO text management with 320-character capacity across 4 lines (80 chars each)
- **Enhanced Microphone Animations**: 3-circle wave animations with staggered timing and improved visual effects
- **Mode-Specific UI Controls**: Keyflow mode shows only "Insert Keywords" option as requested
- **Auto-Stop on Mode Switch**: Microphone automatically stops when switching between modes for better UX
- **Ultimate Landing Page Design**: Premium gradient backgrounds, floating particles, feature cards, and animated elements
- **ClipDrop Image Generation**: Fixed and enhanced image generation in Keyflow mode with better prompts and fallbacks
- **Voice to Topic Mode**: New intelligent mode for educational content with real-time image search and AI explanations
- **Three Mode System**: Keyflow (AI images), Img Key (custom images), Voice to Topic (educational content)
- **RapidAPI Integration**: Real-Time Image Search and Gemini Pro AI for comprehensive topic information
- **Enhanced Visual Effects**: 20px enlarged microphone button with gradient styling and processing states
- **Smart Topic Detection**: Automatic extraction of educational topics from speech with complexity level detection
- **Side Panel Interface**: Sliding topic panel with images, definitions, and code examples for Voice to Topic mode
- **Production Ready**: All API integrations working with proper error handling and fallback systems