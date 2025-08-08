# Actor Source Code & Streaming API

## 🎯 Tổng quan
API để quản lý source code từng file và chạy actor với streaming output real-time.

## 📋 API Endpoints

### **1. Lưu Source Code File**
```http
POST /api/actors/:id/source/file
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "filePath": "main.js",
  "content": "console.log('Hello World');"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "File đã được lưu thành công",
  "data": {
    "filePath": "main.js",
    "content": "console.log('Hello World');",
    "lastModified": "2025-08-05T10:30:00.000Z"
  }
}
```

### **2. Lấy Source Code File**
```http
GET /api/actors/:id/source/file?filePath=main.js
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "filePath": "main.js",
    "content": "console.log('Hello World');",
    "language": "javascript",
    "lastModified": "2025-08-05T10:30:00.000Z"
  }
}
```

### **3. Lấy Danh Sách Files**
```http
GET /api/actors/:id/source/files
```

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "path": "main.js",
        "name": "main.js",
        "type": "file"
      },
      {
        "path": "package.json",
        "name": "package.json",
        "type": "file"
      }
    ],
    "lastModified": "2025-08-05T10:30:00.000Z"
  }
}
```

### **4. Chạy Actor với Streaming Output**
```http
POST /api/actors/:id/run/stream
```

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Body:**
```json
{
  "input": {
    "url": "https://example.com",
    "maxPages": 10,
    "productSelector": ".product-item"
  }
}
```

**Response (Streaming):**
```
[INFO] Starting actor: My Web Scraper
[INFO] Run ID: run_1733456789012
[INFO] Input: {"url":"https://example.com","maxPages":10}
[INFO] Working directory: /tmp/actor-64f1234567890abcdef-1733456789

[OUT] Starting web scraping...
[OUT] Found 5 products on page 1
[OUT] Scraping product: Product 1
[OUT] Scraping product: Product 2
[ERR] Warning: Product 3 has no price
[OUT] Completed scraping page 1
[OUT] Moving to page 2...

[END] Process exited with code 0
[INFO] Execution completed
```

## 📝 Ví dụ sử dụng

### **Lưu file main.js:**
```bash
curl -X POST http://localhost:5000/api/actors/64f1234567890abcdef/source/file \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "main.js",
    "content": "const Apify = require(\"apify\");\n\nApify.main(async () => {\n    console.log(\"Hello from Apify!\");\n});"
  }'
```

### **Lưu file package.json:**
```bash
curl -X POST http://localhost:5000/api/actors/64f1234567890abcdef/source/file \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "package.json",
    "content": "{\"name\": \"my-actor\", \"version\": \"1.0.0\", \"dependencies\": {\"apify\": \"^3.0.0\"}}"
  }'
```

### **Lấy nội dung file:**
```bash
curl -X GET "http://localhost:5000/api/actors/64f1234567890abcdef/source/file?filePath=main.js" \
  -H "Authorization: Bearer <admin_token>"
```

### **Chạy actor với streaming:**
```bash
curl -X POST http://localhost:5000/api/actors/64f1234567890abcdef/run/stream \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "url": "https://example.com",
      "maxPages": 5
    }
  }'
