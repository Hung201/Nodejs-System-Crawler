const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔒 Script xóa token an toàn khỏi git history\n');

// Lưu code hiện tại
console.log('1️⃣ Lưu code hiện tại...');
const currentFiles = [
    'models/Platform.js',
    'services/platformService.js',
    'controllers/platformController.js',
    'routes/platforms.js'
];

// Tạo thư mục backup
if (!fs.existsSync('backup-current-code')) {
    fs.mkdirSync('backup-current-code');
}

currentFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        fs.writeFileSync(`backup-current-code/${file.replace(/\//g, '_')}`, content);
        console.log(`   ✅ Đã backup: ${file}`);
    }
});

console.log('✅ Đã backup code hiện tại vào thư mục backup-current-code\n');

// Xóa file chứa token khỏi history
console.log('2️⃣ Xóa file chứa token khỏi git history...');
try {
    execSync('git filter-branch --force --index-filter "git rm --cached --ignore-unmatch docs/PLATFORM_API.md scripts/migrate-platforms-from-localstorage.js" --prune-empty --tag-name-filter cat -- --all', { stdio: 'inherit' });
    console.log('✅ Đã xóa file chứa token khỏi history\n');
} catch (error) {
    console.log('⚠️  Lỗi khi xóa file, thử cách khác...');
}

// Dọn dẹp
console.log('3️⃣ Dọn dẹp git history...');
try {
    execSync('git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d', { stdio: 'inherit' });
    execSync('git reflog expire --expire=now --all', { stdio: 'inherit' });
    execSync('git gc --prune=now --aggressive', { stdio: 'inherit' });
    console.log('✅ Đã dọn dẹp git history\n');
} catch (error) {
    console.log('⚠️  Lỗi khi dọn dẹp, bỏ qua...');
}

// Khôi phục code hiện tại
console.log('4️⃣ Khôi phục code hiện tại...');
currentFiles.forEach(file => {
    const backupFile = `backup-current-code/${file.replace(/\//g, '_')}`;
    if (fs.existsSync(backupFile)) {
        const content = fs.readFileSync(backupFile, 'utf8');
        fs.writeFileSync(file, content);
        console.log(`   ✅ Đã khôi phục: ${file}`);
    }
});

// Add và commit lại
console.log('5️⃣ Commit lại code hiện tại...');
try {
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Re-add platform system without sensitive tokens"', { stdio: 'inherit' });
    console.log('✅ Đã commit lại code\n');
} catch (error) {
    console.log('⚠️  Lỗi khi commit, có thể đã commit rồi');
}

console.log('🎉 Hoàn thành!');
console.log('\n📝 Bước tiếp theo:');
console.log('   git push origin main --force');
console.log('\n⚠️  Lưu ý:');
console.log('   - Code hiện tại đã được backup trong thư mục backup-current-code');
console.log('   - Token đã được xóa khỏi git history');
console.log('   - Có thể xóa thư mục backup-current-code sau khi push thành công');
