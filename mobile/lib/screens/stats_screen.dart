import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../utils/theme.dart';
import 'flashcard_screen.dart';

class StatsScreen extends StatefulWidget {
  const StatsScreen({Key? key}) : super(key: key);

  @override
  State<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends State<StatsScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _stats;
  String _filter = 'ALL';

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final res = await ApiService.get('/stats');
      if (res.statusCode == 200) {
        if (mounted) {
          setState(() {
            _stats = jsonDecode(res.body);
            _isLoading = false;
          });
        }
      } else if (res.statusCode == 401 || res.statusCode == 403) {
        _logout();
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_stats == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Dashboard'), actions: [
          IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
        ]),
        body: const Center(child: Text("Veriler yüklenemedi.")),
      );
    }

    final allWords = List<Map<String, dynamic>>.from(_stats!['allWords'] ?? []);
    final filteredWords = allWords.where((w) {
      if (_filter == 'ALL') return true;
      return w['status'] == _filter;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('YDS Flashcards', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          TextButton.icon(
            onPressed: _logout,
            icon: const Icon(Icons.logout, color: AppTheme.dangerColor),
            label: const Text("Çıkış", style: TextStyle(color: AppTheme.dangerColor)),
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 800),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 16),
                const Text(
                  "Hoş Geldin!",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 24),
                
                // Action Buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ElevatedButton.icon(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const FlashcardScreen(mode: 'study')),
                      ).then((_) => _fetchStats()),
                      icon: const Text("🚀"),
                      label: const Text("Çalışmaya Başla"),
                      style: ElevatedButton.styleFrom(backgroundColor: AppTheme.successColor),
                    ),
                    const SizedBox(width: 16),
                    if ((_stats!['reviewsPending'] ?? 0) > 0)
                      ElevatedButton.icon(
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const FlashcardScreen(mode: 'review')),
                        ).then((_) => _fetchStats()),
                        icon: const Text("🔄"),
                        label: Text("Tekrar Et (${_stats!['reviewsPending']})"),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.cardBg,
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: AppTheme.cardBorder),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 32),

                // Stats Grid
                Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  alignment: WrapAlignment.center,
                  children: [
                    _buildStatCard("Toplam Çalışılan", _stats!['totalStudied'].toString(), AppTheme.primaryColor),
                    _buildStatCard("Öğrenilen", _stats!['correctCount'].toString(), AppTheme.successColor),
                    _buildStatCard("Pratik Gereken", _stats!['incorrectCount'].toString(), AppTheme.dangerColor),
                  ],
                ),
                const SizedBox(height: 32),

                // List Section
                Container(
                  decoration: AppTheme.glassDecoration,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text("Kelime Listesi", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                          DropdownButton<String>(
                            value: _filter,
                            dropdownColor: AppTheme.cardBg,
                            underline: const SizedBox(),
                            icon: const Icon(Icons.filter_list),
                            items: const [
                              DropdownMenuItem(value: 'ALL', child: Text("Tümü")),
                              DropdownMenuItem(value: 'CORRECT', child: Text("Bildiğim")),
                              DropdownMenuItem(value: 'INCORRECT', child: Text("Pratik")),
                            ],
                            onChanged: (val) {
                              if (val != null) setState(() => _filter = val);
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (allWords.isEmpty)
                        const Text("Henüz incelenen kelime yok.", style: TextStyle(color: AppTheme.textMuted))
                      else if (filteredWords.isEmpty)
                        const Text("Bu filtrede kelime bulunamadı.", style: TextStyle(color: AppTheme.textMuted))
                      else
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: filteredWords.length,
                          separatorBuilder: (_, __) => const Divider(color: AppTheme.cardBorder),
                          itemBuilder: (context, index) {
                            final w = filteredWords[index];
                            final wordObj = w['word'];
                            final isCorrect = w['status'] == 'CORRECT';
                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(wordObj['word'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                              subtitle: Text(wordObj['meaning'], style: const TextStyle(color: AppTheme.textMuted)),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: isCorrect ? AppTheme.successColor.withOpacity(0.1) : AppTheme.dangerColor.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      isCorrect ? 'ÖĞRENİLDİ' : 'TEKRAR',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: isCorrect ? AppTheme.successColor : AppTheme.dangerColor,
                                      ),
                                    ),
                                  ),
                                  if ((w['incorrectCount'] ?? 0) > 0) ...[
                                    const SizedBox(height: 4),
                                    Text("Yanlış: ${w['incorrectCount']}", style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                                  ]
                                ],
                              ),
                            );
                          },
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, Color color) {
    return Container(
      width: 150,
      padding: const EdgeInsets.all(20),
      decoration: AppTheme.glassDecoration,
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 8),
          Text(label, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textMuted, fontSize: 14)),
        ],
      ),
    );
  }
}
