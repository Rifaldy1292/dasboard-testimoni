const { EncryptData } = require("../models");

const { serverError } = require("../utils/serverError");

/**
 *
 * @param {string} text
 * @param {'g_code_name' | 'k_num' | 'output_wp' | 'tool_name'} key
 * @returns {number}
 */
const encryptToNumber = async (text, key) => {
  try {
    if (!text || !key) return 0;

    const existingRecord = await EncryptData.findOne({
      where: { original_text: text, key },
      attributes: ["id", "encrypt_number"],
      raw: true,
    });

    if (existingRecord) return existingRecord.id;

    // Generate a new encrypted number
    const createdRecord = await EncryptData.create({
      original_text: text,
      key: key,
    });

    return createdRecord.id;
  } catch (error) {
    if (error.message.includes("already exists")) return 0;
    serverError(error, "encryptToNumber");
    return 0;
  }
};

/**
 *
 * @param {number} encryptedNumber
 * @param {'g_code_name' | 'k_num' | 'output_wp' | 'tool_name'} key
 * @returns {Promise<string | null>}
 */
const decryptFromNumber = async (encryptedNumber, key) => {
  try {
    if (!encryptedNumber || typeof encryptedNumber !== "number" || !key)
      return null;
    // console.log(encryptedNumber, 123)
    // Cari di database berdasarkan angka enkripsi
    // nanti dihapus karena migrasi
    const whereCondition = { key };
    if (encryptedNumber.toString().length > 5) {
      whereCondition.encrypt_number = encryptedNumber;
    } else {
      whereCondition.id = encryptedNumber;
    }
    const result = await EncryptData.findOne({
      where: whereCondition,
      attributes: ["original_text"],
      raw: true,
    });

    if (!result) return null;

    return result.original_text;
  } catch (error) {
    serverError(error, "decryptFromNumber");
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
