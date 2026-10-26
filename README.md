# SaB Energy — Industrial IoT & Energy Management System (EMS)

An enterprise-grade, high-performance web dashboard for monitoring industrial energy telemetry, configuring SCADA/edge gateways, managing Modbus meter profiles, mapping electrical assets, and diagnostic hardware testing.

---

## 📌 Executive Summary

**SaB Energy** is an Industrial IoT (IIoT) Energy Monitoring & Device Management web application built with **React 19** and **Vite**. It adopts the **ThingsBoard** device and telemetry architectural pattern, enabling power engineers, plant operators, and system integrators to configure hardware communication, maintain meter register dictionaries, test live field devices, and link physical meters to plant assets (transformers, feeders, chillers, solar arrays).

---

## 🛠️ Technology Stack

| Layer | Technologies / Packages |
| :--- | :--- |
| **Framework** | React 19.3.1 (Modern Hooks, Context API) |
| **Bundler & Tooling** | Vite 8.3.4, Oxlint |
| **Iconography** | Lucide React (v1.59.0) |
| **Styling & Design System** | Custom Vanilla CSS Design System with CSS variables |
| **Themes Supported** | **Enterprise Light** (Charcoal & WP-Admin Blue) & **SCADA Dark** (Midnight Slate & Cyan Glow) |
| **State & Persistence** | React Context (`EnergyDataContext`) with LocalStorage backup & preloaded mock dataset |

---

## 📂 Project Architecture

```
vishalini-SaB Energy/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images and design assets
│   ├── components/
│   │   ├── common/         # Reusable UI controls (StatCard, Badge, Modal, etc.)
│   │   └── layout/         # Header (Theme switcher, breadcrumbs, clock) & Sidebar (Hierarchical navigation)
│   ├── context/
│   │   └── EnergyDataContext.jsx   # Centralized state management & persistent CRUD operations
│   ├── mock/
│   │   └── initialData.js  # Industrial equipment fixtures (Gateways, Meters, Profiles, Channels)
│   ├── views/
│   │   ├── config/         # Communication & Polling Interval Configuration
│   │   ├── dashboard/      # Live Telemetry KPI Dashboard
│   │   ├── mapping/        # Asset-to-Meter Mapping with Multipliers
│   │   ├── masters/        # Unified Gateway & Channel & Meter Management, Gateway Make/Model Masters
│   │   └── profiles/       # Meter Profiles (Modbus Mapping, CSV/JSON Import/Export, Reg Test), Make/Model Masters, Parameter Dictionary
│   ├── App.css             # Base application layout styling
│   ├── App.jsx             # Main routing & tab rendering hub
│   ├── index.css           # Global design system, theme tokens (Light/Dark), table & form styles
│   └── main.jsx            # React root DOM mounting
├── index.html              # HTML shell & Google Fonts (Inter, JetBrains Mono)
├── package.json            # Scripts & project dependencies
└── vite.config.js          # Vite build configuration
```

---

## ✅ Completed Work (What Is Done in UI)

### 1. 🎨 Design System & Layout Foundation
- [x] **Dual Theme Architecture**:
  - **Enterprise Light Theme**: Clean charcoal sidebar (`#1d2327`), crisp white cards, flat admin borders (`#c3c4c7`), and industrial blue accents (`#2271b1`).
  - **SCADA Dark Theme**: High-contrast dark midnight background (`#090e1a`), navy surfaces (`#111a2e`), and vibrant neon cyan accents (`#38bdf8`).
  - Instant theme persistence across page refreshes via `localStorage` (`sab_theme_mode`).
- [x] **Global Top Header (`Header.jsx`)**:
  - Contextual dynamic breadcrumb navigation reflecting active screen.
  - Live ticking digital 12/24-hour clock.
  - System status indicators (Local State DB / ThingsBoard Telemetry link).
  - One-click Theme Switcher button (Sun / Moon toggle).
- [x] **Hierarchical Collapsible Sidebar Navigation (`Sidebar.jsx`)**:
  - Top-level direct modules: **Dashboard**, **Gateway**, **Asset Mapping**, **Meter Profile**, **Communication Config**.
  - Multi-tier expandable accordion sub-menus:
    - **Meter Master**: Make, Model, Parameter Dictionary.
    - **Gateway Master**: Make, Model.
  - Active state highlighting with distinct hover states and icon alignment.

---

### 2. ⚡ Real-Time Telemetry Dashboard (`DashboardView.jsx`)
- [x] **KPI Summary Stat Cards**:
  - Active Gateways count vs. Total nodes.
  - Active Meters count vs. Total meters.
  - Monitored Plant Assets with operational percentages.
  - Verified Asset-to-Meter Mappings.
