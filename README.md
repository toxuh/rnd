# 🎲 True Random Generator (RND)

A Next.js application that generates **truly random** numbers and data using **physical sensor fluctuations** from ESP32 devices, not pseudo-random algorithms.

## 🌟 What Makes This Special

Unlike traditional random number generators that use mathematical algorithms (pseudo-random), this project generates **true randomness** by:

1. **Physical Sensors**: ESP32 microcontrollers with high-precision sensors (temperature, humidity, pressure, accelerometer, etc.)
2. **Sensor Noise**: Raw, unfiltered sensor data includes natural physical fluctuations and electronic noise
3. **True Entropy**: Physical world randomness provides genuine entropy, not algorithmic patterns
4. **Cryptographic Quality**: Suitable for security applications requiring true randomness

## 🔬 How True Randomness Works

### The Physics Behind It

```
Physical World → ESP32 Sensors → Raw Data + Noise → SHA-256 Hash → Random Output

Sources of Entropy:
├── Temperature Fluctuations (thermal noise)
├── Atmospheric Pressure Variations
├── Humidity Changes
├── Electronic Component Noise
├── Micro-vibrations
└── Quantum Effects in Semiconductors
```

### The Process

1. **Sensor Reading**: ESP32 devices continuously read multiple high-precision sensors
2. **Data Concatenation**: Raw sensor values are combined into a string (noise included!)
3. **Hash Generation**: SHA-256 creates deterministic but unpredictable output
4. **Number Extraction**: Hash bits are mapped to desired ranges/formats

### Why This Matters

- **🔐 Cryptographic Security**: True entropy for passwords, keys, tokens
- **🎯 Statistical Quality**: Passes randomness tests that pseudo-random fails
- **🌍 Physical Basis**: Rooted in quantum mechanics and thermodynamics
- **🚫 No Patterns**: Cannot be predicted or reproduced

## 🚀 Features

### Random Generation Types

- **Numbers**: Integers within specified ranges
- **Floats**: Decimal numbers with optional ranges
- **Booleans**: True/false values
- **Strings**: Custom length with character sets
- **Choices**: Pick from arrays of options
- **Colors**: Hex colors and HSL values
- **Dates**: Random dates within ranges
- **UUIDs**: Version 4 universally unique identifiers
- **Passwords**: Secure passwords with special characters
- **Arrays**: Shuffle and weighted selection
- **Gradients**: CSS gradient strings

### Technical Features

- **🔄 React Query Integration**: Caching, loading states, error handling
- **🛡️ TypeScript**: 100% type-safe, zero `any` types
- **🧪 Comprehensive Testing**: Full test coverage
- **📱 Responsive UI**: Modern, accessible interface
- **⚡ Fast Performance**: Optimized API routes
- **🔒 Input Validation**: Robust error handling

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- Yarn package manager
- ESP32 device with sensors (for true randomness)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rnd
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env.local file
   RND_SERVER_URL=http://your-esp32-device-ip:port
   ```

4. **Run development server**
   ```bash
   yarn dev
   ```

5. **Open application**
   ```
   http://localhost:3000
   ```

## 🔧 ESP32 Hardware Setup

### Required Components

- ESP32 development board
- High-precision sensors:
  - BME280 (temperature, humidity, pressure)
  - MPU6050 (accelerometer, gyroscope)
  - Optional: Light sensors, microphones, etc.

### ESP32 Code Structure

```cpp
// Pseudo-code for ESP32 server
void setup() {
  // Initialize sensors
  // Start web server on /get-random-string
}

void handleRandomString() {
  String sensorData = "";
  sensorData += readTemperature();    // Include noise
  sensorData += readHumidity();       // Raw values
  sensorData += readPressure();       // No filtering
  sensorData += readAcceleration();   // All axes
  sensorData += millis();             // Timing variations

  server.send(200, "text/plain", sensorData);
}
```

## 🔒 Security Features

This application implements comprehensive security measures:

- **API Key Authentication**: All requests require valid API keys
- **Rate Limiting**: Prevents abuse with configurable limits
- **Request Validation**: Input sanitization and size limits
- **Security Monitoring**: Automatic threat detection and blocking
- **Origin Validation**: CORS protection for production
- **Request Signing**: Optional cryptographic verification

See [Security Documentation](docs/SECURITY.md) for detailed information.

### Quick Security Setup

1. **Set API Keys** in your environment:
```bash
API_KEY_MAIN=rnd_your_secure_main_key
API_KEY_ADMIN=rnd_your_secure_admin_key
```

2. **Include API Key** in requests:
```bash
curl -H "x-api-key: your_api_key" https://rnd.so/api/rnd/number
```

## 📚 API Reference

### Generate Random Data

```http
POST /api/rnd/{type}
Content-Type: application/json
x-api-key: your_api_key_here

