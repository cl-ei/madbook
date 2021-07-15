import os
import traceback
from typing import *
from starlette.requests import Request
from multiprocessing import Process, Queue
from queue import Empty

from src.db.schemas.base import RWSchema
from src.framework.log4 import logger as logging


class TaskMessage(RWSchema):
    callback: Optional[Callable] = None
    args: tuple = ()
    exit_signal: bool = False


def _wrapped_target(q: Queue):
    identify = f"[ASYNC-EXECUTOR-{os.getpid()}]"
    logging.info(f"{identify} Process Started. ")
    while True:
        try:
            task: TaskMessage = q.get(block=True, timeout=10)
        except Empty:
            continue

        if task.exit_signal is True:
            logging.info(f"Received exit signal, now exit.")
            return

        try:
            result = task.callback(*task.args)
        except Exception as e:
            logging.info(f"{identify} Execute Error: {e}\n{traceback.format_exc()}")
        else:
            logging.info(f"{identify} Execute result: {result}")


AE = TypeVar("AE", bound="AsyncExecutor")


class AsyncExecutor:
    def __init__(self):
        self.process = None
        self._q = Queue()
        self._terminate = False

    def startup(self):
        if self.process:
            return
        self.process = p = Process(target=_wrapped_target, args=(self._q, ), daemon=True)
        p.start()

    def shutdown(self):
        if self.process is None or self._terminate:
            return
        self._terminate = True
        self._q.put(TaskMessage(exit_signal=True))
        logging.info("Send terminate signal. wait...")
        self.process.join()
        self.process = None

    def submit_task(self, target: Callable, args: Tuple = None) -> int:
        if self._terminate or self.process is None:
            return -1

        msg = TaskMessage(callback=target, args=args)
        self._q.put(msg)
        return self._q.qsize()

    @classmethod
    def acquire(cls, req: Request) -> AE:
        return req.app.state.AE