```

## 📝 Ví dụ sử dụng với JavaScript/Axios

### **Lưu Source Code:**
```javascript
const saveSourceFile = async (actorId, filePath, content) => {
  const response = await axios.post(`/api/actors/${actorId}/source/file`, {
    filePath,
    content
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

// Sử dụng
await saveSourceFile('64f1234567890abcdef', 'main.js', `
const Apify = require("apify");

Apify.main(async () => {
    const input = await Apify.getInput();
    console.log("Input:", input);
    
    // Your scraping logic here
    const dataset = await Apify.openDataset();
    await dataset.pushData({ message: "Hello World" });
});
`);
```

### **Lấy Source Code:**
```javascript
const getSourceFile = async (actorId, filePath) => {
  const response = await axios.get(`/api/actors/${actorId}/source/file`, {
    headers: { 'Authorization': `Bearer ${token}` },
    params: { filePath }
  });
  return response.data;
};

// Sử dụng
const fileData = await getSourceFile('64f1234567890abcdef', 'main.js');
console.log('Content:', fileData.data.content);
console.log('Language:', fileData.data.language);
```

### **Chạy Actor với Streaming:**
```javascript
const runActorStream = async (actorId, input) => {
  const response = await axios.post(`/api/actors/${actorId}/run/stream`, {
    input
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    responseType: 'stream'
  });

  // Handle streaming response
  response.data.on('data', (chunk) => {
    const output = chunk.toString();
    console.log('Stream output:', output);
  });

  response.data.on('end', () => {
    console.log('Stream ended');
  });
};

// Sử dụng
await runActorStream('64f1234567890abcdef', {
  url: 'https://example.com',
  maxPages: 10
});
```

## 🔧 Frontend Integration

### **React Component cho Code Editor:**
```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CodeEditor = ({ actorId, filePath }) => {
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadFile();
  }, [actorId, filePath]);

  const loadFile = async () => {
    try {
      const response = await axios.get(`/api/actors/${actorId}/source/file`, {
        params: { filePath },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setContent(response.data.data.content);
      setLanguage(response.data.data.language);
    } catch (error) {
      console.error('Error loading file:', error);
    }
  };

  const saveFile = async () => {
    setIsSaving(true);
    try {
      await axios.post(`/api/actors/${actorId}/source/file`, {
        filePath,
        content
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('File saved successfully');
    } catch (error) {
      console.error('Error saving file:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="editor-header">
        <span>{filePath}</span>
        <button onClick={saveFile} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={`code-editor language-${language}`}
        rows={20}
      />
    </div>
  );
};
```

### **React Component cho Streaming Output:**
```javascript
import React, { useState, useRef } from 'react';
import axios from 'axios';

const StreamingOutput = ({ actorId }) => {
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const outputRef = useRef(null);

  const runActor = async (input) => {
    setIsRunning(true);
    setOutput('');

    try {
      const response = await axios.post(`/api/actors/${actorId}/run/stream`, {
        input
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      });

      response.data.on('data', (chunk) => {
        const newOutput = chunk.toString();
        setOutput(prev => prev + newOutput);
        
        // Auto scroll to bottom
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
      });

      response.data.on('end', () => {
        setIsRunning(false);
      });

    } catch (error) {
      console.error('Error running actor:', error);
      setIsRunning(false);
    }
  };

  return (
    <div>
      <div className="output-header">
        <h3>Execution Output</h3>
        <button 
          onClick={() => runActor({ url: 'https://example.com' })}
          disabled={isRunning}
        >
          {isRunning ? 'Running...' : 'Run Actor'}
        </button>
      </div>
      <pre 
        ref={outputRef}
        className="output-console"
        style={{ 
          height: '400px', 
          overflow: 'auto',
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          padding: '10px',
          fontFamily: 'monospace'
        }}
      >
        {output || 'No output yet...'}
      </pre>
    </div>
  );
};
```

## 🎯 Tính năng nổi bật

### **1. File Management:**
- ✅ Lưu từng file riêng biệt
- ✅ Hỗ trợ nhiều ngôn ngữ lập trình
- ✅ Auto-detect language từ file extension
- ✅ Lưu lịch sử thay đổi

### **2. Streaming Execution:**
- ✅ Real-time output streaming
- ✅ Chạy code trên server
- ✅ Temporary directory isolation
- ✅ Auto cleanup sau khi chạy
- ✅ Environment variables support

### **3. Security:**
- ✅ Authentication required
- ✅ Authorization based on roles
- ✅ Temporary file isolation
- ✅ Input validation

### **4. Error Handling:**
- ✅ Graceful error handling
- ✅ Detailed error messages
- ✅ Status tracking
- ✅ Metrics collection

## 🚀 Workflow

1. **Tạo Actor** → Status: `draft`
2. **Lưu Source Code** → Các file được lưu vào database
3. **Build Actor** → Status: `ready`
4. **Run Actor** → Streaming output real-time
5. **Monitor** → Theo dõi execution progress

## 📊 Supported Languages

- **JavaScript** (.js, .jsx)
- **TypeScript** (.ts, .tsx)
- **JSON** (.json)
- **HTML** (.html)
- **CSS** (.css)
- **Python** (.py)
- **Java** (.java)
- **C++** (.cpp)
- **C** (.c)
- **PHP** (.php)
- **Ruby** (.rb)
- **Go** (.go)
- **Rust** (.rs)

## ⚠️ Lưu ý

1. **File Size**: Không nên lưu file quá lớn (>1MB)
2. **Security**: Code sẽ được chạy trên server, cần validate input
3. **Resources**: Mỗi execution tạo temporary directory
4. **Cleanup**: Temporary files được tự động xóa sau execution
5. **Concurrency**: Nên limit số lượng concurrent executions

## 🎉 Kết quả

Với các API này, frontend có thể:
- ✅ Lưu code trực tiếp vào database
- ✅ Chạy actor trên server
- ✅ Nhận output real-time
- ✅ Không cần download file lớn
- ✅ Editor experience tốt hơn
- ✅ Real-time collaboration 