{
  "min": 1,
  "max": 100,
  "length": 10,
  "choices": ["option1", "option2"],
  "from": "2023-01-01",
  "to": "2023-12-31"
}
```

### Supported Types

| Type | Parameters | Example Response |
|------|------------|------------------|
| `number` | `min`, `max` | `42` |
| `boolean` | none | `true` |
| `float` | `min`, `max` | `3.14159` |
| `choice` | `choices[]` | `"selected_item"` |
| `string` | `length` | `"aB3xY9"` |
| `color` | none | `"#ff6b35"` |
| `date` | `from`, `to` | `"2023-06-15T10:30:00Z"` |
| `uuid` | none | `"123e4567-e89b-12d3-a456-426614174000"` |
| `password` | `length` | `"K9$mP2@vX"` |

## 🎯 Usage Examples

### React Hooks

```typescript
import { useFetchRandomNumber, useFetchRandomChoice } from '@/hooks/rnd/useFetchRnd';

// Generate random number
const { mutate: generateNumber, data: number, isPending } = useFetchRandomNumber();
generateNumber({ min: 1, max: 100 });

// Random choice
const { mutate: makeChoice, data: choice } = useFetchRandomChoice<string>();
makeChoice({ choices: ['apple', 'banana', 'orange'] });
```

### Direct API Calls

```typescript
// Random number
const response = await fetch('/api/rnd/number', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ min: 1, max: 100 })
});
const { result } = await response.json(); // 42

// Random password
const response = await fetch('/api/rnd/password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ length: 12 })
});
const { result } = await response.json(); // "K9$mP2@vX4nQ"
```

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run linting
yarn lint

# Build for production
yarn build
```

## 🏗️ Architecture

### Service Layer
- **`services/rnd.service.ts`**: Core randomness generation logic
- **Physical entropy**: Fetches true random strings from ESP32
- **Hash-based mapping**: SHA-256 for deterministic distribution

### API Layer
- **`app/api/rnd/[name]/route.ts`**: RESTful endpoints for each random type
- **Input validation**: Type checking and range validation
- **Error handling**: Comprehensive error responses

### Frontend Layer
- **`hooks/rnd/useFetchRnd.ts`**: React Query hooks for data fetching
- **`app/page.tsx`**: Interactive UI for testing all random types
- **Type safety**: 100% TypeScript with zero `any` types

## 🔒 Security Considerations

### True Randomness Benefits
- **Cryptographic strength**: Suitable for security tokens, passwords, keys
- **Unpredictable**: Cannot be reverse-engineered or predicted
- **Non-reproducible**: Each generation is unique

### Best Practices
- **Environment isolation**: Keep ESP32 URL secure
- **Rate limiting**: Consider implementing request limits
- **Monitoring**: Log unusual patterns or failures

## 🔬 Scientific Background

### Why Physical Randomness Matters

Traditional pseudo-random number generators (PRNGs) like Mersenne Twister or Linear Congruential Generators are:
- **Deterministic**: Same seed = same sequence
- **Periodic**: Eventually repeat patterns
- **Predictable**: Can be reverse-engineered

Physical randomness sources provide:
- **True entropy**: Based on quantum mechanical processes
- **Non-deterministic**: Cannot be predicted even with perfect knowledge
- **Cryptographically secure**: Suitable for security applications

### Entropy Sources in This Project

1. **Thermal Noise**: Random motion of electrons in conductors
2. **Atmospheric Fluctuations**: Pressure and humidity variations
3. **Electronic Component Variations**: Manufacturing tolerances and aging
4. **Quantum Effects**: Fundamental randomness in semiconductor junctions
5. **Environmental Factors**: Vibrations, electromagnetic interference

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Ensure no `any` types (ESLint enforced)
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **ESP32 Community**: For excellent sensor libraries
- **Physical Randomness Research**: NIST guidelines for true random number generation
- **Quantum Physics**: The fundamental source of true randomness in nature

---

**🎲 Experience true randomness powered by the physical world!**
