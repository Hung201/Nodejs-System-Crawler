// Khởi tạo database system_crawler
db = db.getSiblingDB('system_crawler');

// Tạo collections
db.createCollection('users');
db.createCollection('sources');
db.createCollection('crawldatas');
db.createCollection('actors');
db.createCollection('runlogs');

// Tạo indexes cho users
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "status": 1 });

// Tạo indexes cho sources
db.sources.createIndex({ "status": 1, "dataType": 1 });
db.sources.createIndex({ "createdBy": 1 });
db.sources.createIndex({ "nextRun": 1 });

// Tạo indexes cho crawldatas
db.crawldatas.createIndex({ "status": 1, "type": 1 });
db.crawldatas.createIndex({ "sourceId": 1 });
db.crawldatas.createIndex({ "createdAt": -1 });
db.crawldatas.createIndex({ "title": "text", "description": "text" });

// Tạo admin user mặc định
db.users.insertOne({
    name: "Admin",
    email: "admin@system-crawler.com",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK2.", // password: admin123
    role: "admin",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
});

print("Database system_crawler initialized successfully!");
print("Default admin user created: admin@system-crawler.com / admin123"); 