#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图片文字提取脚本 - 使用pytesseract
"""
import sys
import os
import json

# 设置编码
sys.stdout.reconfigure(encoding='utf-8')

def extract_text_with_pytesseract(image_path):
    """
    使用pytesseract从图片中提取文字
    """
    try:
        from PIL import Image
        import pytesseract
        
        print(f"正在处理图片: {image_path}", file=sys.stderr)
        
        # 打开图片
        image = Image.open(image_path)
        
        # 使用Tesseract OCR提取文字
        # lang='chi_sim+eng' 表示使用中文简体和英文
        text = pytesseract.image_to_string(image, lang='chi_sim+eng')
        
        # 清理文本
        text = text.strip()
        
        if not text:
            text = "未能识别到文字，请确保图片中包含清晰的文字内容。"
        
        return {
            "success": True,
            "text": text
        }
        
    except (ImportError, FileNotFoundError) as e:
        print(f"OCR引擎未安装: {e}", file=sys.stderr)
        return {
            "success": False,
            "error": f"OCR引擎未安装: {str(e)}",
            "text": "系统未安装Tesseract OCR引擎，无法提取文字。\n\n请按照以下步骤安装Tesseract OCR引擎：\n\n1. 下载安装包：\n   - 访问：https://github.com/UB-Mannheim/tesseract/wiki\n   - 下载适合您系统的安装包（推荐：tesseract-ocr-w64-setup-xxx.exe）\n\n2. 安装Tesseract OCR：\n   - 运行安装程序\n   - **重要**：安装时勾选'中文语言包'（Chinese - Simplified）\n   - 记住安装路径（默认：`C:\\Program Files\\Tesseract-OCR`）\n\n3. 添加环境变量：\n   - 右键'此电脑' → '属性' → '高级系统设置' → '环境变量'\n   - 在'系统变量'中找到'Path'，点击'编辑'\n   - 点击'新建'，添加Tesseract安装路径（例如：`C:\\Program Files\\Tesseract-OCR`）\n   - 点击'确定'保存所有设置\n\n4. 重启电脑：\n   - 重启后环境变量生效\n\n5. 验证安装：\n   - 打开命令提示符，运行：`tesseract --version`\n   - 如果显示版本信息，则安装成功\n\n安装完成后，OCR文字提取功能即可正常使用。"
        }
    except Exception as e:
        print(f"OCR提取失败: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        
        return {
            "success": False,
            "error": f"文字提取失败: {str(e)}",
            "text": "文字提取失败，请确保:\n1. 图片格式正确（JPG、PNG、BMP）\n2. 图片清晰度足够\n3. 文字对比度明显"
        }

def extract_text_from_image(image_path):
    """
    从图片中提取文字（主入口函数）
    """
    return extract_text_with_pytesseract(image_path)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("用法: python ocr_extract.py <图片路径>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if not os.path.exists(image_path):
        print(json.dumps({
            "success": False,
            "error": "图片文件不存在"
        }, ensure_ascii=False))
        sys.exit(1)
    
    result = extract_text_from_image(image_path)
    print(json.dumps(result, ensure_ascii=False))
