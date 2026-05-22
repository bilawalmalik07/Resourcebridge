import bcrypt


def get_password_hash(password: str) -> str:
    """Takes a plain text password and returns a secure, encrypted hash."""
    password_bytes = password.encode('utf-8')

    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt)

    return hashed_password.decode('utf-8')
