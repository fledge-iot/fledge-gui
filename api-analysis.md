# Fledge Home Dashboard - API Analysis & Requirements

## Overview

This document provides a comprehensive analysis of the **Error Rate Monitoring** and **System Health** sections in the Fledge home dashboard, detailing current implementation, available APIs, and required APIs.

## 📊 Section 1: Error Rate Monitoring

### **What it does in simple terms:**
The Error Rate Monitoring section tracks and visualizes errors happening in your Fledge system. It shows:
- How many errors are occurring
- What types of errors are happening
- Trends over time
- Which services are having problems

### **Current Implementation:**

#### **📈 Data Sources:**
- **✅ Real Data**: System logs parsed from `SystemLogComponent`
- **✅ Partial Real**: Service information from `servicesApiService.getAllServices()`
- **❌ Mock Data**: Buffered readings (`Math.floor(Math.random() * 100)`)

#### **🔍 What it displays:**

**1. Summary Cards (4 tiles):**
- **Error Rate %** - Calculated as: `(Total Errors / Total Log Entries) × 100`
- **Total Errors** - Count of logs with level 'ERROR', 'FATAL', 'EXCEPTION'
- **Discarded Readings** - Errors containing "discard" in message
- **Buffered Readings** - **DUMMY DATA** (random number 0-100)

**2. Error Rate Trends Chart:**
- Shows error rate percentage over time
- Shows discarded readings trend
- Time ranges: 1h, 3h, 12h, 24h
- Data points calculated from actual log parsing

**3. Service Error Metrics Table:**
- Service names from real API
- Error rates calculated from logs
- Uptime correlation with error rates (realistic dummy logic)

#### **🔢 How "Total Operations" is Calculated:**
```typescript
const totalLogs = allLogs.filter(log => {
    if (!log.timestamp) return false;
    const logTime = new Date(log.timestamp);
    return logTime >= cutoffTime;  // Within selected time range
}).length;
```

**Current Logic**: 
- **Total Operations = ALL log entries** (DEBUG, INFO, WARNING, ERROR, FATAL)
- **This is problematic** because log entries ≠ actual operations

#### **🧮 Error Rate Formula:**
```typescript
const errorRate = totalLogs > 0 ? (totalErrors / totalLogs) * 100 : 0;
```

**Formula**: `Error Rate = (Error Logs / Total Logs) × 100`

---

## 🏥 Section 2: System Health

### **What it does in simple terms:**
The System Health section monitors the overall health of your Fledge system, including:
- CPU, Memory, and Disk usage
- Service status and uptime
- Network connectivity
- Resource utilization

### **Current Implementation:**

#### **📊 Data Sources:**
- **❌ Mock Data**: All system resources (CPU, Memory, Disk) using `Math.random()`
- **✅ Real Data**: Service counts and statuses from actual services
- **✅ Partial Real**: Service error rates from log analysis

#### **🔍 What it displays:**

**1. Resource Usage Cards (3 tiles):**
- **CPU Usage** - **DUMMY DATA** (random 20-60%)
- **Memory Usage** - **DUMMY DATA** (random 40-70%)
- **Disk Usage** - **DUMMY DATA** (random 60-80%)

**2. Service Health Table:**
- Service names, types, status (real)
- Error rates (calculated from logs)
- Uptime (correlated with error rates using dummy logic)

**3. Color-coded Thresholds:**
- **Green**: < 70% usage
- **Amber**: 70-80% usage  
- **Red**: > 80% usage

#### **🔄 Service Status Correlation:**
The system creates realistic correlations between:
- **Service Status** → **Error Rate** → **Uptime**
- Failed services have high error rates and low uptime
- Running services have lower error rates and higher uptime

---

## 🔧 Available APIs (Currently Working)

### **1. Asset Management**
- `GET /fledge/asset` - Get all assets
- `GET /fledge/asset/storage` - Get asset storage tracking
- **Usage**: Powers the summary cards (Total Assets, Total Datapoints)

### **2. Service Management**
- `GET /fledge/service` - Get south services
- `GET /fledge/service/available` - Get all services
- `GET /fledge/task` - Get north tasks
- **Usage**: Powers service-related summary cards and service health table

### **3. Statistics & Monitoring**
- `GET /fledge/statistics` - Get current statistics
- `GET /fledge/statistics/history` - Get historical statistics
- `GET /fledge/ping` - Get ping statistics
- **Usage**: Powers the Statistics History charts and summary metrics

### **4. System Information**
- `GET /fledge/log` - Get system logs
- `GET /fledge/schedule` - Get schedules
- `GET /fledge/alert` - Get system alerts
- **Usage**: Powers system logs table and error rate calculations

---

## 🚨 Required APIs (Currently Missing)

### **1. System Health API - `GET /fledge/health/system`**

**Why needed**: Currently using random numbers for all system resources

