# Clip Craft - High-Performance Video Concatenator

<div align="center">

![Clip Craft Logo](public/favicon.ico)

**Fast, Lossless Video Merging with Native FFmpeg**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/MushroomFleet/Video-Concat/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/MushroomFleet/Video-Concat/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Project Codename:** Clip-Craft-31 | **Development:** Oragen Team

</div>

---

## 🚀 Overview

Clip Craft is a professional desktop application for concatenating video files with **unprecedented speed and zero quality loss**. Built on native FFmpeg with Electron, it delivers **12.5-25x faster processing** than browser-based alternatives.

### ✨ Key Features

- **⚡ Lightning Fast**: Stream copy concatenation completes in seconds, not minutes
  - 4x 15-second 1080p clips: **4-10 seconds** (vs 60-120 seconds in browser)
  - Automatic compatibility detection for optimal processing
- **🎯 Zero Quality Loss**: Direct stream copying preserves original video quality
- **🔒 100% Private**: All processing happens locally on your machine
- **🎨 Modern Interface**: Clean, intuitive UI built with React and Shadcn/ui
- **📊 Real-Time Progress**: Live progress tracking with time estimates
- **🔄 Smart Processing**: Automatic fallback to re-encoding when needed

### 🎬 Supported Formats

- **Video**: MP4 (H.264), MOV, AVI, MKV
- **Optimal Performance**: H.264 MP4 files with matching parameters

---

## 📥 Installation

### For End Users (Recommended)

#### Windows Portable Executable ✅ (Tested & Verified)

