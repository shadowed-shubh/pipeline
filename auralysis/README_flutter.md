# 📱 Auralysis — Flutter Mobile App
### AI-Powered Medical Image Analysis — Mobile Client

> Upload your MRI or X-ray. Get a full AI-generated medical report with voice explanation — right on your phone.

[![Flutter](https://img.shields.io/badge/Flutter-3.41.2-02569B?style=flat-square&logo=flutter)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-3.x-0175C2?style=flat-square&logo=dart)](https://dart.dev)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Linux-lightgrey?style=flat-square)](https://flutter.dev)

---

## What This App Does

The Auralysis mobile app is the patient-facing interface for the AI diagnostic pipeline.

- 📸 **Upload** MRI or X-ray images from gallery or camera
- 🤖 **Analyse** with AI — sends to backend pipeline
- 📋 **View** full structured medical report
- 🔊 **Listen** to doctor-style voice explanation
- 📁 **History** — all past scans saved to your account
- 👨‍⚕️ **Doctors** — find specialists near you
- 🔐 **Auth** — secure JWT-based login

---

## Screenshots

| Home | Result | History | Doctors |
|------|--------|---------|---------|
| Ready for Analysis screen | Disease prediction + report | Past scan cards | Doctor directory |

---

## Features

### Scan & Diagnose
- Pick image from gallery or camera
- Real-time upload progress
- Full AI pipeline result:
  - Disease prediction + confidence %
  - Severity (Low / Moderate / High)
  - Medical explanation
  - Symptoms, next steps, specialist
  - Emergency warning signs
  - Patient-friendly summary

### Voice Report
- Auto-generated MP3 audio summary
- Plays inline in the app
- Doctor-style narration

### History
- All past scans saved per account
- View full report for any past scan
- Download report as PDF

### Doctors Directory
- Browse specialists by type
- Filter: Pulmonologist, Neurologist, Radiologist, Oncologist
- One-tap call button

### Authentication
- Patient registration with blood group + age
- JWT-based secure sessions
- Persistent login

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Flutter 3.41.2 |
| Language | Dart |
| HTTP Client | package:http |
| Image Picker | image_picker |
| Audio Player | audioplayers |
| File Picker | file_picker |
| PDF Export | pdf + printing |
| Storage | SharedPreferences |
| State | setState (local) |

---

## Backend

All processing happens in the backend. App only handles UI and API calls.

**Base URL:** `https://pipeline-1-ch5e.onrender.com`

| Screen | Endpoint |
|--------|----------|
| Register | `POST /register` |
| Login | `POST /login` |
| Scan | `POST /diagnose` |
| Voice | `GET /voice-report` |
| History | `GET /history` |
| Save scan | `POST /history` |
| Doctors | `GET /doctors` |

---

## Project Structure

```
auralysis/
├── lib/
│   ├── main.dart              # App entry point
│   ├── api_service.dart       # Base URL + shared HTTP config
│   ├── home_page.dart         # Main scan screen
│   ├── login_screen.dart      # Login UI
│   ├── register_screen.dart   # Registration UI
│   ├── history_screen.dart    # Past scans list
│   ├── doctors_screen.dart    # Doctor directory
│   └── report_detail_screen.dart  # Full report view
│
├── assets/                    # Images, fonts
├── android/                   # Android-specific config
├── ios/                       # iOS-specific config
├── linux/                     # Linux desktop config
├── web/                       # Web config
│
├── pubspec.yaml               # Dependencies
└── analysis_options.yaml
```

---

## Local Setup

### Prerequisites
- Flutter 3.x installed
- Android device / emulator OR Linux desktop

### On Arch Linux (recommended — Linux desktop)

```bash
# Install Flutter via AUR
yay -S flutter

# Install Linux desktop dependencies
sudo pacman -S clang cmake ninja pkg-config gtk3

# Install GStreamer for audio playback
sudo pacman -S gst-plugins-good gst-plugins-bad gst-plugins-ugly gst-libav
```

### Run

```bash
git clone https://github.com/Shreyas1534/auralysis
cd auralysis

flutter pub get
flutter run -d linux
```

### On Android Phone (same WiFi as laptop)

```bash
# Enable USB debugging on phone
flutter devices       # confirm phone is listed
flutter run           # runs on phone
```

---

## Configuration

Backend URL is set in `lib/api_service.dart`:

```dart
class ApiService {
  static const String baseUrl = 'https://pipeline-1-ch5e.onrender.com';
}
```

For local development, change to your machine IP:
```dart
static const String baseUrl = 'http://192.168.x.x:8000';
```

---

## Building APK

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

Install on phone:
```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

---

## Known Issues

- **Audio on Linux:** Requires GStreamer plugins. Install `gst-plugins-ugly` for MP3 support.
- **Cold start delay:** Backend on Render free tier sleeps — first request takes 30-60s.
- **Camera on desktop:** Image picker camera mode not supported on Linux desktop — use gallery only.
