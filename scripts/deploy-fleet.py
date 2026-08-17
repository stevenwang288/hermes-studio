#!/usr/bin/env python3
"""
deploy-fleet.py — 部署 hermes-studio 构建产物到 31/35/36/61 Linux 节点

用法:
  python scripts/deploy-fleet.py               # 先 npm run build 再部署
  python scripts/deploy-fleet.py --skip-build  # 用已有 dist/ 部署
  python scripts/deploy-fleet.py --node 36     # 只部署指定节点

依赖: paramiko (Windows 全局 Python312 自带)
"""

import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import time

import paramiko

# ============================================================
# 节点配置
# ============================================================
NODES = {
    "31": {
        "host": "192.168.9.31",
        "user": "root",
        "password": "admin",
        "deploy_path": "/usr/lib/node_modules/hermes-web-ui",
        "restart_cmd": "systemctl restart hermes-web-ui",
        "label": "31号",
    },
    "35": {
        "host": "192.168.9.35",
        "user": "root",
        "password": "admin",
        "deploy_path": "/opt/hermes-studio",
        "restart_cmd": "systemctl restart hermes-studio",
        "label": "35号",
    },
    "36": {
        "host": "192.168.9.36",
        "user": "root",
        "password": "admin",
        "deploy_path": "/home/ubuntu/.local/npm-global/lib/node_modules/hermes-web-ui",
        "restart_cmd": "systemctl restart hermes-web-ui",
        "deploy_user": "ubuntu",
        "label": "36号",
    },
    "61": {
        "host": "192.168.9.61",
        "user": "root",
        "password": "admin",
        "deploy_path": "/opt/hermes-studio",
        "restart_cmd": "systemctl restart hermes-studio",
        "label": "61号",
    },
}


def build():
    """本地构建"""
    print("[INFO] 执行 npm run build...")
    result = subprocess.run(
        "npm run build", shell=True, capture_output=True, text=True, timeout=300
    )
    if result.returncode != 0:
        print("[ERR] 构建失败:")
        print(result.stdout[-500:])
        print(result.stderr[-500:])
        sys.exit(1)
    print("[OK] 构建通过")


def deploy_to_node(node_key, dist_dir):
    """部署到单个节点"""
    node = NODES[node_key]
    label = node["label"]
    deploy_path = node["deploy_path"]
    host = node["host"]

    print(f"\n========== 部署到 {label} ({host}) ==========")

    # 打包 dist/
    tmp_dir = tempfile.mkdtemp(prefix=f"hermes-deploy-{node_key}-")
    tarball = os.path.join(tmp_dir, "hermes-dist.tar.gz")
    print(f"  打包 dist/ → {tarball}")
    subprocess.run(
        ["tar", "czf", tarball, "-C", dist_dir, "."],
        check=True,
        capture_output=True,
        text=True,
    )

    try:
        # SSH 连接
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=node["user"], password=node["password"], timeout=10)
        sftp = ssh.open_sftp()

        # 备份
        bak_suffix = time.strftime("%Y%m%d%H%M%S")
        print(f"  备份: {deploy_path} → {deploy_path}.bak.{bak_suffix}")
        ssh.exec_command(f"cp -r {deploy_path} {deploy_path}.bak.{bak_suffix}", timeout=30)

        # 上传
        remote_tar = f"/tmp/hermes-deploy-{node_key}.tar.gz"
        print(f"  上传 tarball → {host}:{remote_tar}")
        sftp.put(tarball, remote_tar)

        # 解压部署
        print(f"  解压到 {deploy_path}")
        deploy_user = node.get("deploy_user")
        chown = f"chown -R {deploy_user}:{deploy_user} {deploy_path}/dist 2>/dev/null; " if deploy_user else ""
        cmd = (
            f"rm -rf {deploy_path}/dist.new 2>/dev/null; "
            f"mkdir -p {deploy_path}/dist.new; "
            f"tar xzf {remote_tar} -C {deploy_path}/dist.new/; "
            f"{chown}"
            f"rm -rf {deploy_path}/dist && mv {deploy_path}/dist.new {deploy_path}/dist; "
            f"rm -f {remote_tar}"
        )
        _, stdout, stderr = ssh.exec_command(cmd, timeout=60)
        stdout.channel.recv_exit_status()
        err = stderr.read().decode("utf-8", "ignore").strip()
        if err:
            print(f"  STDERR: {err}")

        # 重启
        print(f"  重启服务: {node['restart_cmd']}")
        _, stdout, stderr = ssh.exec_command(node["restart_cmd"], timeout=30)
        exit_code = stdout.channel.recv_exit_status()
        out = stdout.read().decode("utf-8", "ignore").strip()
        err = stderr.read().decode("utf-8", "ignore").strip()
        if exit_code != 0:
            print(f"  ⚠️  重启返回码 {exit_code}")
            if err:
                print(f"  STDERR: {err}")
        else:
            print(f"  ✅ {label} 重启成功")

        # 验证
        time.sleep(3)
        if "systemctl" in node["restart_cmd"]:
            _, so, _ = ssh.exec_command(
                f"systemctl is-active {node['restart_cmd'].split()[-1]}", timeout=10
            )
            status = so.read().decode("utf-8", "ignore").strip()
            print(f"  服务状态: {status}")

        sftp.close()
        ssh.close()
        print(f"  ✅ {label} 部署完成")

    except Exception as e:
        print(f"  ❌ {label} 部署失败: {e}")
        raise
    finally:
        # 清理临时文件
        shutil.rmtree(tmp_dir, ignore_errors=True)


def main():
    parser = argparse.ArgumentParser(description="部署 hermes-studio 到 Linux 节点")
    parser.add_argument("--skip-build", action="store_true", help="跳过构建，使用已有 dist/")
    parser.add_argument("--node", choices=list(NODES.keys()) + ["all"], default="all",
                        help="目标节点 (默认: all)")
    args = parser.parse_args()

    # 确定构建产物路径
    script_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.dirname(script_dir)
    dist_dir = os.path.join(repo_root, "dist")

    if not args.skip_build:
        build()
    else:
        if not os.path.isdir(dist_dir):
            print(f"[ERR] dist/ 目录不存在: {dist_dir}")
            sys.exit(1)
        print(f"[INFO] 使用已有构建产物: {dist_dir}")

    if not os.path.isdir(dist_dir):
        print(f"[ERR] dist/ 目录不存在: {dist_dir}")
        sys.exit(1)

    # 列出 dist 内容
    dist_items = [f for f in os.listdir(dist_dir) if os.path.isdir(os.path.join(dist_dir, f))]
    print(f"[INFO] dist/ 包含: {dist_items}")

    # 部署
    nodes_to_deploy = [args.node] if args.node != "all" else list(NODES.keys())
    for node_key in nodes_to_deploy:
        deploy_to_node(node_key, dist_dir)

    print("\n" + "=" * 50)
    print("✅ 全部部署完成！")
    print("=" * 50)
    print()
    print("Windows 桌面版需手动构建:")
    print("  cd packages/desktop && npm run dist:win")


if __name__ == "__main__":
    main()