- [x] **Simulated Live Telemetry Stream**:
  - Periodic background fluctuation simulation for **Active Power (kW)**, **Daily Generation (kWh)**, **Daily Consumption (kWh)**, **Power Factor (PF)**, and **Grid Frequency (Hz)**.
  - Real-time device health and network status indicators.

---

### 3. 🌐 Unified Gateway & Device Master (`DeviceMasterView.jsx`)
- [x] **Gateway Inventory Table**:
  - View all gateways with IP addresses, MAC addresses, serial numbers, firmware versions, and assigned makes/models.
  - Real-time dynamic connection status (Online / Intermittent / Offline) derived from comparing `last_communicate_time` with `keep_alive_seconds`.
  - Filter by status (**All**, **Online**, **Offline**) and instantaneous full-text search across all fields.
- [x] **Gateway Management Modal/Form**:
  - Create new edge gateways with auto-generated serial keys and IP validation.
  - Edit existing gateway configurations, models, port bindings, and keep-alive parameters.
  - Automatic channel capacity assignment based on Gateway Model specifications (e.g. 4-channel, 8-channel).
- [x] **Multi-Channel RS-485 / Ethernet Architecture**:
  - View all physical/virtual channels per gateway (Slot #1 through #8).
  - Configure Channel protocols (**Modbus RTU**, **Modbus TCP**, **MQTT**, **OPC-UA**).
  - Serial port settings: Baud rate (9600, 19200, 38400, 115200), Parity, Data Bits, Stop Bits, and COM port assignment.
- [x] **Meter Provisioning per Channel**:
  - Add, edit, and detach slave meters within specific gateway channels.
  - Assign Slave IDs (1–247), select Meter Profiles, Makes, Models, and configure primary CT/PT ratios.
- [x] **In-Depth Diagnostic Testing Engine**:
  - **Test Connection Modal**: Simulates sending Modbus query packets and receiving hex responses.
  - Mode selector: **Auto Mode**, **Force Pass**, or **Force Failure**.
  - Live console logs detailing baud rate negotiation, slave ID polling, register read attempts, packet loss, and latency measurement in milliseconds.
  - Automatic status promotion: successful test automatically marks the meter as **Active**.
  - **Quick Inline Test**: Instant one-click connection verification directly from the meter row.

---

### 4. 🎛️ Meter Profile & Register Mapping (`MeterProfileView.jsx`)
- [x] **Dual-Mode User Flow**:
  - **List Mode**: Overview table displaying existing meter profiles with parameter counts, makes, models, and actions.
  - **Create / Edit View**: Comprehensive full-page workbench for register configuration without restrictive modals.
- [x] **Modbus Register Mapping Engine**:
  - Map individual registers with:
    - **Register Address** (e.g., 30001, 40001)
    - **Parameter Key & Display Name** (Voltage, Current, Active Power, Frequency, etc.)
    - **Register Type** (Holding Register, Input Register)
    - **Function Code** (FC 03, FC 04)
    - **Data Type** (Float32, Int16, Int32, UInt16, UInt32, Double64)
    - **Multiplier / Scale Factor** (e.g., 0.1, 0.01, 1.0, 10)
    - **Offset**, **Unit** (V, A, kW, kWh, Hz, kVAR, PF)
    - **Word & Byte Endianness** (AB CD Big Endian, CD AB Little Endian / Word Swapped)
    - **Polling Interval** (seconds)
- [x] **Parameter Dictionary Integration**:
  - Quick auto-fill drawer populated from the global Parameter Dictionary.
- [x] **Profile Import & Export**:
  - Download template and export profile to **CSV / Excel** format.
  - Upload & parse CSV files directly into the register grid.
  - **JSON Export & Import** for quick backup and cross-environment deployment.
  - Duplicate / Clone existing profiles with one click.
- [x] **Live Modbus Polling & Register Diagnostic Console**:
  - Live hex byte frame inspection (e.g. `[TX] 01 03 75 31 00 02 95 CB` -> `[RX] 01 03 04 43 66 66 66 23 45`).
  - Real-time conversion to human-readable engineering values (e.g. Voltage = 230.4 V).

---

### 5. 🏢 Comprehensive Master Data Modules
- [x] **Meter Make Master (`MakeMasterView.jsx`)**:
  - Manage meter manufacturers (Schneider, Rishabh, Secure Meters, Selec, Socomec, Elmeasure, etc.).
  - Duplicate prevention, search, validation, and linked model counter.
- [x] **Meter Model Master (`ModelMasterView.jsx`)**:
  - Manage meter models mapped under their respective parent Make.
  - Filter by manufacturer, search by model name, create, edit, delete.
- [x] **Gateway Make Master (`GatewayMakeMasterView.jsx`)**:
  - Manage hardware edge gateway manufacturers (SaB Systems, Advantech, Siemens, Wago).
- [x] **Gateway Model Master (`GatewayModelMasterView.jsx`)**:
  - **Two-Stage Configuration**:
    - **Stage 1 (Gateway Details)**: Manufacturer, Model Name, Channel count (1–32 slots), and Firmware version.
    - **Stage 2 (Channels & Ports)**: Gateway summary, channel names, and RS-485 port settings (baud rate, parity, slave ID).
  - Validation, duplicate prevention, and state preservation across steps.
- [x] **Parameter Dictionary (`ParameterDictionaryView.jsx`)**:
  - Standardized enterprise dictionary of electrical parameters.
  - Standard parameter keys (e.g. `v_r`, `v_y`, `v_b`, `v_ry`, `i_r`, `active_power_total`, `energy_active_import`, `power_factor_avg`, `thd_v_avg`).
  - Predefined display names and engineering units.
  - **Real-Time Duplicate Detection**: Live visual warning badge, alert panel, red focus ring, and submission prevention when an existing parameter key or display name is entered.
  - Catalog-wide duplicate key tracking indicator in toolbar and table rows.

---

### 6. 🔗 Asset-to-Meter Mapping (`AssetMappingView.jsx`)
- [x] **Industrial Asset Hierarchy**:
  - Link physical meters to enterprise assets (Main Incomer Transformer, Chiller Plant, DG Generator, Solar Farm Inverter, HVAC Air Compressor).
- [x] **Calculation Multipliers**:
  - Set multiplication factors for Overall Multiplier = Meter Multiplier × (External CT Ratio / PT Ratio).
- [x] **Lifecycle & Validity Ranges**:
  - `effective_from` and `effective_to` date boundaries.
  - Active / Inactive switch toggle with immediate recalculation.

---

### 7. ⚙️ Communication Configuration (`CommunicationConfigView.jsx`)
- [x] **Flexible Polling Interval**:
  - Configurable in either **Seconds** or **Minutes** unit.
- [x] **Fine-Tuned Communication Parameters**:
  - Fast cycle telemetry rate for critical alarms (default 2s).
  - Background database logging rate (default 15m).
  - Modbus response timeout threshold (ms) and auto-retry count (1–10).
  - Gateway Keep-Alive ping interval (s).
  - MQTT Broker connection URL and REST API endpoint paths.

---

### 8. 💾 Centralized Data Context (`EnergyDataContext.jsx`)
- [x] Single source of truth for all entities.
- [x] Seamless local persistence via `localStorage` with automated schema fallbacks.
- [x] Realistic mock baseline in `src/mock/initialData.js` allowing immediate offline development and demonstration.

---

## ⏳ Pending Work & Upgrade Roadmap (Next Steps)

To transition this frontend from a high-fidelity prototype / local-first application to an enterprise production platform, the following features and upgrades are planned:

### 🚀 Phase 1: Real Backend & REST / WebSocket API Integration
- [ ] **HTTP API Client Integration**:
  - Replace `localStorage` operations in `EnergyDataContext` with a centralized Axios or Fetch API client.
  - Add request/response interceptors, centralized error handling, and offline caching.
  - Create standard API service files:
    - `src/services/gatewayService.js`
    - `src/services/meterService.js`
    - `src/services/profileService.js`
    - `src/services/assetService.js`
    - `src/services/telemetryService.js`
- [ ] **WebSocket / Server-Sent Events (SSE)**:
  - Connect to a live MQTT broker or backend WebSocket server for genuine real-time telemetry streaming and live gateway heartbeat pings.
- [ ] **Backend Database Connectivity**:
  - Connect with PostgreSQL / TimescaleDB (for time-series energy data) or MongoDB / MySQL for metadata masters.
  - Or direct integration with ThingsBoard Community / Professional REST APIs.

---

### 🔐 Phase 2: Authentication, Authorization & User Management
- [ ] **Authentication Flow**:
  - Login, Register, Forgot Password, and Refresh Token rotation via JWT / OAuth2.
- [ ] **Role-Based Access Control (RBAC)**:
  - Roles: **Super Admin**, **Plant Engineer**, **Operator**, and **Auditor / Viewer**.
  - Permission gating for sensitive operations (e.g., modifying meter register profiles, changing baud rates, or altering communication config should require Engineer/Admin privileges).
- [ ] **Multi-Tenant / Multi-Plant Support**:
  - Facility / Factory / Building site switcher in the top navigation.

---

### 📊 Phase 3: Analytics, Energy Charts & Reporting
- [ ] **Interactive Visualizations (Recharts / ECharts / Chart.js)**:
  - **Live Power Curve**: Dynamic time-series line chart for kW and kVA demand.
  - **Energy Consumption Trend**: Bar charts showing shift-wise, daily, weekly, and monthly kWh consumption.
  - **Power Quality & Harmonics**: Voltage & current THD spectrum charts, phasor diagrams, and phase imbalance visualization.
  - **Load Profile & Heatmaps**: Peak demand vs. off-peak demand heatmaps.
- [ ] **Automated Energy Reports**:
  - Shift-wise, Daily, and Monthly energy accounting reports.
  - Export capabilities in **PDF** (with company letterhead), **Excel (.xlsx)**, and **CSV**.
  - Scheduled automated report emails.
- [ ] **Tariff & Cost Calculator**:
  - Time-of-Day (ToD) tariff structure engine (Peak, Normal, Off-Peak pricing).
  - Carbon footprint and CO2 emission equivalency calculators.

---

### 🚨 Phase 4: Alarms, Thresholds & Notification Engine
- [ ] **Alarm Rules Configuration View**:
  - Set condition rules (e.g., Voltage > 250V, Power Factor < 0.85, kW > Maximum Demand limit, Gateway Offline > 2 mins).
- [ ] **Live Notification Center**:
  - Top header notification bell with real-time audio/visual alert badges.
  - Critical, Warning, and Info severity levels.
- [ ] **Alarm Acknowledgment & History Audit**:
  - Operator acknowledge log with timestamp, operator remarks, and resolution status.
  - Multi-channel notification delivery: Email, SMS, WhatsApp, and Webhooks.

---

### 🗺️ Phase 5: Single-Line Diagram (SLD) & Facility Floor Map
- [ ] **Interactive SLD (Electrical Single Line Diagram)**:
  - Interactive SVG / Canvas schematic of the plant power distribution network.
  - Visual breakers showing open/closed state with live voltage, current, and active power tooltips on feeders.
- [ ] **Geographical / GIS Plant Map**:
  - Map view showing physical gateway locations across different factory sheds, substations, or remote solar plants.

---

### 🛠️ Phase 6: Code Quality, Testing & Infrastructure
- [ ] **URL-Based Routing**:
  - Upgrade state-based navigation (`activeTab`) to `react-router-dom` (v6 or v7) for deep URL linking (e.g. `/devices/:id`, `/profiles/:id/edit`), browser back/forward history, and query parameter search.
- [ ] **Form Validation Framework**:
  - Integrate **React Hook Form** with **Zod** schema validation for cleaner error handling and form resets.
- [ ] **Automated Testing Suite**:
  - Unit tests with **Vitest**.
  - Component and user interaction tests with **React Testing Library**.
  - End-to-end integration tests using **Playwright** or **Cypress**.
- [ ] **Docker & Production Deployment**:
  - Multi-stage `Dockerfile` (Node.js build -> Nginx Alpine reverse proxy).
  - Docker Compose configuration for local or on-premise SCADA deployment.
  - CI/CD pipeline script (GitHub Actions / GitLab CI).

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd vishalini-SaB-Energy

# Install dependencies
npm install
```

### Running the Local Development Server
```bash
npm run dev
```
The application will launch at: `http://localhost:5173`

### Building for Production
```bash
npm run build
```
Build artifacts will be compiled into the `dist/` directory.

### Code Linting
```bash
npm run lint
```

---

## 💡 Quick Summary Checklist

| Module | Status | Next Milestone |
| :--- | :---: | :--- |
| **Theme System (Light/Dark)** | ✅ Completed | System preference auto-detection |
| **Header & Sidebar Navigation** | ✅ Completed | React Router URL routes (`react-router-dom`) |
| **Dashboard Telemetry KPIs** | ✅ Completed | Interactive Recharts historical graphs |
| **Gateway Master (CRUD & Channels)** | ✅ Completed | Live REST API & ThingsBoard synchronization |
| **Meter Provisioning per Channel** | ✅ Completed | Live Modbus RTU / TCP polling integration |
| **Diagnostic Test Engine** | ✅ Completed | Real socket-level Modbus frame exchange |
| **Meter Profile & Register Mapping** | ✅ Completed | Server-side profile storage & validation |
| **CSV / JSON Profile Import & Export** | ✅ Completed | Bulk batch validation against dictionary |
| **Make & Model Masters (Gateway & Meter)** | ✅ Completed | Server CRUD endpoints |
| **Parameter Dictionary** | ✅ Completed | Custom formula parameters (calculated registers) |
| **Asset-to-Meter Mapping** | ✅ Completed | Tree-based asset hierarchy (Parent-Child) |
| **Communication Settings** | ✅ Completed | Gateway remote OTA configuration push |
| **Authentication & RBAC** | ⏳ Pending | JWT login, role permissions, protected routes |
| **Alarming & Notification Hub** | ⏳ Pending | Real-time threshold alerts & audit logs |
| **Electrical Single-Line Diagram (SLD)** | ⏳ Pending | Interactive vector schematic view |

---

*Authored for the SaB Energy Development Team.*