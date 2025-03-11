const { EncryptData } = require("../models");

const crypto = require("crypto");
const { serverError } = require("../utils/serverError");
const encryptionCache = require("../config/encryptionCache");

const key = Buffer.from("1234567890123456"); // Harus 16 karakter untuk AES-128
const algorithm = "aes-128-ecb"; // Mode ECB agar tidak perlu IV

const encryptToNumber = (text) => {
    try {
        if (!text) return;

        const cipher = crypto.createCipheriv(algorithm, key, null);
        const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");

        // Konversi hasil enkripsi ke BigInt
        const bigNumber = BigInt("0x" + encrypted);

        // Batasi ke 7 digit dengan BigInt
        const limitedNumber = Number(bigNumber % BigInt(1_000_000_0));
        encryptionCache.set(limitedNumber, text);
        return limitedNumber;
    } catch (error) {
        serverError(error)
    }
}

const decryptFromNumber = async (encryptedNumber) => {
    try {
        // Cari di database berdasarkan angka enkripsi
        const result = await EncryptData.findOne({
            where: { encrypt_number: encryptedNumber }, attributes: ["original_text"]
        });

        // Jika ditemukan, kembalikan teks aslinya
        return result ? result.original_text : "Decryption Failed";
    } catch (error) {
        console.error("Database Error:", error);
        return "Decryption Failed";
    }
};

// Contoh penggunaan
// (async () => {
//     const text = "24-K0021_05. FIX CAVITY";
//     const encryptedNumber = await encryptToNumber(text);
//     console.log("Encrypted Number:", encryptedNumber);

//     const decryptedText = await decryptFromNumber(encryptedNumber);
//     console.log("Decrypted Text:", decryptedText);
// })();


module.exports = {
    encryptToNumber,
    decryptFromNumber
}