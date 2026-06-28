import os
import sys
import logging

LOG_PATH = "../log"
if not os.path.exists(LOG_PATH):
    os.makedirs(LOG_PATH, exist_ok=True)

__all__ = ("gen_logger", "logger")

log_format = logging.Formatter("%(asctime)s [%(levelname)s]: %(message)s")


def gen_logger(file_name: str) -> logging.Logger:
    if not file_name.endswith(".log"):
        file_name += ".log"

    _, inner_file_name = os.path.split(file_name)
    logger_name, _ = os.path.splitext(inner_file_name)

    _fh = logging.FileHandler(os.path.join(LOG_PATH, file_name), encoding="utf-8")
    _fh.setFormatter(log_format)
    stdout_h = logging.StreamHandler(sys.stdout)
    stdout_h.setFormatter(log_format)

    lg = logging.getLogger(logger_name)
    lg.setLevel(logging.DEBUG)

    lg.addHandler(stdout_h)
    lg.addHandler(_fh)

    return lg


logger = gen_logger("app")
