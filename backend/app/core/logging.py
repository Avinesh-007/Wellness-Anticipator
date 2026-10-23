import logging
import re
from typing import Any, Dict


SENSITIVE_KEYS = {
    "password", "secret", "token", "access_token", "refresh_token",
    "authorization", "api_key", "password_hash", "bearer"
}

# Regex to catch bearer tokens and passwords in raw text
TOKEN_REGEX = re.compile(r'(Bearer\s+)[A-Za-z0-9\-_.]+', re.IGNORECASE)
PASSWORD_REGEX = re.compile(r'("password"\s*:\s*")[^"]+(")', re.IGNORECASE)


def redact_sensitive_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively redacts sensitive keys from dictionaries."""
    sanitized = {}
    for k, v in data.items():
        if any(sensitive in k.lower() for sensitive in SENSITIVE_KEYS):
            sanitized[k] = "[REDACTED]"
        elif isinstance(v, dict):
            sanitized[k] = redact_sensitive_dict(v)
        elif isinstance(v, list):
            sanitized[k] = [
                redact_sensitive_dict(item) if isinstance(item, dict) else item
                for item in v
            ]
        else:
            sanitized[k] = v
    return sanitized


def redact_text(text: str) -> str:
    """Scrubs tokens and passwords from arbitrary log strings."""
    text = TOKEN_REGEX.sub(r'\1[REDACTED_TOKEN]', text)
    text = PASSWORD_REGEX.sub(r'\1[REDACTED_PASSWORD]\2', text)
    return text


class SensitiveDataFilter(logging.Filter):
    """Logging filter that ensures sensitive tokens and credentials are never logged."""
    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = redact_text(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = redact_sensitive_dict(record.args)
            elif isinstance(record.args, tuple):
                record.args = tuple(
                    redact_text(a) if isinstance(a, str) else
                    redact_sensitive_dict(a) if isinstance(a, dict) else a
                    for a in record.args
                )
        return True


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """Configures structured, sanitized logging."""
    logger = logging.getLogger("wellness_anticipator")
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    
    # Avoid duplicate handlers
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            fmt="%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        handler.addFilter(SensitiveDataFilter())
        logger.addHandler(handler)
        
    return logger


app_logger = setup_logging()
