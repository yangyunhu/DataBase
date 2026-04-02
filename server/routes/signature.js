const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const safeName = baseName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_");
    cb(null, safeName + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

// 处理PDF文件添加印章
async function processPdfWithSeal(pdfPath, sealPath, seals) {
  try {
    // 读取PDF文件
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // 处理印章图片
    const sealImage = await sharp(sealPath)
      .resize(150, 150, { fit: 'contain' })
      .toBuffer();
    
    // 添加印章图片到PDF
    const sealImageObject = await pdfDoc.embedPng(sealImage);
    
    // 获取PDF页面
    const pages = pdfDoc.getPages();
    
    // 为每个印章位置添加印章
    seals.forEach((seal) => {
      if (seal.pageIndex >= 0 && seal.pageIndex < pages.length) {
        const page = pages[seal.pageIndex];
        const { width, height } = page.getSize();
        
        // 计算印章位置（相对于页面大小）
        const x = (seal.x / 100) * width;
        const y = height - (seal.y / 100) * height;
        
        // 绘制印章
        page.drawImage(sealImageObject, {
          x: x - 75, // 印章宽度的一半
          y: y - 75, // 印章高度的一半
          width: 150,
          height: 150,
          opacity: 0.7
        });
      }
    });
    
    // 保存PDF
    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
  } catch (error) {
    console.error("[签章模块] 处理PDF失败:", error);
    throw error;
  }
}

// 处理图片文件添加印章并转换为PDF
async function processImageWithSeal(imagePath, sealPath, seals) {
  try {
    // 读取图片文件
    const imageBuffer = fs.readFileSync(imagePath);
    
    // 处理图片
    let processedImage = sharp(imageBuffer);
    const metadata = await processedImage.metadata();
    
    // 处理印章图片
    const sealBuffer = await sharp(sealPath)
      .resize(150, 150, { fit: 'contain' })
      .toBuffer();
    
    // 为每个印章位置添加印章
    for (const seal of seals) {
      // 计算印章位置
      const x = (seal.x / 100) * metadata.width;
      const y = (seal.y / 100) * metadata.height;
      
      // 复合印章到图片
      processedImage = processedImage.composite([{
        input: sealBuffer,
        left: Math.round(x - 75), // 印章宽度的一半
        top: Math.round(y - 75), // 印章高度的一半
        blend: 'over'
      }]);
    }
    
    // 转换为PDF
    const pdfBuffer = await processedImage.toBuffer();
    
    // 创建新的PDF文档
    const pdfDoc = await PDFDocument.create();
    
    // 嵌入图片
    const imageObject = await pdfDoc.embedPng(pdfBuffer);
    const { width, height } = imageObject.scale(1);
    
    // 添加页面
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(imageObject, {
      x: 0,
      y: 0,
      width: width,
      height: height
    });
    
    // 保存PDF
    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
  } catch (error) {
    console.error("[签章模块] 处理图片失败:", error);
    throw error;
  }
}

// 电子签章 API
router.post("/signature", upload.fields([
  { name: "file", maxCount: 1 },
  { name: "seal", maxCount: 1 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.file || !req.files.seal) {
      return res.status(400).json({ error: "请上传文件和印章" });
    }
    
    const file = req.files.file[0];
    const seal = req.files.seal[0];
    const seals = req.body.seals ? JSON.parse(req.body.seals) : [];
    
    console.log(`[签章模块] 收到签章请求: 文件=${file.originalname}, 印章=${seal.originalname}, 印章数量=${seals.length}`);
    
    let outputBuffer;
    
    if (file.originalname.toLowerCase().endsWith('.pdf')) {
      // 处理PDF文件
      outputBuffer = await processPdfWithSeal(file.path, seal.path, seals);
    } else if (file.originalname.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
      // 处理图片文件
      outputBuffer = await processImageWithSeal(file.path, seal.path, seals);
    } else {
      return res.status(400).json({ error: "不支持的文件类型" });
    }
    
    // 清理临时文件
    try {
      fs.unlinkSync(file.path);
      fs.unlinkSync(seal.path);
    } catch (e) {
      console.log("[签章模块] 清理临时文件失败:", e.message);
    }
    
    // 设置响应头
    const outputFilename = path.basename(file.originalname, path.extname(file.originalname)) + "-signed.pdf";
    res.setHeader("Content-Type", "application/pdf");
    const encodedFilename = encodeURIComponent(outputFilename);
    res.setHeader("Content-Disposition", `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`);
    res.setHeader("Content-Length", outputBuffer.length);
    
    res.send(outputBuffer);
    
    console.log(`[签章模块] 签章完成: ${outputFilename}, 大小: ${outputBuffer.length} bytes`);
    
  } catch (error) {
    console.error("[签章模块] 签章失败:", error);
    // 清理临时文件
    if (req.files && req.files.file && req.files.file[0] && fs.existsSync(req.files.file[0].path)) {
      try {
        fs.unlinkSync(req.files.file[0].path);
      } catch (e) {
        console.log("[签章模块] 清理临时文件失败:", e.message);
      }
    }
    if (req.files && req.files.seal && req.files.seal[0] && fs.existsSync(req.files.seal[0].path)) {
      try {
        fs.unlinkSync(req.files.seal[0].path);
      } catch (e) {
        console.log("[签章模块] 清理临时文件失败:", e.message);
      }
    }
    res.status(500).json({ error: "签章失败: " + error.message });
  }
});

module.exports = router;