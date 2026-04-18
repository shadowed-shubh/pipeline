import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import 'package:audioplayers/audioplayers.dart';
import 'package:path_provider/path_provider.dart';
import 'api_service.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  /// All selected files (images + PDFs)
  List<File> _selectedFiles = [];
  bool _isLoading = false;
  Map<String, dynamic>? _resultData;

  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isPlaying = false;
  bool _isAudioLoading = false;

  @override
  void dispose() {
    _audioPlayer.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _audioPlayer.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() {
          _isPlaying = state == PlayerState.playing;
          if (state == PlayerState.completed) {
            _isPlaying = false;
            _audioPlayer.stop();
          }
        });
      }
    });
  }

  /// Pick one or more images from gallery
  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final images = await picker.pickMultiImage();
    if (images.isNotEmpty) {
      _audioPlayer.stop();
      setState(() {
        _selectedFiles = images.map((x) => File(x.path)).toList();
        _resultData = null;
      });
      await _uploadFiles();
    }
  }

  /// Pick one or more PDFs (and images) via file picker
  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'bmp', 'webp'],
    );
    if (result != null && result.files.isNotEmpty) {
      _audioPlayer.stop();
      setState(() {
        _selectedFiles =
            result.paths.whereType<String>().map((p) => File(p)).toList();
        _resultData = null;
      });
      await _uploadFiles();
    }
  }

  /// Show bottom sheet to choose pick method
  Future<void> _showPickerOptions() async {
    await showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1C1C1C),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const Text(
                'SELECT FILES',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 20),
              _pickOption(
                icon: Icons.photo_library_rounded,
                label: 'Multiple Images from Gallery',
                subtitle: 'Select one or more medical images',
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImages();
                },
              ),
              const SizedBox(height: 12),
              _pickOption(
                icon: Icons.attach_file_rounded,
                label: 'PDF or Mixed Files',
                subtitle: 'Pick PDF reports, images, or both',
                onTap: () {
                  Navigator.pop(ctx);
                  _pickFiles();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _pickOption({
    required IconData icon,
    required String label,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF2A2A2A),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.07)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF3D7BF5).withOpacity(0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: const Color(0xFF3D7BF5), size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 14)),
                  const SizedBox(height: 2),
                  Text(subtitle,
                      style: const TextStyle(
                          color: Color(0xFF888888), fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded,
                color: Color(0xFF888888), size: 20),
          ],
        ),
      ),
    );
  }

  Future<void> _uploadFiles() async {
    if (_selectedFiles.isEmpty) return;

    if (mounted) setState(() => _isLoading = true);

    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('${ApiService.baseUrl}/diagnose'),
      );

      for (final file in _selectedFiles) {
        final ext = file.path.split('.').last.toLowerCase();
        final field = ext == 'pdf' ? 'pdf' : 'file';
        request.files.add(await http.MultipartFile.fromPath(field, file.path));
      }

      var response = await request.send();
      var responseBody = await response.stream.bytesToString();

      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _resultData = jsonDecode(responseBody);
            _isLoading = false;
          });
        }

        // Log to history
        try {
          final token = await ApiService.getToken();
          if (token != null) {
            await http.post(
              Uri.parse('${ApiService.baseUrl}/history'),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer $token',
              },
              body: jsonEncode({
                'disease': _resultData!['prediction'],
                'confidence': _resultData!['confidence'],
                'report_summary': jsonEncode(_resultData!['medical_report']),
                'voice_url': _resultData!['voice_report_url'],
              }),
            );
          }
        } catch (e) {
          debugPrint('Failed to save history: $e');
        }
      } else {
        throw Exception('Server Error: ${response.statusCode}');
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('❌ Analysis failed. Please check connection.'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F), // Sleek pitch black
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          "AURALYSIS",
          style: TextStyle(
            letterSpacing: 4,
            fontWeight: FontWeight.w900,
            fontSize: 20,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showPickerOptions,
        backgroundColor: const Color(0xFF3D7BF5),
        elevation: 4,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text(
          'NEW SCAN',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.1,
          ),
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeroSection(),
            const SizedBox(height: 30),
            if (_isLoading) _buildLoadingState(),
            if (_resultData != null && !_isLoading)
              buildMedicalReportCard(_resultData!),
            const SizedBox(height: 100), // Space for FAB
          ],
        ),
      ),
    );
  }

  Widget _buildHeroSection() {
    if (_selectedFiles.isEmpty) {
      return Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A1A),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
          boxShadow: [
            BoxShadow(
              color: Colors.blueAccent.withOpacity(0.05),
              blurRadius: 20,
              spreadRadius: 5,
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 60),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.blueAccent.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.biotech_rounded,
                  size: 50,
                  color: Colors.blueAccent,
                ),
              ),
              const SizedBox(height: 20),
              const Text('Ready for Analysis', style: headerStyle),
              const SizedBox(height: 8),
              const Text(
                'Upload images or PDF reports\nto start the automated diagnosis.',
                style: bodyStyle,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    // Show selected files as a grid
    final imageFiles = _selectedFiles
        .where((f) => !f.path.toLowerCase().endsWith('.pdf'))
        .toList();
    final pdfFiles = _selectedFiles
        .where((f) => f.path.toLowerCase().endsWith('.pdf'))
        .toList();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // File count badge
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFF3D7BF5).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: const Color(0xFF3D7BF5).withOpacity(0.4)),
                  ),
                  child: Text(
                    '${_selectedFiles.length} file${_selectedFiles.length != 1 ? 's' : ''} selected',
                    style: const TextStyle(
                      color: Color(0xFF3D7BF5),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Image thumbnails grid
          if (imageFiles.isNotEmpty)
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: imageFiles.length,
              itemBuilder: (_, i) => ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.file(imageFiles[i], fit: BoxFit.cover),
              ),
            ),
          // PDF file chips
          if (pdfFiles.isNotEmpty) ...
            pdfFiles.map(
              (f) => Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2A2A2A),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: const Color(0xFF3D7BF5).withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.picture_as_pdf_rounded,
                          color: Color(0xFF3D7BF5), size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          f.path.split('/').last,
                          style: const TextStyle(
                              color: Colors.white, fontSize: 13),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.blueAccent.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.blueAccent.withOpacity(0.2)),
      ),
      child: Column(
        children: [
          const LinearProgressIndicator(
            backgroundColor: Colors.white10,
            color: Colors.blueAccent,
            minHeight: 6,
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: const [
              SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.blueAccent,
                ),
              ),
              SizedBox(width: 15),
              Text(
                "AI PROCESSING: ESTIMATED 20s",
                style: TextStyle(
                  color: Colors.blueAccent,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget buildMedicalReportCard(Map<String, dynamic> data) {
    final report = data["medical_report"] ?? {};
    String severity = (report["severity_assessment"] ?? "Unknown");

    Color sevColor = Colors.greenAccent;
    if (severity.toLowerCase() == "moderate") sevColor = Colors.orangeAccent;
    if (severity.toLowerCase() == "high") sevColor = Colors.redAccent;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(left: 4, bottom: 12),
          child: Text(
            "DIAGNOSTIC FINDINGS",
            style: TextStyle(
              color: Colors.white54,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5,
              fontSize: 12,
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      data["prediction"]?.toString().toUpperCase() ?? "UNKNOWN",
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  _buildStatusChip(severity, sevColor),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                "CONFIDENCE SCORE: ${(data["confidence"] != null) ? (data["confidence"] * 100).toStringAsFixed(1) + "%" : "N/A"}",
                style: const TextStyle(
                  color: Colors.blueAccent,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Divider(color: Colors.white10),
              ),
              _buildReportSection(
                "Summary",
                report["patient_friendly_summary"],
                Icons.notes_rounded,
              ),
              _buildReportSection(
                "Medical Explanation",
                report["detailed_explanation"],
                Icons.analytics_outlined,
              ),
              _buildListSection(
                "Observed Symptoms",
                report["possible_symptoms"],
                Icons.checklist_rtl_rounded,
              ),
              _buildListSection(
                "Recommended Actions",
                report["recommended_next_steps"],
                Icons.health_and_safety_outlined,
              ),

              if (data["voice_report_url"] != null) ...[
                const SizedBox(height: 10),
                _buildVoiceButton(),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatusChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 11,
          letterSpacing: 1,
        ),
      ),
    );
  }

  Widget _buildVoiceButton() {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 10),
      child: ElevatedButton.icon(
        onPressed: () async {
          if (_isPlaying) {
            await _audioPlayer.pause();
          } else {
            setState(() => _isAudioLoading = true);
            try {
              final response = await http.get(Uri.parse("https://pipeline-1-ch5e.onrender.com/voice-report"));
              if (response.statusCode == 200) {
                final tempDir = await getTemporaryDirectory();
                final file = File('${tempDir.path}/voice_report.mp3');
                await file.writeAsBytes(response.bodyBytes);
                await _audioPlayer.play(DeviceFileSource(file.path));
              } else {
                throw Exception("Server returned ${response.statusCode}");
              }
            } catch (e) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text("Error playing audio: $e", style: const TextStyle(color: Colors.white)),
                    backgroundColor: Colors.redAccent,
                  ),
                );
              }
            } finally {
              if (mounted) setState(() => _isAudioLoading = false);
            }
          }
        },
        icon: _isAudioLoading 
            ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
            : Icon(_isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill, color: Colors.white),
        label: Text(
          _isAudioLoading ? "LOADING AUDIO..." : (_isPlaying ? "PAUSE AUDIO REPORT" : "PLAY AUDIO REPORT"),
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.blueAccent,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Widget _buildReportSection(String title, dynamic content, IconData icon) {
    if (content == null || content.toString().isEmpty) {
      return const SizedBox.shrink();
    }
    return Padding(
      padding: const EdgeInsets.only(bottom: 25),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: Colors.blueAccent),
              const SizedBox(width: 10),
              Text(
                title.toUpperCase(),
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            content.toString(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              height: 1.6,
              fontWeight: FontWeight.w400,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListSection(String title, List? items, IconData icon) {
    if (items == null || items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 25),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: Colors.blueAccent),
              const SizedBox(width: 10),
              Text(
                title.toUpperCase(),
                style: const TextStyle(
                  color: Colors.white54,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 6),
                    child: Icon(
                      Icons.circle,
                      size: 6,
                      color: Colors.blueAccent,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      item.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

const headerStyle = TextStyle(
  color: Colors.white,
  fontSize: 22,
  fontWeight: FontWeight.bold,
);
const bodyStyle = TextStyle(color: Colors.white54, fontSize: 14, height: 1.5);
