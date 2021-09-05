## MadBook

---

这是一个轻量级记账APP，支持多个账本以及统计分析功能，移动端的体验更佳。
这个项目采用前后端分离的设计，后端使用FastAPI框架构建，前端方面为了轻量化，使用了boostrap & jQuery。
实际上，整个前端的部分只有1个web页面，所有子页面都是动态渲染出来的。下面是一些运行截图。

This is a lightweight bookkeeping app that supports multiple ledgers and statistical analysis functions. The mobile terminal has a better experience.
The project adopts a front-end and back-end separation design, the back-end is built using the fastapi framework, and the front-end uses bootstrap & jQuery for lightweight.
In fact, there is only one web page in the whole front end, and all sub pages are rendered dynamically. Running screenshots:

![运行截图](docs/demo.jpg)

你可以通过简单的配置来运行它，需要：
* Python3.7+
* MongoDB (依赖)

推荐使用Docker的方式进行部署运行，借助docker-compose工具可以和所依赖的MongoDB容器一键运行。关于MongoDB数据库，可以参照这里进行搭建：
[docker.com/_/mongo](https://hub.docker.com/_/mongo)

### 部署

原生Python环境部署:  
```shell
export MAD_BOOK_MONGODB_URL="xxx"   # 后端数据库，示例: "mongodb://{mongo_user}:{mongo_password}@{host:port}/{db_name}"
export PASSWORD_ENCRYPT_SALT="xxx"  # 加密用户密码之用，[a-z|A-Z|0-9]字符串，长度32
export TOKEN_ENCRYPT_SALT="xxx"     # 加密登录token之用，[a-z|A-Z|0-9]字符串，长度32
export REG_KEY="xxx"                # 注册码，长度任意。可不设置，默认值"test_1234"

pip install -r requirements.txt
sh startup.sh
```

Docker部署：
```shell
imageName="madbook"
docker build -t ${imageName} .
docker run -d -p 1992:1992 \
    -e MAD_BOOK_MONGODB_URL="xxx" \
    -e PASSWORD_ENCRYPT_SALT="xxx" \
    -e TOKEN_ENCRYPT_SALT="xxx" \
    -e REG_KEY="xxx" \
    ${imageName}
```

然后，浏览器访问[http://localhost:1992/madbook](http://localhost:1992/madbook) 弹出登录页则说明已部署成功。

---
本项目由GPLv3协议开源发布。
