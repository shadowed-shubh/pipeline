import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'api_service.dart';

class DoctorsScreen extends StatefulWidget {
  const DoctorsScreen({super.key});

  @override
  State<DoctorsScreen> createState() => _DoctorsScreenState();
}

class _DoctorsScreenState extends State<DoctorsScreen> {
  bool _isLoading = true;
  List<dynamic> _doctors = [];
  String _errorMessage = '';
  String? _selectedSpecialty;

  final List<String> _specialties = [
    'All',
    'Pulmonologist',
    'Neurologist',
    'Radiologist',
    'Oncologist',
  ];

  @override
  void initState() {
    super.initState();
    _fetchDoctors();
  }

  Future<void> _fetchDoctors([String? specialty]) async {
    setState(() {
      _isLoading = true;
    });

    try {
      String url = '${ApiService.baseUrl}/doctors';
      if (specialty != null && specialty != 'All') {
        url += '?specialty=$specialty';
      }

      final response = await http.get(Uri.parse(url));

      if (response.statusCode == 200) {
        setState(() {
          _doctors = jsonDecode(response.body);
          _isLoading = false;
        });
      } else {
        setState(() {
          _errorMessage = 'Failed to load doctors';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Network error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000),
      appBar: AppBar(
        title: const Text(
          'NEARBY DOCTORS',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            letterSpacing: 2.0,
          ),
        ),
        backgroundColor: const Color(0xFF000000),
        elevation: 0,
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Filter Tags
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              itemCount: _specialties.length,
              itemBuilder: (context, index) {
                final specialty = _specialties[index];
                final isSelected = (_selectedSpecialty ?? 'All') == specialty;

                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: Text(specialty),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _selectedSpecialty = specialty;
                      });
                      _fetchDoctors(specialty);
                    },
                    selectedColor: const Color(0xFF3D7BF5),
                    backgroundColor: const Color(0xFF1C1C1C),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : const Color(0xFF888888),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 16),
          // Doctors List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF3D7BF5)))
                : _errorMessage.isNotEmpty
                    ? Center(child: Text(_errorMessage, style: const TextStyle(color: Colors.redAccent)))
                    : _doctors.isEmpty
                        ? const Center(
                            child: Text(
                              'No doctors found.',
                              style: TextStyle(color: Color(0xFF888888)),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16.0),
                            itemCount: _doctors.length,
                            itemBuilder: (context, index) {
                              final doc = _doctors[index];
                              return Card(
                                color: const Color(0xFF1C1C1C),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16.0),
                                ),
                                margin: const EdgeInsets.only(bottom: 16.0),
                                child: Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          const CircleAvatar(
                                            backgroundColor: Color(0xFF0F0F0F),
                                            child: Icon(Icons.person, color: Color(0xFF3D7BF5)),
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  doc['name'] ?? 'Unknown',
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 16,
                                                  ),
                                                ),
                                                Text(
                                                  doc['specialty'] ?? '',
                                                  style: const TextStyle(color: Color(0xFF3D7BF5)),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 16),
                                      Row(
                                        children: [
                                          const Icon(Icons.local_hospital, color: Color(0xFF888888), size: 16),
                                          const SizedBox(width: 8),
                                          Text(doc['hospital'] ?? '', style: const TextStyle(color: Color(0xFF888888))),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          const Icon(Icons.location_on, color: Color(0xFF888888), size: 16),
                                          const SizedBox(width: 8),
                                          Text(doc['locality'] ?? '', style: const TextStyle(color: Color(0xFF888888))),
                                        ],
                                      ),
                                      const SizedBox(height: 16),
                                      SizedBox(
                                        width: double.infinity,
                                        child: ElevatedButton.icon(
                                          onPressed: () {
                                            // Call functionality placeholder
                                          },
                                          icon: const Icon(Icons.phone, color: Colors.white, size: 18),
                                          label: Text(
                                            doc['phone'] ?? 'Call',
                                            style: const TextStyle(color: Colors.white),
                                          ),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: const Color(0xFF3D7BF5),
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(25.0),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}
