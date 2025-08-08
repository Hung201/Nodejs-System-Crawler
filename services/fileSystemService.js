const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const extract = require('extract-zip');

class FileSystemService {
    constructor() {
        this.basePath = path.join(process.cwd(), 'actors_storage');
        console.log('FileSystemService initialized with basePath:', this.basePath);
    }

    // Tạo thư mục cho actor
    async createActorDirectory(userId, actorId) {
        console.log(`Creating actor directory: userId=${userId}, actorId=${actorId}`);
        const actorPath = path.join(this.basePath, userId.toString(), actorId.toString());
        console.log(`Full actor path: ${actorPath}`);

        try {
            await fs.mkdir(actorPath, { recursive: true });
            console.log(`Directory created successfully: ${actorPath}`);

            // Tạo thư mục logs
            const logsPath = path.join(actorPath, 'logs');
            await fs.mkdir(logsPath, { recursive: true });
            console.log(`Logs directory created: ${logsPath}`);

            return actorPath;
        } catch (error) {
            console.error(`Error creating directory ${actorPath}:`, error);
            throw error;
        }
    }

    // Giải nén file zip
    async extractZipFile(zipPath, extractPath) {
        try {
            console.log(`Extracting zip file from ${zipPath} to ${extractPath}`);
            await extract(zipPath, { dir: extractPath });
            console.log('Zip file extracted successfully');
        } catch (error) {
            console.error('Error extracting zip file:', error);
            throw error;
        }
    }

    // Lưu file
    async saveFile(userId, actorId, filePath, content) {
        const actorPath = await this.createActorDirectory(userId, actorId);
        const fullPath = path.join(actorPath, filePath);

        // Validate file path để tránh path traversal
        if (!this.isValidFilePath(filePath)) {
            throw new Error('Invalid file path');
        }

        // Tạo thư mục cha nếu cần
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });

        // Lưu file
        await fs.writeFile(fullPath, content, 'utf8');
        console.log(`File saved: ${fullPath}`);

        return fullPath;
    }

    // Đọc file
    async readFile(userId, actorId, filePath) {
        const actorPath = path.join(this.basePath, userId.toString(), actorId.toString());
        const fullPath = path.join(actorPath, filePath);

        if (!this.isValidFilePath(filePath)) {
            throw new Error('Invalid file path');
        }

        const content = await fs.readFile(fullPath, 'utf8');
        return content;
    }

    // Lấy danh sách file
    async listFiles(userId, actorId) {
        const actorPath = path.join(this.basePath, userId.toString(), actorId.toString());

        try {
            const files = await this.getAllFiles(actorPath);
            return files.map(file => path.relative(actorPath, file));
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    // Xóa file
    async deleteFile(userId, actorId, filePath) {
        const actorPath = path.join(this.basePath, userId.toString(), actorId.toString());
        const fullPath = path.join(actorPath, filePath);

        if (!this.isValidFilePath(filePath)) {
            throw new Error('Invalid file path');
        }

        await fs.unlink(fullPath);
    }

    // **QUAN TRỌNG: Build Actor function**
    async buildActor(userId, actorId) {
        try {
            const actorPath = path.join(this.basePath, userId.toString(), actorId.toString());

            // Kiểm tra có Dockerfile không
            const dockerfilePath = path.join(actorPath, 'Dockerfile');
            const dockerfileExists = await fs.access(dockerfilePath).then(() => true).catch(() => false);

            if (!dockerfileExists) {
                return {
                    success: false,
                    log: 'Không tìm thấy Dockerfile. Vui lòng tạo Dockerfile trước khi build.'
                };
            }

            // Build Docker image
            return new Promise((resolve) => {
                const buildProcess = spawn('docker', ['build', '-t', `actor-${actorId}`, '.'], {
                    cwd: actorPath,
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let output = '';
                let errorOutput = '';

                buildProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });

                buildProcess.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                buildProcess.on('close', (code) => {
                    const log = output + errorOutput;

                    if (code === 0) {
                        resolve({
                            success: true,
                            log: `Build thành công!\n${log}`
                        });
                    } else {
                        resolve({
                            success: false,
                            log: `Build thất bại (exit code: ${code})\n${log}`
                        });
                    }
                });

                buildProcess.on('error', (error) => {
                    resolve({
                        success: false,
                        log: `Lỗi khi build: ${error.message}`
                    });
                });
            });

        } catch (error) {
            return {
                success: false,
                log: `Lỗi: ${error.message}`
            };
        }
    }

    // Run Actor function
    async runActor(userId, actorId, input = {}) {
        try {
            const actorPath = path.join(this.basePath, userId.toString(), actorId.toString());

            return new Promise((resolve) => {
                const runProcess = spawn('docker', [
                    'run',
                    '--rm',
                    `actor-${actorId}`,
                    JSON.stringify(input)
                ], {
                    cwd: actorPath,
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let output = '';
                let errorOutput = '';

                runProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });

                runProcess.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                runProcess.on('close', (code) => {
                    const log = output + errorOutput;

                    if (code === 0) {
                        resolve({
                            success: true,
                            log: `Run thành công!\n${log}`
                        });
                    } else {
                        resolve({
                            success: false,
                            log: `Run thất bại (exit code: ${code})\n${log}`
                        });
                    }
                });

                runProcess.on('error', (error) => {
                    resolve({
                        success: false,
                        log: `Lỗi khi run: ${error.message}`
                    });
                });
            });

        } catch (error) {
            return {
                success: false,
                log: `Lỗi: ${error.message}`
            };
        }
    }

    // Validate file path để tránh path traversal
    isValidFilePath(filePath) {
        const normalized = path.normalize(filePath);
        return !normalized.includes('..') && !path.isAbsolute(normalized);
    }

    // Helper: lấy tất cả file trong thư mục
    async getAllFiles(dirPath) {
        const files = [];

        const items = await fs.readdir(dirPath, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dirPath, item.name);

            if (item.isDirectory()) {
                if (item.name !== 'node_modules' && item.name !== '.git') {
                    const subFiles = await this.getAllFiles(fullPath);
                    files.push(...subFiles);
                }
            } else {
                files.push(fullPath);
            }
        }

        return files;
    }

    // Xóa toàn bộ thư mục actor
    async deleteActorDirectory(userId, actorId) {
        const actorPath = path.join(this.basePath, userId.toString(), actorId.toString());

        try {
            await fs.rm(actorPath, { recursive: true, force: true });
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return true; // Directory doesn't exist
            }
            throw error;
        }
    }

    // Kiểm tra file có tồn tại không
    async fileExists(userId, actorId, filePath) {
        const actorPath = path.join(this.basePath, userId.toString(), actorId.toString());
        const fullPath = path.join(actorPath, filePath);

        try {
            await fs.access(fullPath);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Lấy thông tin file
    async getFileInfo(userId, actorId, filePath) {
        const actorPath = path.join(this.basePath, userId.toString(), actorId.toString());
        const fullPath = path.join(actorPath, filePath);

        try {
            const stats = await fs.stat(fullPath);
            return {
                path: filePath,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                isDirectory: stats.isDirectory()
            };
        } catch (error) {
            throw new Error('File not found');
        }
    }
}

module.exports = new FileSystemService();
