#!/bin/bash

set -euo pipefail

# 获取脚本所在的绝对路径
webPath=$(cd "$(dirname "$0")" && pwd)

echo "脚本所在目录: $webPath"

release_dist(){
    cd "${webPath}"

    # rm -rf smars81*

    # time=$(date "+%Y%m%d_%H%M%S")
    # name="smars81-${time}"

    # echo "打包文件名: ${name}.tar.gz"

    # # 创建压缩包（包含 package.json、server、node_modules）
    # tar -czf "${name}.tar.gz" server

    # remote_host="root@192.168.1.222"
    # remote_dir="/data/mnt/docker/smars81/app/help-server/"

    # 发送到服务器
    scp -r package.json server/ root@192.168.1.222:/data/mnt/docker/smars83/app/


}

release_dist
