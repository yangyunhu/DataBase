import subprocess
import json
import os

PYTHON_PATH = "C:\\Users\\dmy53\\AppData\\Local\\Programs\\Python\\Python311\\python.exe"
VIDEO_EXTRACT_SCRIPT = os.path.join(os.path.dirname(__file__), 'server', 'video_extract.py')

def test_python_video_script():
    """直接测试Python视频提取脚本"""
    print("=== 测试Python视频提取脚本 ===")
    
    test_url = "https://www.bilibili.com/video/BV1PTzhB4E4S/"
    
    print(f"测试视频: {test_url}")
    print(f"Python路径: {PYTHON_PATH}")
    print(f"脚本路径: {VIDEO_EXTRACT_SCRIPT}")
    
    try:
        # 执行Python脚本
        result = subprocess.run(
            [PYTHON_PATH, VIDEO_EXTRACT_SCRIPT, 'download', test_url, 'best', 'mp4'],
            capture_output=True,
            text=True,
            timeout=120
        )
        
        print(f"返回码: {result.returncode}")
        print(f"标准输出: {result.stdout}")
        print(f"标准错误: {result.stderr}")
        
        if result.returncode == 0:
            try:
                download_result = json.loads(result.stdout)
                print(f"解析结果: {download_result}")
            except json.JSONDecodeError as e:
                print(f"解析结果失败: {e}")
        else:
            print("脚本执行失败")
            
    except subprocess.TimeoutExpired:
        print("执行超时")
    except Exception as e:
        print(f"测试失败: {e}")

if __name__ == "__main__":
    test_python_video_script()
