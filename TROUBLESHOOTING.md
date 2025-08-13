# Troubleshooting Guide - Campaign "Starting campaign..." Issue

## Vấn đề
Campaign bị stuck ở trạng thái "running" với log chỉ hiển thị "Starting campaign..." mà không có log chi tiết từ quá trình cào dữ liệu.

## Nguyên nhân chính
1. **Server crash khi chạy campaign do auto cleanup**
2. **Port 5000 bị chiếm bởi process khác**
3. **Quá nhiều Node.js processes gây xung đột**
4. **Actor process bị kill sớm hoặc không được spawn thành công**

## Giải pháp Mới: Hệ thống Port Động
Hệ thống đã được cải tiến với **Port Management System**:
- **Mỗi campaign chạy trên port riêng** (5000, 5001, 5002, ...)
- **Tự động cấp phát và giải phóng ports**
- **Tránh xung đột port giữa các campaigns**
- **Quản lý tối đa 100 campaigns đồng thời**

## Giải pháp

### 1. Giải quyết Server Crash và Port Bị Chiếm

#### A. Tắt Auto Cleanup Tạm Thời
```powershell
# Tắt auto cleanup để tránh server crash
$env:DISABLE_AUTO_CLEANUP="true"
npm start
```

#### B. Kill Tất Cả Node Processes (Emergency)
```powershell
# Kill tất cả node processes để giải phóng port
node scripts/simple-cleanup.js
```

#### C. Kiểm Tra Port 5000
```powershell
# Kiểm tra process nào đang sử dụng port 5000
netstat -ano | findstr :5000

# Kill process theo PID
taskkill /F /PID <PID>
```

#### D. Restart Server Sạch
```powershell
# 1. Kill tất cả processes
node scripts/simple-cleanup.js

# 2. Tắt auto cleanup
$env:DISABLE_AUTO_CLEANUP="true"

# 3. Start server
npm start
```

### 2. Giải pháp Dài Hạn

#### A. Cải Thiện Auto Cleanup Logic
- Chỉ kill confirmed actor processes
- Không kill frontend/backend processes
- Thêm delay trước khi cleanup

#### B. Process Management
- Giới hạn số lượng concurrent campaigns
- Timeout cho actor processes
- Hang detection cho actor processes

#### C. Error Handling
- Try-catch cho spawn process
- Graceful shutdown
- Auto restart cho failed campaigns

### 3. Scripts Hữu Ích

#### A. Safe Cleanup (Chỉ kill actor processes)
```powershell
node scripts/safe-cleanup.js
```

#### B. Check Processes
```powershell
node scripts/check-processes.js
```

#### C. Emergency Cleanup (Kill tất cả)
```powershell
node scripts/simple-cleanup.js
```

#### D. Test Port System
```powershell
node scripts/test-port-system.js
```

#### E. Fix Campaign Issues (Auto)
```powershell
node scripts/fix-campaign-issues.js
```

### 4. Monitoring và Debug

#### A. Kiểm Tra Logs
```powershell
# Error logs
Get-Content -Tail 50 logs/error.log

# Combined logs
Get-Content -Tail 50 logs/combined.log
```

#### B. Kiểm Tra Campaign Status
```powershell
# PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/campaigns/<CAMPAIGN_ID>/status" -Headers @{"Authorization"="Bearer <TOKEN>"}

# Hoặc curl
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/campaigns/<CAMPAIGN_ID>/status
```

#### C. Test Actor Setup
```powershell
node scripts/test-actor-setup.js
```

#### D. Port Management APIs
```powershell
# Lấy thống kê ports
Invoke-WebRequest -Uri "http://localhost:5000/api/ports/stats" -Headers @{"Authorization"="Bearer <TOKEN>"}

# Lấy danh sách campaigns và ports
Invoke-WebRequest -Uri "http://localhost:5000/api/ports/campaigns" -Headers @{"Authorization"="Bearer <TOKEN>"}

# Lấy port của campaign cụ thể
Invoke-WebRequest -Uri "http://localhost:5000/api/ports/campaign/<CAMPAIGN_ID>" -Headers @{"Authorization"="Bearer <TOKEN>"}

# Giải phóng port của campaign
Invoke-WebRequest -Uri "http://localhost:5000/api/ports/release/<CAMPAIGN_ID>" -Method POST -Headers @{"Authorization"="Bearer <TOKEN>"}

# Cleanup tất cả ports (emergency)
Invoke-WebRequest -Uri "http://localhost:5000/api/ports/cleanup" -Method POST -Headers @{"Authorization"="Bearer <TOKEN>"}
```

## Prevention (Ngăn chặn tái diễn)

### Tự động cleanup trước và sau khi chạy campaign
Hệ thống đã được cập nhật để tự động dọn dẹp actor processes:
- **Trước khi chạy**: Dọn dẹp actor processes cũ để tránh xung đột
- **Sau khi hoàn thành**: Dọn dẹp actor processes để chuẩn bị cho lần chạy tiếp theo
- **Khi có lỗi**: Dọn dẹp actor processes để tránh tích tụ

### Environment Variables
```powershell
# Tắt auto cleanup
$env:DISABLE_AUTO_CLEANUP="true"

# Bật auto cleanup (mặc định)
$env:DISABLE_AUTO_CLEANUP="false"
```

## Lưu ý quan trọng
- **Frontend React**: Khi dọn dẹp processes, frontend React có thể bị kill. Cần restart lại.
- **Backend Server**: Logic cleanup đã được cải thiện để không kill backend server.
- **Tắt Auto Cleanup**: Nếu gặp vấn đề, có thể tắt auto cleanup bằng `DISABLE_AUTO_CLEANUP=true`.
- **Backup**: Luôn backup dữ liệu quan trọng trước khi dọn dẹp.
- **Logs**: Kiểm tra logs trong `logs/error.log` và `logs/combined.log` để debug.

## Workflow Khuyến Nghị

### Khi Gặp Vấn Đề:
1. **Kiểm tra logs**: `Get-Content -Tail 50 logs/error.log`
2. **Tắt auto cleanup**: `$env:DISABLE_AUTO_CLEANUP="true"`
3. **Kill processes**: `node scripts/safe-cleanup.js`
4. **Restart server**: `npm start`
5. **Test campaign**: Chạy campaign để kiểm tra

### Khi Hoạt Động Bình Thường:
1. **Bật auto cleanup**: `$env:DISABLE_AUTO_CLEANUP="false"`
2. **Chạy campaign**: Campaign sẽ tự động cleanup
3. **Monitor logs**: Kiểm tra logs định kỳ

## Tắt auto cleanup nếu gặp vấn đề
```powershell
$env:DISABLE_AUTO_CLEANUP="true"
npm start
```

## Bật auto cleanup khi hoạt động bình thường
```powershell
$env:DISABLE_AUTO_CLEANUP="false"
npm start
```
