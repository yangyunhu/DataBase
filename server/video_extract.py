#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频提取脚本 - 使用 yt-dlp 提取视频信息
支持 B站 / 小红书 / YouTube 等平台

注意：
1. 此脚本需要网络访问才能正常工作
2. 需要 FFmpeg 来合并视频和音频
3. 抖音和快手需要特殊处理（见下方说明）
"""

import sys
import json
import yt_dlp
import re
import socket
import os
import time
import requests

# 设置 stdout 编码为 UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# FFmpeg 路径配置
FFMPEG_PATH = r"C:\Users\dmy53\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1-full_build\bin\ffmpeg.exe"

def check_network_access():
    """检查网络访问"""
    try:
        # 尝试连接百度
        socket.create_connection(("www.baidu.com", 80), timeout=3)
        return True
    except:
        try:
            # 尝试连接 Google
            socket.create_connection(("www.google.com", 80), timeout=3)
            return True
        except:
            return False

def resolve_short_url(url):
    """解析短链接，获取真实URL"""
    try:
        # 处理快手短链接
        if 'v.kuaishou.com' in url or 'kuaishou.com/f/' in url:
            # 快手短链接需要移动端User-Agent才能正确解析
            headers = {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9',
            }
            response = requests.get(url, headers=headers, allow_redirects=True, timeout=10)
            final_url = response.url
            
            # 检查是否被重定向到主页或推荐页
            if final_url in ['https://www.kuaishou.com/', 'https://m.kuaishou.com/', 'https://www.kuaishou.com/new-reco']:
                # 尝试从页面内容中提取视频ID
                content = response.text
                # 查找视频分享链接模式
                video_match = re.search(r'/(short-video/[\w]+)', content)
                if video_match:
                    return f"https://www.kuaishou.com/{video_match.group(1)}"
                # 如果无法提取，返回特殊标记
                return "__KUAISHOU_SHORT_LINK_ERROR__"
            return final_url
        return url
    except Exception as e:
        print(f"解析短链接失败: {e}", file=sys.stderr)
        return url

def format_duration(seconds):
    """格式化时长"""
    if not seconds:
        return "00:00"
    minutes, secs = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"

def format_views(view_count):
    """格式化观看数"""
    if not view_count:
        return "0"
    count = int(view_count)
    if count >= 10000:
        return f"{count / 10000:.1f}万"
    return str(count)

def format_filesize(bytes_size):
    """格式化文件大小"""
    if not bytes_size:
        return "未知"
    size = int(bytes_size)
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024:
            return f"{size:.1f}{unit}"
        size /= 1024
    return f"{size:.1f}TB"

def extract_video_info(url):
    """提取视频信息"""
    try:
        # 首先检查网络访问
        if not check_network_access():
            return {
                "error": "网络连接受限，无法访问视频平台。请确保服务器可以访问互联网。",
                "network_error": True
            }
        
        # 检查是否是抖音链接
        if 'douyin.com' in url or 'iesdouyin.com' in url:
            return {
                "error": "抖音视频暂不支持直接提取。\n\n原因：抖音使用了特殊的反爬机制，yt-dlp 无法直接解析。\n\n替代方案：\n1. 使用抖音官方分享功能获取无水印链接\n2. 使用第三方抖音解析 API\n3. 手动下载后上传",
                "platform": "douyin",
                "supported": False
            }
        
        # 检查是否是快手链接
        if 'kuaishou.com' in url:
            return {
                "error": "目前仅支持B站和小红书视频提取，其他平台正在开发中，请稍后再试。",
                "platform": "kuaishou",
                "supported": False
            }
        
        # 检查是否是不支持的平台
        is_bilibili = 'bilibili.com' in url or 'b23.tv' in url
        is_xiaohongshu = 'xiaohongshu.com' in url or 'xhslink.com' in url
        
        if not is_bilibili and not is_xiaohongshu:
            return {
                "error": "目前仅支持B站和小红书视频提取，其他平台正在开发中，请稍后再试。",
                "platform": "unknown",
                "supported": False
            }
        
        # yt-dlp 选项
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'socket_timeout': 30,
            'retries': 3,
            'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'headers': {
                'Referer': 'https://www.bilibili.com',
                'Accept-Language': 'zh-CN,zh;q=0.9'
            }
        }
        
        # 如果 FFmpeg 存在，配置路径
        if os.path.exists(FFMPEG_PATH):
            ydl_opts['ffmpeg_location'] = FFMPEG_PATH
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # 提取视频信息
            info = ydl.extract_info(url, download=False)
            
            if not info:
                return {"error": "无法提取视频信息，请检查链接是否有效"}
            
            # 检查是否是播放列表
            if info.get('_type') == 'playlist' and info.get('entries'):
                # 如果是播放列表，使用第一个视频的信息
                video_info = info['entries'][0]
                playlist_title = info.get('title', '未知播放列表')
            else:
                # 单个视频
                video_info = info
                playlist_title = None
            
            # 获取视频标题
            title = video_info.get('title', '未知标题')
            if playlist_title and playlist_title != title:
                title = f"{playlist_title} - {title}"
            
            # 获取作者/上传者
            author = video_info.get('uploader') or video_info.get('channel') or video_info.get('creator') or '未知作者'
            
            # 获取时长
            duration = format_duration(video_info.get('duration'))
            
            # 获取观看数
            views = format_views(video_info.get('view_count'))
            
            # 获取封面
            thumbnail = video_info.get('thumbnail', '')
            
            # 获取平台信息
            extractor = info.get('extractor', '未知')
            platform_map = {
                'Bilibili': 'B站',
                'BiliBili': 'B站',
                'Kuaishou': '快手',
                'XiaoHongShu': '小红书',
                'Youtube': 'YouTube',
                'TikTok': 'TikTok',
                'Youku': '优酷',
                'Sohu': '搜狐',
            }
            platform = platform_map.get(extractor, extractor)
            
            # 获取可用格式
            formats = []
            if 'formats' in video_info:
                # 检查平台类型
                is_bilibili = extractor in ['Bilibili', 'BiliBili']
                
                if is_bilibili:
                    # B站视频和音频是分开的，需要特殊处理
                    # 获取最佳音频格式
                    audio_formats = [f for f in video_info['formats'] if f.get('vcodec') == 'none' and f.get('acodec') != 'none']
                    best_audio = max(audio_formats, key=lambda x: x.get('abr', 0)) if audio_formats else None
                    
                    # 获取视频格式
                    video_formats = [f for f in video_info['formats'] if f.get('vcodec') != 'none' and f.get('acodec') == 'none']
                    
                    # 按分辨率分组
                    quality_map = {}
                    for fmt in video_formats:
                        height = fmt.get('height', 0)
                        if height:
                            quality = f"{height}P"
                            if quality not in quality_map:
                                quality_map[quality] = {
                                    'height': height,
                                    'video_format': fmt,
                                    'audio_format': best_audio
                                }
                    
                    # 选择主要清晰度
                    target_qualities = ['1080P', '720P', '480P', '360P']
                    for quality in target_qualities:
                        if quality in quality_map:
                            data = quality_map[quality]
                            video_fmt = data['video_format']
                            audio_fmt = data['audio_format']
                            
                            # 构建组合 URL（视频+音频）
                            # 使用 yt-dlp 的格式选择语法
                            format_id = video_fmt.get('format_id', '')
                            if audio_fmt:
                                format_id += f"+{audio_fmt.get('format_id', '')}"
                            
                            formats.append({
                                'quality': quality,
                                'size': format_filesize(video_fmt.get('filesize') or video_fmt.get('filesize_approx')),
                                'url': video_fmt.get('url', ''),
                                'format_id': format_id,
                                'has_audio': audio_fmt is not None
                            })
                    
                    # 如果没有找到目标清晰度，使用最高可用清晰度
                    if not formats and quality_map:
                        highest = max(quality_map.values(), key=lambda x: x['height'])
                        video_fmt = highest['video_format']
                        audio_fmt = highest['audio_format']
                        format_id = video_fmt.get('format_id', '')
                        if audio_fmt:
                            format_id += f"+{audio_fmt.get('format_id', '')}"
                        
                        formats.append({
                            'quality': f"{highest['height']}P",
                            'size': format_filesize(video_fmt.get('filesize') or video_fmt.get('filesize_approx')),
                            'url': video_fmt.get('url', ''),
                            'format_id': format_id,
                            'has_audio': audio_fmt is not None
                        })
                else:
                    # 其他平台（如小红书），视频和音频在一起
                    video_formats = [f for f in video_info['formats'] if f.get('vcodec') != 'none']
                    
                    # 按分辨率分组
                    quality_map = {}
                    for fmt in video_formats:
                        height = fmt.get('height', 0)
                        if height:
                            quality = f"{height}P"
                            if quality not in quality_map:
                                quality_map[quality] = {
                                    'height': height,
                                    'format': fmt
                                }
                    
                    # 选择主要清晰度
                    target_qualities = ['1080P', '720P', '480P', '360P']
                    for quality in target_qualities:
                        if quality in quality_map:
                            fmt = quality_map[quality]['format']
                            formats.append({
                                'quality': quality,
                                'size': format_filesize(fmt.get('filesize') or fmt.get('filesize_approx')),
                                'url': fmt.get('url', ''),
                                'format_id': fmt.get('format_id', ''),
                                'has_audio': fmt.get('acodec') != 'none'
                            })
                    
                    # 如果没有找到目标清晰度，使用最高可用清晰度
                    if not formats and quality_map:
                        highest = max(quality_map.values(), key=lambda x: x['height'])
                        fmt = highest['format']
                        formats.append({
                            'quality': f"{highest['height']}P",
                            'size': format_filesize(fmt.get('filesize') or fmt.get('filesize_approx')),
                            'url': fmt.get('url', ''),
                            'format_id': fmt.get('format_id', ''),
                            'has_audio': fmt.get('acodec') != 'none'
                        })
            
            # 构建返回结果
            result = {
                'title': title,
                'author': author,
                'duration': duration,
                'views': views,
                'cover': thumbnail,
                'platform': platform,
                'formats': formats if formats else [
                    {'quality': '默认', 'size': '未知', 'url': '', 'format_id': ''}
                ],
                'original_url': url,
                'extractor': extractor,
                'success': True
            }
            
            return result
            
    except yt_dlp.utils.DownloadError as e:
        error_msg = str(e)
        if "Unsupported URL" in error_msg:
            return {
                "error": "不支持的链接格式，请检查链接是否正确。\n\n支持的平台：B站、小红书、YouTube、TikTok、优酷等\n\n注意：抖音和快手暂不支持",
                "platform": "unknown",
                "supported": False
            }
        elif "timed out" in error_msg or "timeout" in error_msg.lower():
            return {"error": "连接超时，请检查网络连接或稍后重试"}
        elif "unavailable" in error_msg.lower() or "not available" in error_msg.lower():
            return {"error": "视频不可用，可能已被删除或设为私密"}
        else:
            return {"error": f"视频提取失败: {error_msg}"}
    except Exception as e:
        return {"error": f"视频提取失败: {str(e)}"}

def download_video(url, quality='best', output_format='mp4'):
    """下载视频"""
    try:
        # 检查是否是支持的平台
        is_bilibili = 'bilibili.com' in url or 'b23.tv' in url
        is_xiaohongshu = 'xiaohongshu.com' in url or 'xhslink.com' in url
        
        if not is_bilibili and not is_xiaohongshu:
            return {"error": "目前仅支持B站和小红书视频下载，其他平台正在开发中，请稍后再试。"}
        
        # 构建下载选项
        # 使用 H.264 编码（avc1）而不是 AV1，确保兼容性
        # 优先选择带有 h264 编码的视频
        if quality != 'best':
            # 指定清晰度，优先 H.264 编码
            format_spec = f'bestvideo[height<={quality}][vcodec^=avc1]+bestaudio/bestvideo[height<={quality}]+bestaudio/best[height<={quality}]'
        else:
            # 最佳质量，优先 H.264 编码
            format_spec = 'bestvideo[vcodec^=avc1]+bestaudio/bestvideo+bestaudio/best'
        
        # 获取输出目录
        output_dir = os.path.join(os.path.dirname(__file__), "temp")
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # 生成唯一的输出文件名
        timestamp = int(time.time())
        output_filename = f"video_{timestamp}.{output_format}"
        output_template = os.path.join(output_dir, output_filename)
        
        ydl_opts = {
            'format': format_spec,
            'merge_output_format': output_format,
            'outtmpl': output_template,
            'socket_timeout': 60,
            'retries': 3,
            'quiet': True,
            'no_warnings': True,
            'noprogress': True,
        }
        
        # 如果 FFmpeg 存在，配置路径
        if os.path.exists(FFMPEG_PATH):
            ydl_opts['ffmpeg_location'] = FFMPEG_PATH
        
        actual_filepath = output_template
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
            # 验证文件是否存在
            if not os.path.exists(actual_filepath):
                # 尝试在输出目录中查找最新生成的视频文件
                files = [os.path.join(output_dir, f) for f in os.listdir(output_dir) if f.startswith('video_')]
                if files:
                    actual_filepath = max(files, key=os.path.getctime)
                else:
                    return {"error": "视频文件下载失败，无法找到下载的文件"}
            
            # 检查文件大小
            if os.path.getsize(actual_filepath) < 1024:  # 小于1KB的文件可能是错误的
                return {"error": "视频文件下载失败，文件大小异常"}
            
            return {
                'success': True,
                'title': info.get('title', '未知'),
                'filepath': actual_filepath
            }
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"下载失败: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "请提供操作类型"}, ensure_ascii=True))
        sys.exit(1)
    
    action = sys.argv[1]
    
    if action == "download":
        # 下载视频模式
        if len(sys.argv) < 5:
            print(json.dumps({"error": "下载模式需要: download <url> <quality> <format>"}, ensure_ascii=True))
            sys.exit(1)
        
        video_url = sys.argv[2]
        quality = sys.argv[3]
        output_format = sys.argv[4]
        
        # 下载视频
        result = download_video(video_url, quality, output_format)
        print(json.dumps(result, ensure_ascii=True))
        
    else:
        # 提取信息模式（默认）
        video_url = sys.argv[1]
        result = extract_video_info(video_url)
        print(json.dumps(result, ensure_ascii=True))
