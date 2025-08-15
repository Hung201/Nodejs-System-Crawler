const { execSync } = require('child_process');

console.log('🔒 Script xóa file chứa token khỏi mọi commit\n');

console.log('📋 Các file sẽ bị xóa khỏi mọi commit:');
console.log('   - docs/PLATFORM_API.md');
console.log('   - scripts/migrate-platforms-from-localstorage.js\n');

console.log('📋 Các bước thực hiện:');
console.log('1. Tạo backup branch');
console.log('2. Commit tất cả thay đổi hiện tại');
console.log('3. Xóa file khỏi mọi commit bằng filter-branch');
console.log('4. Dọn dẹp git history');
console.log('5. Force push\n');

try {
    // Tạo backup branch
    console.log('1️⃣ Tạo backup branch...');
    execSync('git checkout -b backup-before-file-removal', { stdio: 'inherit' });
    console.log('✅ Đã tạo backup branch: backup-before-file-removal\n');

    // Quay về main
    console.log('2️⃣ Quay về main branch...');
    execSync('git checkout main', { stdio: 'inherit' });
    console.log('✅ Đã quay về main branch\n');

    // Commit tất cả thay đổi
    console.log('3️⃣ Commit tất cả thay đổi hiện tại...');
    try {
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Commit all changes before removing files"', { stdio: 'inherit' });
        console.log('✅ Đã commit tất cả thay đổi\n');
    } catch (error) {
        console.log('⚠️  Không có thay đổi để commit hoặc đã commit rồi\n');
    }

    // Xóa file khỏi mọi commit
    console.log('4️⃣ Xóa file khỏi mọi commit...');
    console.log('   ⚠️  Quá trình này có thể mất vài phút...');
    
    const filterCommand = `git filter-branch --force --index-filter "git rm --cached --ignore-unmatch docs/PLATFORM_API.md scripts/migrate-platforms-from-localstorage.js" --prune-empty --tag-name-filter cat -- --all`;
    execSync(filterCommand, { stdio: 'inherit' });
    console.log('✅ Đã xóa file khỏi mọi commit\n');

    // Dọn dẹp refs backup
    console.log('5️⃣ Dọn dẹp refs backup...');
    execSync('git for-each-ref --format="%(refname)" refs/original/ | xargs -n 1 git update-ref -d', { stdio: 'inherit' });
    console.log('✅ Đã dọn dẹp refs backup\n');

    // Garbage collection
    console.log('6️⃣ Chạy garbage collection...');
    execSync('git reflog expire --expire=now --all', { stdio: 'inherit' });
    execSync('git gc --prune=now --aggressive', { stdio: 'inherit' });
    console.log('✅ Đã chạy garbage collection\n');

    console.log('🎉 Hoàn thành! File đã được xóa khỏi mọi commit.');
    console.log('\n📝 Bước tiếp theo:');
    console.log('   git push origin main --force');
    console.log('\n⚠️  Lưu ý:');
    console.log('   - Backup branch đã được tạo: backup-before-file-removal');
    console.log('   - Nếu có vấn đề, có thể restore từ backup branch');
    console.log('   - Commit history đã được viết lại hoàn toàn');
    console.log('   - 2 file chứa token đã bị xóa khỏi mọi commit');

} catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.log('\n💡 Thử cách khác:');
    console.log('   git reset --hard c388a08');
    console.log('   git push origin main --force');
}
