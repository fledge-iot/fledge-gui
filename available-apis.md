# Fledge Home Dashboard - Available APIs

**These APIs are currently working and being used in the home dashboard**

Base URL: `http://localhost:8081/fledge`

---

## 📦 Asset Management APIs

### 1. Get All Assets
- **Endpoint:** `GET /asset`
- **Purpose:** Retrieve all assets in the system
- **Used for:** Powers the "Total Assets" summary card
- **Returns:** List of assets with names, datapoint counts, and timestamps

**Example Response:**
```json
[
  {
    "name": "sensor_data",
    "count": 1250,
    "timestamp": "2024-01-20T10:30:00Z"
  }
]
```

### 2. Get Total Datapoints
- **Endpoint:** `GET /track/storage/assets`
- **Purpose:** Get detailed asset storage information and datapoint tracking
- **Used for:** Powers the "Total Datapoints" summary card
- **Returns:** Asset storage data with datapoint details

**Example Response:**
```json
{
  "assets": [
    {
      "name": "sensor_01",
      "count": 500,
      "datapoints": [
        {"name": "temperature", "type": "float"},
        {"name": "humidity", "type": "float"}
      ]
    }
  ],
  "count": 1000
}
```

---

## 🔧 Service Management APIs

### 3. Get Services
- **Endpoint:** `GET /service`
- **Purpose:** Retrieve all services
- **Used for:** Powers services summary cards and service health table
- **Returns:** List of services with status and configuration

**Example Response:**
```json
{
  "services": [
    {
      "name": "Temperature Sensor",
      "type": "south",
      "schedule_enabled": true,
      "status": "running",
      "address": "localhost",
      "management_port": 42001,
      "service_port": 37001,
      "protocol": "http"
    }
  ]
}
```

### 4. Get North Tasks
- **Endpoint:** `GET /task`
- **Purpose:** Retrieve all north (data sending) tasks
- **Returns:** List of north tasks with status and configuration

**Example Response:**
```json
[
  {
    "name": "PI Server",
    "enabled": true,
    "status": "running",
    "type": "north"
  }
]
```

---

## 📊 Statistics & Monitoring APIs

### 5. Get Current Statistics
- **Endpoint:** `GET /statistics`
- **Purpose:** Get current system statistics and metrics
- **Used for:** Statistics History section and charts
- **Returns:** Current statistics with keys, values, and timestamps

**Example Response:**
```json
[
  {
    "key": "READINGS",
    "value": 1542,
    "timestamp": "2024-01-20T10:30:00Z"
  },
  {
    "key": "SENT",
    "value": 1489,
    "timestamp": "2024-01-20T10:30:00Z"
  }
]
```

### 6. Get Statistics History
- **Endpoint:** `GET /statistics/history`
- **Purpose:** Get historical statistics data for charting
- **Parameters:**
  - `minutes` (optional) - Time range: 10, 30, or 60 minutes
- **Used for:** Statistics History charts and trend analysis
- **Returns:** Historical statistics with time series data

**Example Response:**
```json
{
  "statistics": [
    {
      "key": "READINGS",
      "value": 1542,
      "timestamp": "2024-01-20T10:30:00Z",
      "history": [
        {
          "timestamp": "2024-01-20T10:00:00Z",
          "value": 1420
        },
        {
          "timestamp": "2024-01-20T10:15:00Z",
          "value": 1481
        }
      ]
    }
  ]
}
```

### 7. Get Ping Statistics
- **Endpoint:** `GET /ping`
- **Purpose:** Get system ping statistics for data flow monitoring
- **Used for:** Summary cards (Received, Sent, Purged, Alerts counts)
- **Returns:** Data flow statistics

**Example Response:**
```json
{
  "dataRead": 15420,
  "dataSent": 14890,
  "dataPurged": 530,
  "alerts": 5
}
```

---

## 📋 System Information APIs

### 8. Get System Alerts
- **Endpoint:** `GET /alert`
- **Purpose:** Retrieve current system alerts and notifications
- **Used for:** Alert notifications and system status
- **Returns:** List of active alerts with details

**Example Response:**
```json
{
  "alerts": [
    {
      "id": "alert_001",
      "message": "High CPU usage detected",
      "level": "warning",
      "timestamp": "2024-01-20T10:30:00Z",
      "source": "system_monitor",
      "acknowledged": false
    }
  ]
}
```

### 9. Get System Logs
- **Endpoint:** `GET /syslog`
- **Purpose:** Retrieve system logs with filtering options
- **Parameters:**
  - `limit` (optional) - Max logs to return (default: 50)
  - `offset` (optional) - Number to skip (default: 0)
  - `level` (optional) - Filter by: debug, info, warning, error, fatal
  - `source` (optional) - Filter by log source/service
  - `keyword` (optional) - Search in log messages
- **Used for:** System logs table and error rate calculations
- **Returns:** System logs with metadata

**Example Response:**
```json
{
  "logs": [
    {
      "timestamp": "2024-01-20T10:30:00Z",
      "level": "error",
      "service": "temperature_sensor",
      "message": "Failed to read sensor data",
      "source": "south_service"
    }
  ],
  "totalCount": 1250
}
```

### 10. Get Schedules
- **Endpoint:** `GET /schedule`
- **Purpose:** Retrieve system task schedules
- **Used for:** Service management and system logs filtering
- **Returns:** List of scheduled tasks

**Example Response:**
```json
[
  {
    "name": "data_collection",
    "enabled": true,
    "type": "INTERVAL",
    "repeat": "00:00:30",
    "time": "00:00:00"
  }
]
```

---

## 📈 Usage Summary

### **Dashboard Sections Powered by These APIs:**

1. **Summary Cards** 
   - Total Assets (`/asset`)
   - Total Datapoints (`/track/storage/assets`)
   - Service counts (`/service`, `/task`)
   - Data flow metrics (`/ping`)

2. **Statistics History**
   - Current stats (`/statistics`)
   - Historical trends (`/statistics/history`)

3. **System Logs**
   - Log display (`/syslog`)
   - Service filtering (`/schedule`)

4. **Error Rate Monitoring**
   - Log analysis (`/syslog`)

5. **System Health**
   - Service status (`/service/available`)
   - Alert monitoring (`/alert`)
---

*These APIs form the foundation of the Fledge home dashboard and are currently operational and providing real data to the user interface.* 