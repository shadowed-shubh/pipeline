import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

class ReportDetailScreen extends StatelessWidget {
  final String reportSummaryJson;
  final String? diseaseName;
  final double? confidence;
  final String? date;
  final String? patientName;

  const ReportDetailScreen({
    super.key,
    required this.reportSummaryJson,
    this.diseaseName,
    this.confidence,
    this.date,
    this.patientName,
  });

  Map<String, dynamic> get _report {
    try {
      final decoded = jsonDecode(reportSummaryJson);
      if (decoded is Map<String, dynamic>) return decoded;
    } catch (_) {}
    return {};
  }

  Color _severityColor(String severity) {
    final s = severity.toLowerCase();
    if (s.contains('low')) return const Color(0xFF34C759);
    if (s.contains('moderate')) return const Color(0xFFFF9500);
    if (s.contains('high')) return const Color(0xFFFF3B30);
    return const Color(0xFF888888);
  }

  Future<void> _downloadPdf(BuildContext context) async {
    final report = _report;
    final severity = report['severity_assessment'] ?? 'Unknown';
    final confidenceStr = confidence != null
        ? '${(confidence! * 100).toStringAsFixed(1)}%'
        : 'N/A';

    final pdf = pw.Document();

    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context ctx) => [
          // Header
          pw.Container(
            padding: const pw.EdgeInsets.all(16),
            decoration: pw.BoxDecoration(
              color: PdfColors.blueGrey900,
              borderRadius: pw.BorderRadius.circular(8),
            ),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text(
                  'AURALYSIS — MEDICAL REPORT',
                  style: pw.TextStyle(
                    fontSize: 20,
                    fontWeight: pw.FontWeight.bold,
                    color: PdfColors.white,
                  ),
                ),
                pw.SizedBox(height: 8),
                if (patientName != null)
                  pw.Text('Patient: $patientName',
                      style: pw.TextStyle(color: PdfColors.grey200, fontSize: 12)),
                pw.Text('Date: ${date ?? DateTime.now().toLocal().toString().split(' ')[0]}',
                    style: pw.TextStyle(color: PdfColors.grey200, fontSize: 12)),
              ],
            ),
          ),
          pw.SizedBox(height: 20),

          // Disease & Confidence
          pw.Text(
            diseaseName?.toUpperCase() ?? 'UNKNOWN CONDITION',
            style: pw.TextStyle(fontSize: 22, fontWeight: pw.FontWeight.bold),
          ),
          pw.SizedBox(height: 6),
          pw.Text('Confidence Score: $confidenceStr',
              style: pw.TextStyle(fontSize: 14, color: PdfColors.blue700)),
          pw.Text('Severity: $severity',
              style: pw.TextStyle(fontSize: 14, color: PdfColors.orange700)),
          pw.SizedBox(height: 16),
          pw.Divider(),
          pw.SizedBox(height: 8),

          // Detailed Explanation
          if (report['detailed_explanation'] != null) ...[
            _pdfSection('Medical Explanation', report['detailed_explanation'].toString()),
            pw.SizedBox(height: 12),
          ],

          // Patient-friendly summary
          if (report['patient_friendly_summary'] != null) ...[
            _pdfSection('Patient Summary', report['patient_friendly_summary'].toString()),
            pw.SizedBox(height: 12),
          ],

          // Possible symptoms
          if (report['possible_symptoms'] is List &&
              (report['possible_symptoms'] as List).isNotEmpty) ...[
            pw.Text('Possible Symptoms',
                style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 6),
            ...(report['possible_symptoms'] as List).map(
              (s) => pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 4),
                child: pw.Text('• $s', style: const pw.TextStyle(fontSize: 12)),
              ),
            ),
            pw.SizedBox(height: 12),
          ],

          // Recommended next steps
          if (report['recommended_next_steps'] is List &&
              (report['recommended_next_steps'] as List).isNotEmpty) ...[
            pw.Text('Recommended Next Steps',
                style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 6),
            ...(report['recommended_next_steps'] as List).asMap().entries.map(
              (e) => pw.Padding(
                padding: const pw.EdgeInsets.only(bottom: 4),
                child: pw.Text('${e.key + 1}. ${e.value}',
                    style: const pw.TextStyle(fontSize: 12)),
              ),
            ),
            pw.SizedBox(height: 12),
          ],

          // Specialist
          if (report['specialist_to_consult'] != null) ...[
            _pdfSection(
                'Specialist to Consult', report['specialist_to_consult'].toString()),
            pw.SizedBox(height: 12),
          ],

          // Emergency signs
          if (report['emergency_signs'] != null &&
              report['emergency_signs'].toString().isNotEmpty) ...[
            pw.Container(
              padding: const pw.EdgeInsets.all(12),
              decoration: const pw.BoxDecoration(
                color: PdfColors.red50,
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('! EMERGENCY SIGNS',
                      style: pw.TextStyle(
                          fontSize: 13,
                          fontWeight: pw.FontWeight.bold,
                          color: PdfColors.red800)),
                  pw.SizedBox(height: 6),
                  pw.Text(report['emergency_signs'].toString(),
                      style: pw.TextStyle(fontSize: 12, color: PdfColors.red900)),
                ],
              ),
            ),
            pw.SizedBox(height: 12),
          ],

          pw.Divider(),
          pw.SizedBox(height: 8),

          // Disclaimer
          if (report['disclaimer'] != null)
            pw.Text(
              report['disclaimer'].toString(),
              style: pw.TextStyle(
                fontSize: 10,
                color: PdfColors.grey600,
                fontStyle: pw.FontStyle.italic,
              ),
            ),
        ],
      ),
    );

    try {
      Directory? dir;
      if (Platform.isAndroid) {
        dir = Directory('/storage/emulated/0/Download');
        if (!await dir.exists()) dir = await getExternalStorageDirectory();
      } else if (Platform.isIOS) {
        dir = await getApplicationDocumentsDirectory();
      } else {
        dir = await getDownloadsDirectory() ?? await getTemporaryDirectory();
      }

      final fileName =
          'auralysis_report_${DateTime.now().millisecondsSinceEpoch}.pdf';
      final file = File('${dir!.path}/$fileName');
      await file.writeAsBytes(await pdf.save());

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle_outline, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Report saved to Downloads',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFF34C759),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save PDF: $e',
                style: const TextStyle(color: Colors.white)),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  pw.Widget _pdfSection(String title, String content) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text(title,
            style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
        pw.SizedBox(height: 4),
        pw.Text(content, style: const pw.TextStyle(fontSize: 12)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final report = _report;
    final severity = report['severity_assessment'] ?? 'Unknown';
    final sevColor = _severityColor(severity);
    final confidenceStr = confidence != null
        ? '${(confidence! * 100).toStringAsFixed(1)}%'
        : 'N/A';
    final symptoms = report['possible_symptoms'];
    final steps = report['recommended_next_steps'];
    final emergencySigns = report['emergency_signs']?.toString() ?? '';

    return Scaffold(
      backgroundColor: const Color(0xFF000000),
      appBar: AppBar(
        backgroundColor: const Color(0xFF000000),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'FULL REPORT',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            letterSpacing: 2.0,
          ),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Disease name + confidence badge ──
                  _buildCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          diseaseName?.toUpperCase() ?? 'UNKNOWN CONDITION',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            // Confidence badge
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 7),
                              decoration: BoxDecoration(
                                color: const Color(0xFF3D7BF5).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                    color: const Color(0xFF3D7BF5).withOpacity(0.5)),
                              ),
                              child: Text(
                                'Confidence: $confidenceStr',
                                style: const TextStyle(
                                  color: Color(0xFF3D7BF5),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            // Severity badge
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 14, vertical: 7),
                              decoration: BoxDecoration(
                                color: sevColor.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: sevColor.withOpacity(0.6)),
                              ),
                              child: Text(
                                severity.toUpperCase(),
                                style: TextStyle(
                                  color: sevColor,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (date != null) ...[
                          const SizedBox(height: 10),
                          Text(
                            date!,
                            style: const TextStyle(
                                color: Color(0xFF888888), fontSize: 13),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ── Detailed explanation ──
                  if (report['detailed_explanation'] != null)
                    _buildSectionCard(
                      icon: Icons.analytics_outlined,
                      title: 'Medical Explanation',
                      child: Text(
                        report['detailed_explanation'].toString(),
                        style: const TextStyle(
                            color: Colors.white, fontSize: 14, height: 1.6),
                      ),
                    ),

                  // ── Possible symptoms (chip list) ──
                  if (symptoms is List && symptoms.isNotEmpty)
                    _buildSectionCard(
                      icon: Icons.checklist_rtl_rounded,
                      title: 'Possible Symptoms',
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: symptoms
                            .map(
                              (s) => Chip(
                                label: Text(
                                  s.toString(),
                                  style: const TextStyle(
                                      color: Colors.white, fontSize: 12),
                                ),
                                backgroundColor:
                                    const Color(0xFF3D7BF5).withOpacity(0.15),
                                side: BorderSide(
                                    color: const Color(0xFF3D7BF5).withOpacity(0.4)),
                                padding: EdgeInsets.zero,
                              ),
                            )
                            .toList(),
                      ),
                    ),

                  // ── Recommended next steps (numbered) ──
                  if (steps is List && steps.isNotEmpty)
                    _buildSectionCard(
                      icon: Icons.health_and_safety_outlined,
                      title: 'Recommended Next Steps',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: steps.asMap().entries.map((e) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 10),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 26,
                                  height: 26,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF3D7BF5).withOpacity(0.2),
                                    shape: BoxShape.circle,
                                  ),
                                  alignment: Alignment.center,
                                  child: Text(
                                    '${e.key + 1}',
                                    style: const TextStyle(
                                      color: Color(0xFF3D7BF5),
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    e.value.toString(),
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 14,
                                        height: 1.5),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                  // ── Specialist to consult ──
                  if (report['specialist_to_consult'] != null)
                    _buildSectionCard(
                      icon: Icons.person_pin_circle_outlined,
                      title: 'Specialist to Consult',
                      child: Text(
                        report['specialist_to_consult'].toString(),
                        style: const TextStyle(
                            color: Colors.white, fontSize: 14, height: 1.6),
                      ),
                    ),

                  // ── Emergency signs (red warning card) ──
                  if (emergencySigns.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2B0000),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: const Color(0xFFFF3B30).withOpacity(0.6)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.warning_amber_rounded,
                                  color: Color(0xFFFF3B30), size: 20),
                              SizedBox(width: 8),
                              Text(
                                'EMERGENCY SIGNS',
                                style: TextStyle(
                                  color: Color(0xFFFF3B30),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  letterSpacing: 1.2,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            emergencySigns,
                            style: const TextStyle(
                                color: Color(0xFFFFADAA), fontSize: 14, height: 1.5),
                          ),
                        ],
                      ),
                    ),

                  // ── Patient friendly summary ──
                  if (report['patient_friendly_summary'] != null)
                    _buildSectionCard(
                      icon: Icons.notes_rounded,
                      title: 'Patient Summary',
                      child: Text(
                        report['patient_friendly_summary'].toString(),
                        style: const TextStyle(
                            color: Colors.white, fontSize: 14, height: 1.6),
                      ),
                    ),

                  // ── Disclaimer ──
                  if (report['disclaimer'] != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1C1C1C),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                            color: Colors.white.withOpacity(0.06)),
                      ),
                      child: Text(
                        report['disclaimer'].toString(),
                        style: const TextStyle(
                          color: Color(0xFF888888),
                          fontSize: 12,
                          fontStyle: FontStyle.italic,
                          height: 1.5,
                        ),
                      ),
                    ),

                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),

          // ── Download PDF button ──
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            decoration: BoxDecoration(
              color: const Color(0xFF000000),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.6),
                  blurRadius: 12,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: () => _downloadPdf(context),
                icon: const Icon(Icons.download_rounded, color: Colors.white),
                label: const Text(
                  'DOWNLOAD PDF',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    letterSpacing: 1.2,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3D7BF5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(26),
                  ),
                  elevation: 0,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1C),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: child,
    );
  }

  Widget _buildSectionCard({
    required IconData icon,
    required String title,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1C),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF3D7BF5).withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: const Color(0xFF3D7BF5), size: 16),
              ),
              const SizedBox(width: 10),
              Text(
                title.toUpperCase(),
                style: const TextStyle(
                  color: Color(0xFF888888),
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}
