FROM python:3.8.3

EXPOSE 1992

ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN echo 'export LANG="C.UTF-8"' >> /etc/profile

WORKDIR /app
COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY . ./
CMD ["uvicorn", "src.main:app", "--workers", "3", "--timeout-keep-alive", "600", "--port", "1992", "--host", "0.0.0.0"]
