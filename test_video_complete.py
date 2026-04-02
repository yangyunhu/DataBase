#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频下载完整测试脚本
"""

import json
import subprocess
import os
import sys
import time

# Python 路径
PYTHON_PATH = "C:\\Users\\dmy53\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"
VIDEO_EXTRACT_SCRIPT = os.path.join(os.path.dirname(__file__), 'server', 'video_extract.py')
TEMP_DIR = os.path.join(os.path.dirname(__file__), 'server', 'temp')

def test_video_download_full流程():
    """测试视频下载完整流程"""
    print("=== 开始测试视频下载完整流程 ===")
    
    # 测试B站视频
    test_url = "https://www.bilibili.com/video/BV1PTzhB4E4S/"  # 测试视频
    
    print(f"测试视频: {test_url}")
    
    try:
        # 1. 清理临时目录
        if os.path.exists(TEMP_DIR):
            for file in os.listdir(TEMP_DIR):
                if file.startswith('video_'):
                    file_path = os.path.join(TEMP_DIR, file)
                    try:
                        os.unlink(file_path)
                        print(f"清理旧文件: {file}")
                    except Exception as e:
                        print(f"清理文件失败: {e}")
        
        # 2. 执行下载命令
        print("\n开始下载视频...")
        start_time = time.time()
        
        result = subprocess.run(
            [PYTHON_PATH, VIDEO_EXTRACT_SCRIPT, 'download', test_url, 'best', 'mp4'],
            capture_output=True,
            text=True,
            timeout=120  # 2分钟超时
        )
        
        end_time = time.time()
        print(f"下载耗时: {end_time - start_time:.2f} 秒")
        print(f"返回码: {result.returncode}")
        
        if result.stdout:
            print(f"标准输出: {result.stdout}")
        
        if result.stderr:
            print(f"标准错误: {result.stderr}")
        
        # 3. 解析下载结果
        if result.returncode == 0:
            try:
                download_result = json.loads(result.stdout)
                if download_result.get('success'):
                    print("PASS: 下载成功")
                    print(f"  标题: {download_result.get('title')}")
                    print(f"  文件路径: {download_result.get('filepath')}")
                    
                    # 4. 检查文件是否存在且大小合理
                    filepath = download_result.get('filepath')
                    if os.path.exists(filepath):
                        file_size = os.path.getsize(filepath)
                        print(f"  文件大小: {file_size} 字节")
                        if file_size > 1024:
                            print("PASS: 文件大小正常")
                            
                            # 5. 检查文件扩展名
                            ext = os.path.splitext(filepath)[1].lower()
                            print(f"  文件扩展名: {ext}")
                            
                            # 6. 检查临时目录中的文件
                            print("\n临时目录文件:")
                            for file in os.listdir(TEMP_DIR):
                                if file.startswith('video_'):
                                    file_path = os.path.join(TEMP_DIR, file)
                                    file_size = os.path.getsize(file_path)
                                    print(f"  - {file}: {file_size} 字节")
                        else:
                            print("FAIL: 文件大小异常")
                    else:
                        print("FAIL: 文件不存在")
                else:
                    print(f"FAIL: 下载失败: {download_result.get('error')}")
            except json.JSONDecodeError as e:
                print(f"FAIL: 解析结果失败: {e}")
        else:
            print("FAIL: 命令执行失败")
            
    except subprocess.TimeoutExpired:
        print("FAIL: 下载超时")
    except Exception as e:
        print(f"FAIL: 测试失败: {e}")

def test_yt_dlp直接调用():
    """直接测试yt-dlp命令"""
    print("\n=== 测试yt-dlp直接调用 ===")
    
    test_url = "https://www.bilibili.com/video/BV1PTzhB4E4S/"
    output_file = os.path.join(TEMP_DIR, f"test_direct_{int(time.time())}.mp4")
    
    print(f"测试视频: {test_url}")
    print(f"输出文件: {output_file}")
    
    try:
        # 直接使用yt-dlp命令
        cmd = [
            'yt-dlp',
            '-f', 'bestvideo[vcodec^=avc1]+bestaudio/bestvideo+bestaudio/best',
            '--merge-output-format', 'mp4',
            '-o', output_file,
            test_url
        ]
        
        print(f"执行命令: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        print(f"返回码: {result.returncode}")
        
        if result.stdout:
            print(f"标准输出: {result.stdout}")
        
        if result.stderr:
            print(f"标准错误: {result.stderr}")
        
        if result.returncode == 0:
            if os.path.exists(output_file):
                file_size = os.path.getsize(output_file)
                print(f"PASS: 直接下载成功，文件大小: {file_size} 字节")
            else:
                print("FAIL: 直接下载失败，文件不存在")
        else:
            print("FAIL: 直接下载命令执行失败")
            
    except Exception as e:
        print(f"FAIL: 直接测试失败: {e}")

if __name__ == "__main__":
    test_video_download_full流程()
    test_yt_dlp直接调用()
    print("\n=== 测试完成 ===")
