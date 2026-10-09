# Ziheng Wang · Personal homepage

英文个人学术主页，依据个人 CV、个人信息采集表及本人确认的信息整理。保留 [Yuke Zhao 主页](https://hzeroyuke.github.io/index.html) 启发的字体与配色，融合 [Zhenyu Wei 主页](https://zhenyuwei2003.github.io/) 的紧凑研究条目、章节编号和带标识的经历排版。纯 HTML/CSS，无构建步骤和 JavaScript 依赖。

## 本地预览

在 Windows 浏览器中打开 `D:\SpikeW726.github.io\index.html` 即可。字体、CV 和主页缩略图均在仓库内，离线也可以预览。

GitHub Pages 从 `master` 分支的根目录发布，个人主页地址为 https://spikew726.github.io/ ，项目页地址为 https://spikew726.github.io/EgoMatrix/ 。

## 修改内容

- `index.html`：简介、新闻、研究、开源项目、奖项、教育及实验室经历与联系方式。
- `style.css`：桌面双栏与手机单栏布局、颜色、字体。
- `assets/Ziheng_Wang_CV.pdf`：可下载的 CV；更新时替换此文件即可。
- `assets/portrait.jpg`：个人照片原图，通过 CSS 以竖向圆角矩形取景，图片文件未裁剪。
- EgoMatrix 配图直接引用 `EgoMatrix/assets/images/teaser.png` 原图。
- `assets/images/`：M2Bench 架构图与 FinsROV 平台原图。
- `assets/logos/`：SJTU 校徽与 IWIN-FINS 官网标识。ScaleLab 官网未提供独立图片标识，暂用 SJTU 校徽。
- `assets/fonts/`：本地字体及其许可证。

更换个人照片时替换 `assets/portrait.jpg` 即可。`.portrait` 控制竖向画幅，`.portrait img` 的 `object-position`、`transform` 和 `transform-origin` 控制取景位置与缩放。News 圆点在悬停或键盘聚焦链接时有过渡效果，并遵循系统的减少动态效果设置。

两篇工作统一标为 Preprint。EgoMatrix 的预印本月份由本人确认为 2026.09，arXiv 链接待补；M2Bench 首次 arXiv 上传时间为 2026.05。国奖（2024.12）、莙政（2026.06）月份来自《个人简历（大三下版）》。省级及以上奖项来自个人信息采集表。年级、预计毕业时间和四段经历日期以本人最新确认为准。

EgoMatrix 的所有主页链接均指向 `https://spikew726.github.io/EgoMatrix/`。即使用 VS Code Go Live，也会进入线上项目页；其余本地资产仍使用相对路径。

## 图片来源

- [M2Bench 架构图](https://github.com/SpikeW726/M2Bench/blob/master/docs/assets/platform2.png)，来自项目 README。
- [FinsROV 平台图](https://github.com/IWIN-FINS/FinsROV-An-Underwater-Camera-Based-Multi-Robot-Platform/blob/main/Structure/Images/7b80ec35-c6fb-4c0f-8c48-df3105a3505e.png)，来自项目 README，原项目标注 CC BY-SA 4.0，保留原图。
- [IWIN-FINS 标识](https://iwin-fins.com/wp-content/uploads/2020/08/cropped-d0ab9227f36c935008f4646ae43fb03-2-270x270.jpg)，来自实验室官网。
- [SJTU 校徽](https://zhenyuwei2003.github.io/assets/experience/SJTU.png)，与参考主页所用版本一致。

页脚更新时间需随内容更新手动维护。
