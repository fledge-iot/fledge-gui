# Fledge Home Dashboard - Required APIs

**These APIs are NOT currently available and need to be implemented. The dashboard currently uses dummy/fake data for these features.**

Base URL: `http://localhost:8081/fledge`

---

## 🚨 Critical Missing APIs

These APIs are essential for a production-ready dashboard. Currently, the dashboard shows fake/random data for these features.

### 1. System Health API
- **Endpoint:** `GET /health/system`
- **Problem:** Dashboard shows random CPU, Memory, and Disk usage
- **Current Code:** Uses `Math.random()` to generate fake percentages
- **Impact:** System administrators can't see real resource usage

**What's currently broken:**
```typescript
// This is generating FAKE data right now:
cpu: {
    usage: Math.floor(Math.random() * 40) + 20, // Random 20-60%
    cores: 4,
    loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
},
memory: {
    usage: Math.floor(Math.random() * 30) + 40, // Random 40-70%
    total: 16384,
    available: Math.floor(Math.random() * 8000) + 4000
}
```

**What we need this API to return:**
```json
{
  "overall": "healthy",
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
- **Endpoint:** `GET /metrics/monitoring`
- **Problem:** "Buffered Readings" shows random numbers
- **Current Code:** `Math.floor(Math.random() * 100)` 
- **Impact:** Error monitoring metrics are unreliable
- **Parameters:** `timeRange` (1h, 3h, 12h, 24h)

**What's currently broken:**
```typescript
// This shows FAKE buffered readings:
bufferedReadings: Math.floor(Math.random() * 100), // Random 0-100
```

**What we need this API to return:**
```json
{
  "summary": {
    "totalErrorRate": 2.3,
    "totalErrors": 45,
    "discardedReadings": 12,
    "bufferedReadings": 156,
    "failedOperations": 8,
    "serviceErrorCounts": {
      "temperature_sensor": 15,
      "pressure_sensor": 8,
      "storage_service": 2
    },
    "lastUpdated": "2024-01-20T10:30:00Z"
  },
  "history": {
    "timeRange": {
      "start": "2024-01-20T07:30:00Z",
      "end": "2024-01-20T10:30:00Z"
    },
    "data": [
      {
        "timestamp": "2024-01-20T08:00:00Z",
        "errorRate": 1.8,
        "totalErrors": 3,
        "discardedReadings": 1,
        "intervalStart": "2024-01-20T07:45:00Z",
        "intervalEnd": "2024-01-20T08:00:00Z"
      }
    ]
  }
}
```

**Dashboard sections affected:**
- Error Rate Monitoring summary cards
- Error Rate Trends chart
- Buffer monitoring metrics

---

### 3. Service Health API
- **Endpoint:** `GET /metrics/health`
- **Problem:** Service uptime and error rates use fake correlation logic
- **Current Code:** Complex dummy algorithms to simulate realistic data
- **Impact:** Service health monitoring is not based on real metrics
- **Parameters:** `timeRange` (1h, 3h, 12h, 24h)

**What's currently broken:**
```typescript
// These functions generate FAKE service metrics:
private generateDummyErrorRate(serviceName: string): number {
    // Uses service name hash to create fake but consistent error rates
}

private getRealisticUptime(errorRate: number, serviceStatus: string): number {
    // Creates fake correlation between error rate and uptime
}
```

**What we need this API to return:**
```json
{
  "services": [
    {
      "name": "Fledge Storage",
      "type": "Storage",
      "status": "running",
      "errorRate": 0.5,
      "uptime": 99.2,
      "lastError": null,
      "lastErrorTime": null,
      "responseTime": 15.6,
      "throughput": 1250.5,
      "memoryUsage": 512.8,
      "cpuUsage": 12.3,
      "address": "localhost",
      "managementPort": 42269,
      "servicePort": 37895,
      "protocol": "http"
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

## 📋 Implementation Priority

### **🔥 URGENT (Must implement for production)**
1. **System Health API** - Replace fake CPU/Memory/Disk data
2. **Error Monitoring API** - Replace fake buffer statistics  
3. **Service Health API** - Replace fake uptime/error correlation

---

## 💰 Business Impact

### **Without these APIs:**
- ❌ **Fake system monitoring** - Admins can't see real resource usage
- ❌ **Unreliable error tracking** - Buffer metrics are random numbers
- ❌ **Misleading service health** - Uptime/error correlation is simulated
- ❌ **Production risks** - Dashboard not suitable for real monitoring

### **With these APIs implemented:**
- ✅ **Real-time system monitoring** - Accurate CPU, Memory, Disk usage
- ✅ **Accurate error tracking** - Real buffer statistics and error metrics
- ✅ **Reliable service health** - True uptime and performance data
- ✅ **Production-ready dashboard** - Suitable for 24/7 monitoring
- ✅ **Proper alerting** - Alerts based on real thresholds, not random data

---

## 🎯 Current Status Summary

| Feature | Status | Data Source | Impact |
|---------|--------|-------------|---------|
| CPU Usage | ❌ Fake | `Math.random()` | High |
| Memory Usage | ❌ Fake | `Math.random()` | High | 
| Disk Usage | ❌ Fake | `Math.random()` | High |
| Service Uptime | ❌ Fake | Correlation logic | Medium |
| Service Error Rates | 🔶 Partial | Log analysis + fake | Medium |
| Error Classification | 🔶 Basic | Text parsing | Low |

**Legend:**
- ❌ Fake = Using random/dummy data
- 🔶 Partial = Some real data, some fake
- ✅ Real = Using actual system data

---

*Implementing these APIs will transform the dashboard from a demo/prototype into a production-ready monitoring solution.* 