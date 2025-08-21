const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetTokenSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    used: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index để tự động xóa token hết hạn
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Tạo token ngẫu nhiên (8 ký tự)
passwordResetTokenSchema.statics.generateToken = function () {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Tạo token với thời gian hết hạn
passwordResetTokenSchema.statics.createToken = async function (email, expiresInMinutes = 15) {
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Xóa token cũ của email này nếu có
    await this.deleteMany({ email });

    const resetToken = new this({
        email,
        token,
        expiresAt
    });

    await resetToken.save();
    return resetToken;
};

// Xác thực token
passwordResetTokenSchema.statics.verifyToken = async function (email, token) {
    const resetToken = await this.findOne({
        email,
        token,
        used: false,
        expiresAt: { $gt: new Date() }
    });

    return resetToken;
};

// Đánh dấu token đã sử dụng
passwordResetTokenSchema.statics.markAsUsed = async function (token) {
    return await this.updateOne(
        { token },
        { used: true }
    );
};

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
