import crypto from 'crypto';   

const algorithm = "aes-256-gcm";

const getKey = () => {
    return Buffer.from(process.env.ENCRYPTION_KEY, "hex");
};

const encrypt = (text) =>{
    const iv  = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
        algorithm,
        getKey(),
        iv
    );

    let encrypted = cipher.update(text,  "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return {
        encryptedData: encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex")
    };
}

const decrypt = (encryptedData, iv, authTag) => {

    const decipher = crypto.createDecipheriv(
        algorithm,
        getKey(),
        Buffer.from(iv, "hex")
    );

    decipher.setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(
        encryptedData,
        "hex",
        "utf8"
    );

    decrypted += decipher.final("utf8");

    return decrypted;
}

export {encrypt, decrypt};