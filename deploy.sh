#!/bin/bash

# 远程服务器配置
SERVER_HOST="localhost"            # 服务器主机名或 IP
SERVER_PORT="22"                   # SSH 端口
SERVER_USER="root"                 # 服务器用户名
SERVER_DIR="/var/www/zido"         # 服务器上的部署目录
SERVER_PASSWORD=""                 # 服务器密码（可选）
USE_KEY=false                      # 是否使用 SSH 密钥
KEY_PATH=""                        # SSH 密钥路径
ENV_FILE=".env.production"         # 默认环境变量文件
REMOVE_EXISTING=true               # 是否删除已存在的目标目录

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --host HOST     指定服务器主机名或 IP (默认: $SERVER_HOST)"
    echo "  -p, --port PORT     指定 SSH 端口 (默认: $SERVER_PORT)"
    echo "  -u, --user USER     指定服务器用户名 (默认: $SERVER_USER)"
    echo "  -d, --dir DIR       指定服务器上的部署目录 (默认: $SERVER_DIR)"
    echo "  -k, --key PATH      使用 SSH 密钥文件进行认证"
    echo "  -w, --password PWD  使用密码进行认证（不安全，仅用于测试）"
    echo "  -e, --env FILE      指定环境变量文件 (默认: $ENV_FILE)"
    echo "  --no-remove         不删除已存在的目标目录"
    echo "  --help              显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 -h example.com -u deploy -d /var/www/zido"
    echo "  $0 -h 192.168.1.100 -u admin -k ~/.ssh/id_rsa"
    echo "  $0 -h 192.168.1.100 -u admin -e .env.staging"
    exit 0
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -h|--host)
            SERVER_HOST="$2"
            shift 2
            ;;
        -p|--port)
            SERVER_PORT="$2"
            shift 2
            ;;
        -u|--user)
            SERVER_USER="$2"
            shift 2
            ;;
        -d|--dir)
            SERVER_DIR="$2"
            shift 2
            ;;
        -k|--key)
            USE_KEY=true
            KEY_PATH="$2"
            shift 2
            ;;
        -w|--password)
            SERVER_PASSWORD="$2"
            shift 2
            ;;
        -e|--env)
            ENV_FILE="$2"
            shift 2
            ;;
        --no-remove)
            REMOVE_EXISTING=false
            shift
            ;;
        --help)
            show_help
            ;;
        *)
            echo "未知选项: $1"
            exit 1
            ;;
    esac
done

# 设置 SSH 和 RSYNC 选项
SSH_OPTS="-p $SERVER_PORT"
RSYNC_OPTS="-avz"

if $USE_KEY; then
    if [ -f "$KEY_PATH" ]; then
        SSH_OPTS="$SSH_OPTS -i $KEY_PATH"
    else
        echo "错误: SSH 密钥文件不存在: $KEY_PATH"
        exit 1
    fi
elif [ ! -z "$SERVER_PASSWORD" ]; then
    # 检查是否安装了 sshpass
    if ! command -v sshpass &> /dev/null; then
        echo "错误: 未安装 sshpass，请先安装:"
        echo "  macOS: brew install hudochenkov/sshpass/sshpass"
        echo "  Ubuntu/Debian: apt-get install sshpass"
        exit 1
    fi
fi

# 检查环境变量文件是否存在
ENV_FILE=${ENV_FILE:-.env.production}
if [ ! -f "$ENV_FILE" ]; then
    echo "错误: 环境变量文件 '$ENV_FILE' 不存在"
    exit 1
fi
echo "使用环境变量文件: $ENV_FILE"

# 从环境变量文件中提取变量，用于构建参数
BUILD_ARGS=$(grep -v '^#' $ENV_FILE | grep -v '^$' | sed 's/^/--build-arg /')
echo "构建参数: $BUILD_ARGS"

