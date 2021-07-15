import base64
from Crypto.Cipher import AES
from src.framework.config import PASSWORD_ENCRYPT_SALT


class Encryptor:
    def __init__(self, salt: bytes = PASSWORD_ENCRYPT_SALT):
        self.aes = AES.new(salt, AES.MODE_ECB)

    def encode(self, data: str) -> str:
        bytes_data = data.encode("utf-8")
        data = bytes_data + b'=' * (16 - len(bytes_data) % 16)
        encrypt_bin = self.aes.encrypt(data)
        return base64.b64encode(encrypt_bin).decode("utf-8")

    def decode(self, data: str) -> str:
        bin_data = base64.b64decode(data.encode("utf-8"))
        decrypted = self.aes.decrypt(bin_data)
        return decrypted.decode("utf-8").rstrip("=")
