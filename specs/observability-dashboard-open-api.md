# Fledge Home Dashboard - Required APIs

**These APIs are NOT currently available and need to be implemented. The dashboard currently uses dummy/fake data for these features.**

Base URL: `http://localhost:8081/fledge`

---

## Missing APIs

These APIs are essential for a production-ready dashboard. Currently, the dashboard shows fake/random data for these features.

### 1. System Health API
- **Endpoint:** `GET /system/health`
- **Problem:** Dashboard shows random CPU, Memory, and Disk usage
- **Current Code:** Uses `Math.random()` to generate fake percentages
- **Impact:** System administrators can't see real resource usage

**What we need this API to return:**
```json
{
  "health": "healthy",
  "timestamp": "2024-01-20T10:30:00Z",
  "resources": {
    "cpu": {
      "usage": 45.2,
      "cores": 4,
      "loadAverage": [0.8, 0.9, 1.1]
    },
    "memory": {
      "usage": 68.5,
      "total": 16384,
      "available": 5120,
      "used": 11264
    },
    "disk": {
      "usage": 72.3,
      "total": 500000,
      "available": 138500,
      "used": 361500
    },
    "network": {
      "interfaces": [
        {
          "name": "eth0",
          "status": "up",
          "speed": "1000Mbps",
          "bytesIn": 1024000,
          "bytesOut": 512000
        }
      ]
    }
  },
  "services": {
    "totalCount": 12,
    "runningCount": 10,
    "errorCount": 1,
    "stoppedCount": 1
  }
}
```

**Dashboard sections affected:**
- System Health resource usage cards (CPU, Memory, Disk)
- Color-coded threshold alerts (Red >80%, Amber 70-80%, Green <70%)

---

### 2. Error Monitoring API
- **Endpoint:** `GET /system/monitor`
- **Problem:** Shows random numbers
- **Current Code:** `Math.floor(Math.random() * 100)` 
- **Impact:** Error monitoring metrics are unreliable
- **Parameters:** `timeRange` (1h, 3h, 12h, 24h)

**What we need this API to return:**
```json
{
  "summary": {
    "totalErrorRate": 2.3,
    "totalErrors": 45,
    "discardedReadings": 12,
    "failedOperations": 8,
    "serviceErrorCounts": {
      "temperature_sensor": 15,
      "pressure_sensor": 8,
      "storage_service": 2
    },
    "lastUpdated": "2024-01-20T10:30:00Z"
  }
}
```

**Dashboard sections affected:**
- Error Rate Monitoring summary cards
- Error Rate Trends chart

---

### 3. Service Health API
- **Endpoint:** Extend existing endpoint `GET /service` response
- **Problem:** Service uptime and error rates use fake correlation logic
- **Current Code:** Complex dummy algorithms to simulate realistic data
- **Impact:** Service health monitoring is not based on real metrics

**What we need this API to return:**
```json
{
  "services": [
    {   
      "name": "Fledge Storage",
      "type": "Storage",
      "address": "localhost",
      "management_port": 33753,
      "service_port": 34823,
      "protocol": "http",
      "status": "running",
      "errorRate": 0.5,
      "uptime": 99.2,
      "lastError": null,
      "lastErrorTime": null,
      "memoryUsage": 512.8,
      "cpuUsage": 12.3,
    }
  ],
  "summary": {
    "totalServices": 12,
    "servicesWithErrors": 3,
    "averageErrorRate": 1.8,
    "averageUptime": 96.5,
    "healthyServices": 9,
    "degradedServices": 2,
    "criticalServices": 1
  }
}
```

**Dashboard sections affected:**
- System Health service table
- Service error rates and uptime correlation
- Performance metrics per service

---