1. **Download** the latest release from the [Releases page](https://github.com/MushroomFleet/Video-Concat/releases)
2. **Extract** the ZIP file to your desired location
3. **Run** `Clip Craft.exe` - No installation required!

**System Requirements:**
- Windows 10/11 (64-bit)
- 4GB RAM minimum (8GB recommended for HD videos)
- 500MB free disk space

#### macOS & Linux ⚙️ (Build from Source - Untested)

Pre-built macOS and Linux binaries are not currently available. However, the application can be built from source:

```bash
# Clone and install dependencies
git clone https://github.com/MushroomFleet/Video-Concat.git
cd Video-Concat
npm install

# Build for macOS
npm run electron:build:mac

# Build for Linux
npm run electron:build:linux
```

> **Note**: macOS and Linux builds are theoretically supported but have not been tested. Built binaries will be in the `release/` directory.

---

## 💻 Developer Setup

### Prerequisites

- **Node.js** 18+ (for npm compatibility)
- **Bun** 1.0+ (recommended) - [Install Bun](https://bun.sh)
- **Git**

### Clone and Install

```bash
# Clone the repository
git clone https://github.com/MushroomFleet/Video-Concat.git
cd Video-Concat

# Install dependencies with Bun (recommended)
bun install

# OR use npm
npm install
```

### Development Scripts

```bash
# Build the Electron main process TypeScript
bun run build:electron
# OR
npm run build:electron

# Build the React frontend
bun run build
# OR
npm run build

# Run Electron app in development
electron .
```

### Building Installers

```bash
# Build for current platform
npm run electron:build

# Build for specific platforms
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
```

**Output locations:**
- Windows: `release/Clip Craft Setup.exe` and portable version
- macOS: `release/Clip Craft.dmg`
- Linux: `release/Clip-Craft.AppImage`

---

## 📖 Usage Guide

### Basic Workflow

#### 1. Launch the Application
Double-click the Clip Craft executable to open the application.

#### 2. Add Video Files
- **Drag and drop** video files into the upload area, or
- **Click** the upload area to browse and select files
- Add as many videos as needed in the order you want them concatenated

#### 3. Review Your Videos
- Preview the list of added videos
- Rearrange order by dragging (if needed)
- Remove unwanted videos with the X button

#### 4. Concatenate
- Click **"Concatenate Videos"**
- The app automatically detects if your videos are compatible for fast stream copy
- Watch real-time progress with time estimates

#### 5. Download Result
- Once complete, click **"Download Concatenated Video"**
- Choose your save location
- Done! Your merged video is ready

### 🎯 Pro Tips

**For Maximum Speed:**
- Use videos with identical encoding parameters (resolution, frame rate, codec)
- H.264 MP4 format works best
- The app will automatically use ultra-fast stream copy when possible

**If Videos Don't Match:**
- The app automatically detects incompatibilities
- Falls back to re-encoding mode (slower but ensures compatibility)
- Still much faster than browser-based tools

**Performance Expectations:**
- **Stream Copy** (matching videos): 3-10 seconds for 1-5 minute result
- **Re-encoding** (mismatched): 45-90 seconds for 1080p content
- **Browser fallback**: Several minutes for the same task

---

## 🏗️ Technical Architecture

### Desktop Implementation (Phase 2)

Clip Craft uses a sophisticated architecture for maximum performance:

**Frontend:**
- React 18 with TypeScript
- Vite build system
- Shadcn/ui component library
- React Router with HashRouter (for Electron compatibility)

**Backend:**
- Electron 32 for cross-platform desktop support
- Native FFmpeg binaries via `@ffmpeg-installer/ffmpeg`
- Fluent-FFmpeg for intuitive API
- IPC (Inter-Process Communication) for secure renderer↔main process communication

**Video Processing:**
- **Stream Copy Mode**: Direct container remuxing (25-75x faster than re-encoding)
- **Re-encode Mode**: Automatic fallback with H.264 encoding
- **Smart Detection**: FFprobe analyzes video parameters for optimal processing
- **Progress Tracking**: Real-time updates via IPC events

### Performance Benchmarks

| Operation | Browser (Phase 1) | Desktop (Phase 2) | Speedup |
|-----------|------------------|-------------------|---------|
| Stream Copy (4x 15s clips 1080p) | 60-120s | 4-10s | **12-15x** |
| Re-encode (4x 15s clips 1080p) | 8-16 min | 45-90s | **10-20x** |
| File Size Limit | 500MB | Unlimited* | ∞ |

*Limited only by available disk space

---

## 🔧 Troubleshooting

### Windows

**Issue: "Windows protected your PC" warning**
- Click "More info" → "Run anyway"
- This is normal for unsigned applications

**Issue: Application won't start**
- Ensure you have Windows 10/11 (64-bit)
- Try running as administrator
- Check antivirus isn't blocking the executable

### macOS

**Issue: "App can't be opened because it is from an unidentified developer"**
- Right-click the app → Select "Open"
- Confirm in the dialog
- Alternatively: System Preferences → Security & Privacy → "Open Anyway"

**Issue: FFmpeg not found**
- The app includes FFmpeg binaries - no separate installation needed
- If issues persist, check Console.app for error messages

### Linux

**Issue: AppImage won't run**
- Ensure it's executable: `chmod +x Clip-Craft.AppImage`
- Install FUSE if needed: `sudo apt install libfuse2`

### General Issues

**Issue: Videos won't concatenate**
- Check that files are valid video files
- Ensure you have sufficient disk space
- Try re-encoding mode if stream copy fails

**Issue: Slow performance**
- Close other applications to free RAM
- Use videos with matching parameters for stream copy
- SSD storage provides better performance than HDD

---

## 🛠️ Development

### Project Structure

```
clip-craft-31/
├── electron/              # Electron main process source
│   ├── main/             # Main process (window management, IPC)
│   ├── preload/          # Preload script (secure IPC bridge)
│   └── types/            # TypeScript type definitions
├── src/                  # React application source
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── lib/             # Utilities and video processor
│   └── types/           # Frontend type definitions
├── public/              # Static assets
│   └── electron.cjs     # Electron entry point
├── dist/                # Built React app (generated)
├── dist-electron/       # Built Electron code (generated)
└── release/             # Built installers (generated)
```

### Key Technologies

- **Electron**: Desktop framework
- **React**: UI framework
- **TypeScript**: Type-safe development
- **FFmpeg**: Video processing engine
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Shadcn/ui**: Component library

### Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **FFmpeg Project** - The powerhouse behind video processing
- **Electron** - Cross-platform desktop framework
- **React & Vite** - Modern web development tools
- **Shadcn/ui** - Beautiful component library

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/MushroomFleet/Video-Concat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MushroomFleet/Video-Concat/discussions)

---

<div align="center">

**Made with ❤️ by Oragen Team for video creators who value speed and quality**

[Download Latest Release](https://github.com/MushroomFleet/Video-Concat/releases) • [Report Bug](https://github.com/MushroomFleet/Video-Concat/issues) • [Request Feature](https://github.com/MushroomFleet/Video-Concat/issues)

</div>
