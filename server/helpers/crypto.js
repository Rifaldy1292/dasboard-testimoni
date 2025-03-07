const crypto = require("crypto");

const key = Buffer.from("1234567890123456"); // Harus 16 karakter untuk AES-128
const algorithm = "aes-128-ecb"; // Mode ECB agar tidak perlu IV

function encryptToNumber(text) {
    const cipher = crypto.createCipheriv(algorithm, key, null);
    const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");

    // Konversi hasil enkripsi ke BigInt
    const bigNumber = BigInt("0x" + encrypted);

    // Batasi ke 9 digit dengan BigInt
    const limitedNumber = bigNumber % BigInt(1_000_000_000);

    return Number(limitedNumber); // Ubah kembali ke Number biasa
}

function decryptFromNumber(encryptedNumber, originalText) {
    const cipher = crypto.createCipheriv(algorithm, key, null);
    const encryptedHex = cipher.update(originalText, "utf8", "hex") + cipher.final("hex");

    // Lakukan enkripsi ulang untuk mencocokkan hasil
    const expectedNumber = Number(BigInt("0x" + encryptedHex) % BigInt(1_000_000_000));

    return expectedNumber === encryptedNumber ? originalText : "Decryption Failed";
}

// const text = "test12asasasasasssssssssssssssss3";
// const encryptedNumber = encryptToNumber(text);
// console.log("Encrypted Number:", encryptedNumber);
// console.log("Decrypted Text:", decryptFromNumber(encryptedNumber, text));


module.exports = {
    encryptToNumber,
    decryptFromNumber
}