# 从环境变量文件中提取变量，用于运行时环境变量
ENV_ARGS=""
while IFS='=' read -r key value || [[ -n "$key" ]]; do
  # 跳过注释和空行
  if [[ ! "$key" =~ ^#.*$ ]] && [[ ! -z "$key" ]] && [[ "$key" =~ [A-Za-z0-9_]+ ]]; then
    # 去除可能的引号
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    ENV_ARGS="$ENV_ARGS\n$key=$value"
  fi
done < "$ENV_FILE"
ENV_ARGS="$ENV_ARGS\nNODE_ENV=production"
echo "环境变量已准备好，将在部署时使用"

# 确认部署信息
echo "============================================"
echo "ZidoTask 部署脚本"
echo "============================================"
echo "服务器: $SERVER_USER@$SERVER_HOST:$SERVER_PORT"
echo "部署目录: $SERVER_DIR"
echo "环境变量文件: $ENV_FILE"
if $REMOVE_EXISTING; then
    echo "注意: 将删除目标目录后重新部署"
fi
echo "============================================"

# 确认部署
read -p "确认部署? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "部署已取消"
    exit 0
fi

# 检查 SSH 连接
echo "检查 SSH 连接..."
if $USE_KEY; then
    ssh $SSH_OPTS -o ConnectTimeout=5 $SERVER_USER@$SERVER_HOST "echo 连接成功"
elif [ ! -z "$SERVER_PASSWORD" ]; then
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTS -o ConnectTimeout=5 $SERVER_USER@$SERVER_HOST "echo 连接成功"
else
    ssh $SSH_OPTS -o ConnectTimeout=5 $SERVER_USER@$SERVER_HOST "echo 连接成功"
fi

if [ $? -ne 0 ]; then
    echo "错误: 无法连接到服务器"
    exit 1
fi

# 准备远程部署目录
echo "准备远程部署目录..."
if $REMOVE_EXISTING; then
    echo "删除现有目标目录..."
    if $USE_KEY; then
        ssh $SSH_OPTS $SERVER_USER@$SERVER_HOST "if [ -d \"$SERVER_DIR\" ]; then rm -rf \"$SERVER_DIR\"; fi"
    elif [ ! -z "$SERVER_PASSWORD" ]; then
        sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTS $SERVER_USER@$SERVER_HOST "if [ -d \"$SERVER_DIR\" ]; then rm -rf \"$SERVER_DIR\"; fi"
    else
        ssh $SSH_OPTS $SERVER_USER@$SERVER_HOST "if [ -d \"$SERVER_DIR\" ]; then rm -rf \"$SERVER_DIR\"; fi"
    fi
fi

if $USE_KEY; then
    ssh $SSH_OPTS $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_DIR"
elif [ ! -z "$SERVER_PASSWORD" ]; then
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTS $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_DIR"
else
    ssh $SSH_OPTS $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_DIR"
fi

# 使用 rsync 同步项目文件到服务器
echo "同步项目文件到服务器..."
if $USE_KEY; then
    rsync -avz -e "ssh $SSH_OPTS" --exclude='.git/' --exclude='node_modules/' --exclude='.next/' --exclude='.env*' --exclude='docker-compose.override.yml' ./ $SERVER_USER@$SERVER_HOST:$SERVER_DIR/
elif [ ! -z "$SERVER_PASSWORD" ]; then
    sshpass -p "$SERVER_PASSWORD" rsync -avz -e "ssh $SSH_OPTS" --exclude='.git/' --exclude='node_modules/' --exclude='.next/' --exclude='.env*' --exclude='docker-compose.override.yml' ./ $SERVER_USER@$SERVER_HOST:$SERVER_DIR/
else
    rsync -avz -e "ssh $SSH_OPTS" --exclude='.git/' --exclude='node_modules/' --exclude='.next/' --exclude='.env*' --exclude='docker-compose.override.yml' ./ $SERVER_USER@$SERVER_HOST:$SERVER_DIR/
fi

# 在远程服务器上构建和启动应用
echo "在远程服务器上部署应用..."
if $USE_KEY; then
    ssh $SSH_OPTS $SERVER_USER@$SERVER_HOST "cd $SERVER_DIR && \
        if ! command -v docker &> /dev/null; then
            echo '错误: 请先在服务器上安装 Docker'
            exit 1
        fi && \
        # 创建临时环境变量文件
        echo -e \"$ENV_ARGS\" > .env.temp && \
        # 检查应用是否已经运行
        if docker ps | grep -q 'zido-container'; then
            echo '应用已在运行，执行平滑更新...' && \
            docker build $(echo $BUILD_ARGS) -t zido . && \
            docker stop zido-container || true && \
            docker rm zido-container || true && \
            docker run -d --name zido-container -p 3000:3000 --env-file .env.temp --restart always zido && \
            # 删除临时环境变量文件
            rm -f .env.temp
        else
            echo '应用未运行，启动新实例...' && \
            docker build $(echo $BUILD_ARGS) -t zido . && \
            docker run -d --name zido-container -p 3000:3000 --env-file .env.temp --restart always zido && \
            # 删除临时环境变量文件
            rm -f .env.temp
        fi"
elif [ ! -z "$SERVER_PASSWORD" ]; then
    sshpass -p "$SERVER_PASSWORD" ssh $SSH_OPTS $SERVER_USER@$SERVER_HOST "cd $SERVER_DIR && \
        if ! command -v docker &> /dev/null; then
            echo '错误: 请先在服务器上安装 Docker'
            exit 1
        fi && \
        # 创建临时环境变量文件
        echo -e \"$ENV_ARGS\" > .env.temp && \
        # 检查应用是否已经运行
        if docker ps | grep -q 'zido-container'; then
            echo '应用已在运行，执行平滑更新...' && \
            docker build $(echo $BUILD_ARGS) -t zido . && \
            docker stop zido-container || true && \
            docker rm zido-container || true && \
            docker run -d --name zido-container -p 3000:3000 --env-file .env.temp --restart always zido && \
            # 删除临时环境变量文件
            rm -f .env.temp
        else
            echo '应用未运行，启动新实例...' && \
            docker build $(echo $BUILD_ARGS) -t zido . && \
            docker run -d --name zido-container -p 3000:3000 --env-file .env.temp --restart always zido && \
            # 删除临时环境变量文件
            rm -f .env.temp
        fi"
else
    ssh $SSH_OPTS $SERVER_USER@$SERVER_HOST "cd $SERVER_DIR && \
        if ! command -v docker &> /dev/null; then
            echo '错误: 请先在服务器上安装 Docker'
            exit 1
        fi && \
        # 创建临时环境变量文件
        echo -e \"$ENV_ARGS\" > .env.temp && \
        # 检查应用是否已经运行
        if docker ps | grep -q 'zido-container'; then
            echo '应用已在运行，执行平滑更新...' && \
            docker build $(echo $BUILD_ARGS) -t zido . && \
            docker stop zido-container || true && \
            docker rm zido-container || true && \
            docker run -d --name zido-container -p 3000:3000 --env-file .env.temp --restart always zido && \
            # 删除临时环境变量文件
            rm -f .env.temp
        else
            echo '应用未运行，启动新实例...' && \
            docker build $(echo $BUILD_ARGS) -t zido . && \
            docker run -d --name zido-container -p 3000:3000 --env-file .env.temp --restart always zido && \
            # 删除临时环境变量文件
            rm -f .env.temp
        fi"
fi

echo "部署完成! Zido 应用现在应该在 http://$SERVER_HOST:3000 运行"
if [ ! -z "$SERVER_PASSWORD" ]; then
    echo "使用 'sshpass -p \"$SERVER_PASSWORD\" ssh $SSH_OPTS $SERVER_USER@$SERVER_HOST \"docker logs -f zido-container\"' 查看应用日志"
else
    echo "使用 'ssh $SSH_OPTS $SERVER_USER@$SERVER_HOST \"docker logs -f zido-container\"' 查看应用日志"
fi