**Current dummy implementation:**
```typescript
resources: {
    cpu: {
        usage: Math.floor(Math.random() * 40) + 20, // 20-60%
        cores: 4,
        loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
    },
    memory: {
        usage: Math.floor(Math.random() * 30) + 40, // 40-70%
        total: 16384,
        available: Math.floor(Math.random() * 8000) + 4000
    },
    disk: {
        usage: Math.floor(Math.random() * 20) + 60, // 60-80%
        total: 500000,
        available: Math.floor(Math.random() * 200000) + 100000
    }
}
```

**Required response structure:**
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
    }
  }
}
```

---

### **2. Error Monitoring API - `GET /fledge/metrics/error-monitoring`**

**Why needed**: Currently using random numbers for buffered readings and needs better error classification

**Current dummy implementation:**
```typescript
bufferedReadings: Math.floor(Math.random() * 100), // Keep mock for now
```

**Required response structure:**
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
      "pressure_sensor": 8
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
        "discardedReadings": 1
      }
    ]
  }
}
```

---

### **3. Service Health API - `GET /fledge/metrics/service-health`**

**Why needed**: Currently using dummy correlation logic for uptime and error rates

**Current dummy implementation:**
```typescript
private generateDummyErrorRate(serviceName: string): number {
    // Uses service name hash to generate consistent but fake error rates
    const nameHash = serviceName.split('').reduce((hash, char) => {
        return char.charCodeAt(0) + ((hash << 5) - hash);
    }, 0);
    // ... complex dummy logic
}

private getRealisticUptime(errorRate: number, serviceStatus: string): number {
    // Creates realistic correlation between error rate and uptime
    // but still uses dummy calculations
}
```

**Required response structure:**
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
      "cpuUsage": 12.3
    }
  ],
  "summary": {
    "totalServices": 12,
    "servicesWithErrors": 3,
    "averageErrorRate": 1.8,
    "averageUptime": 96.5
  }
}
```

---

### **4. Buffer Statistics API - `GET /fledge/metrics/buffer-stats`**

**Why needed**: Currently using random numbers for buffered readings

**Required response structure:**
```json
{
  "bufferedReadings": 156,
  "bufferCapacity": 10000,
  "bufferUtilization": 1.56,
  "queueStats": {
    "inbound": {
      "size": 45,
      "maxSize": 1000,
      "averageProcessingTime": 12.5
    },
    "outbound": {
      "size": 23,
      "maxSize": 1000,
      "averageProcessingTime": 8.3
    }
  },
  "bufferHealth": "healthy"
}
```

---

### **5. Enhanced Structured Logs API - `GET /fledge/logs/structured`**

**Why needed**: Current log parsing is basic and lacks detailed error classification

**Current implementation**: Basic parsing of log text without structured metadata

**Required response structure:**
```json
{
  "logs": [
    {
      "id": "log_001",
      "timestamp": "2024-01-20T10:30:00Z",
      "level": "error",
      "service": "temperature_sensor",
      "source": "sensor_reader",
      "message": "Failed to read sensor data: timeout after 5 seconds",
      "category": "timeout",
      "context": {
        "requestId": "req_12345",
        "operation": "read_sensor",
        "duration": 5000,
        "errorCode": "TIMEOUT_001"
      },
      "severity": 7,
      "resolved": false
    }
  ],
  "aggregations": {
    "errorCounts": {
      "timeout": 15,
      "connection": 8,
      "validation": 3
    },
    "serviceCounts": {
      "temperature_sensor": 25,
      "storage_service": 10
    }
  }
}
```

---

## 📋 Implementation Priority

### **High Priority (Critical for Production)**
1. **System Health API** - Replace random resource usage with real data
2. **Error Monitoring API** - Replace random buffered readings with real buffer stats
3. **Service Health API** - Replace dummy uptime/error correlation with real metrics

### **Medium Priority (Enhanced Features)**
4. **Buffer Statistics API** - Provide detailed buffer and queue information
5. **Enhanced Structured Logs API** - Better error classification and metadata

### **Low Priority (Optimizations)**
6. **Improved Statistics APIs** - Add more granular metrics and better time-based queries

---

## 🔍 Key Insights

1. **Good Foundation**: The dashboard already uses many real APIs for core functionality
2. **Missing System Metrics**: Critical gap in system resource monitoring (CPU, Memory, Disk)
3. **Partial Error Tracking**: Error rates are calculated from real logs, but buffer stats are fake
4. **Smart Correlations**: The dummy logic creates realistic relationships between metrics
5. **Ready for Real Data**: The UI is designed to handle real data - just need to replace dummy sources

---

## 🎯 Business Value

**Implementing these APIs will provide:**
- **Real-time system monitoring** instead of fake numbers
- **Accurate error tracking** for better troubleshooting
- **Proper resource alerting** based on actual usage
- **Reliable service health** metrics for operations
- **Production-ready dashboard** for monitoring Fledge systems

The current implementation demonstrates the UI and correlation logic works well - it just needs real data sources to become a powerful monitoring tool. 