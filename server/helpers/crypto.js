const { EncryptData } = require("../models");

const crypto = require("crypto");
const { serverError } = require("../utils/serverError");
const { encryptionCache } = require("../cache");

const key = Buffer.from("1234567890123456"); // Harus 16 karakter untuk AES-128
const algorithm = "aes-128-ecb"; // Mode ECB agar tidak perlu IV

/**
 *
 * @param {string} text
 * @returns {number}
 */
const encryptToNumber = (text) => {
  try {
    if (!text) return 0;

    const cipher = crypto.createCipheriv(algorithm, key, null);
    const encrypted = cipher.update(text, "utf8", "hex") + cipher.final("hex");

    // Konversi hasil enkripsi ke BigInt
    const bigNumber = BigInt("0x" + encrypted);

    // Batasi ke 7 digit dengan BigInt
    const limitedNumber = Number(bigNumber % BigInt(1_000_000_0));
    encryptionCache.set(limitedNumber, text);
    return limitedNumber;
  } catch (error) {
    serverError(error);
    return 0;
  }
};

/**
 *
 * @param {number} encryptedNumber
 * @returns {Promise<string | null>}
 */
const decryptFromNumber = async (encryptedNumber) => {
  try {
    if (!encryptedNumber || typeof encryptedNumber !== "number") return null;
    // console.log(encryptedNumber, 123)
    // Cari di database berdasarkan angka enkripsi
    const result = await EncryptData.findOne({
      where: { encrypt_number: encryptedNumber },
      attributes: ["original_text"],
    });

    if (!result) return null;

    // Jika ditemukan, kembalikan teks aslinya
    return result.original_text;
  } catch (error) {
    console.error("Database Error:", error);
    return null;
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
  decryptFromNumber,
};
