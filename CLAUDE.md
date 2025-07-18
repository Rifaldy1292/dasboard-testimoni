# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Client (Vue.js Frontend)
```bash
# Development server
cd client && pnpm run dev

# Build for production
cd client && pnpm run build-only

# Type checking
cd client && pnpm run type-check

# Linting and formatting
cd client && pnpm run lint
cd client && pnpm run format
```

### Server (Node.js Backend)
```bash
# Development (runs both API and MQTT services)
cd server && pnpm run start

# Run individual services
cd server && pnpm run dev:app    # API server only
cd server && pnpm run dev:mqtt   # MQTT handler only

# Database operations
cd server && pnpm run db:migrate
cd server && pnpm run db:seed:all
cd server && pnpm run full-restore:linux  # Restore from backup
```

### Root Project Commands
```bash
# Run client development server
pnpm run client

# Run server development
pnpm run server

# Build and deploy
pnpm run build
pnpm run pull:restart  # Pull, build, and restart with PM2

# Database backup
pnpm run backup-db
pnpm run push-db  # Backup and commit to git
```

## Architecture Overview

This is a **Vue.js + Tailwind CSS admin dashboard** for monitoring Yamaha manufacturing machines with real-time data collection.

### Client Architecture (Vue.js)
- **Framework**: Vue 3 with TypeScript
- **Styling**: Tailwind CSS with PrimeVue components
- **State Management**: Pinia stores
- **Router**: Vue Router with authentication guards
- **Charts**: ApexCharts and Vue-Cal for timeline visualization
- **Build Tool**: Vite

### Server Architecture (Node.js)
- **Dual Process Design**:
  - `app.js`: Express API server with WebSocket support
  - `mqtt.js`: MQTT message handler (runs separately)
- **Database**: PostgreSQL with Sequelize ORM
- **Real-time Communication**: 
  - MQTT for machine-to-server data
  - WebSocket for server-to-client updates
- **Process Management**: PM2 with ecosystem.config.cjs

### Key Features
- **Machine Monitoring**: Real-time status tracking for CNC machines
- **Timeline Views**: Two different timeline interfaces for machine logs
- **File Transfer**: FTP-based G-code file transfer to machines
- **User Management**: Role-based authentication system
- **Cutting Time Analysis**: Production time tracking and targets
- **Dashboard Settings**: Configurable shift times and machine parameters

## Important File Locations

### Configuration Files
- `client/ecosystem.config.cjs` - PM2 configuration for all services
- `server/config/config.json` - Sequelize database configuration
- `client/vite.config.ts` - Vite build configuration

### Key Components
- `client/src/components/modules/timeline/TimelineMachine.vue` - Main timeline component
- `client/src/components/modules/TransferFile/` - File transfer functionality
- `server/websocket/handleWebsocket.js` - WebSocket event handling
- `server/mqtt/MachineMqtt.js` - MQTT message processing

### Database
- `server/migrations/` - Database schema migrations
- `server/models/` - Sequelize model definitions
- Core entities: Machine, MachineLog, User, CuttingTime, TransferFile

## Development Notes

### Authentication
- JWT-based authentication with role checking
- User data stored in localStorage on client
- Route guards prevent unauthorized access

### Real-time Updates
- MQTT receives machine data → Database → WebSocket → Client updates
- Two separate Node.js processes for stability and performance

### File Transfer System
- Supports FTP transfer of CNC program files (G-code)
- Files stored in `server/public/cnc_files/` organized by machine ID

### Timeline Features
- Two different timeline views (Timeline1View and Timeline2View)
- Machine log visualization with status changes
- Real-time updates via WebSocket connection

### Testing
No specific test framework is configured. Verify functionality through:
1. Manual testing of UI components
2. API endpoint testing
3. Database migration verification
4. MQTT message flow testing