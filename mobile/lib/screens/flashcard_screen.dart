import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/theme.dart';

class FlashcardScreen extends StatefulWidget {
  final String mode; // 'study' or 'review'
  const FlashcardScreen({Key? key, required this.mode}) : super(key: key);

  @override
  State<FlashcardScreen> createState() => _FlashcardScreenState();
}

class _FlashcardScreenState extends State<FlashcardScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  List<dynamic> _words = [];
  int _currentIndex = 0;
  
  // Flip animation
  late AnimationController _flipController;
  late Animation<double> _flipAnimation;
  bool _isFlipped = false;

  // AI Panel
  bool _loadingAi = false;
  Map<String, dynamic>? _aiData;
  String? _aiError;

  @override
  void initState() {
    super.initState();
    _flipController = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _flipAnimation = Tween<double>(begin: 0, end: pi).animate(CurvedAnimation(parent: _flipController, curve: Curves.easeInOut));
    _fetchWords();
  }

  @override
  void dispose() {
    _flipController.dispose();
    super.dispose();
  }

  Future<void> _fetchWords() async {
    try {
      final res = await ApiService.get('/words/daily?mode=${widget.mode}');
      if (res.statusCode == 200) {
        if (mounted) {
          setState(() {
            _words = jsonDecode(res.body);
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleAnswer(bool isCorrect) async {
    if (_words.isEmpty || _currentIndex >= _words.length) return;
    
    final currentWordId = _words[_currentIndex]['id'];

    // Move to next word immediately or after small delay
    if (_isFlipped) {
      _flipController.reverse();
      _isFlipped = false;
    }
    setState(() {
      _currentIndex++;
      _aiData = null;
      _aiError = null;
    });

    try {
      await ApiService.post('/words/answer', {
        'wordId': currentWordId,
        'isCorrect': isCorrect,
      });
    } catch (e) {
      debugPrint("Kayıt hatası: $e");
    }
  }

  Future<void> _fetchAiExamples() async {
    if (_loadingAi || _aiData != null) return;
    final currentWordId = _words[_currentIndex]['id'];

    setState(() {
      _loadingAi = true;
      _aiError = null;
    });

    try {
      final res = await ApiService.get('/words/examples/$currentWordId');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted) setState(() => _aiData = data['examples']);
      } else {
        if (mounted) setState(() => _aiError = "API error limit or invalid response.");
      }
    } catch (e) {
      if (mounted) setState(() => _aiError = "Bağlantı hatası.");
    } finally {
      if (mounted) setState(() => _loadingAi = false);
    }
  }

  void _toggleFlip() {
    if (_flipController.isAnimating) return;
    if (_isFlipped) {
      _flipController.reverse();
    } else {
      _flipController.forward();
    }
    _isFlipped = !_isFlipped;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (_words.isEmpty || _currentIndex >= _words.length) {
      return Scaffold(
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text("Tebrikler! 🎉", style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              const Text("Bu set tamamlandı.", style: TextStyle(color: AppTheme.textMuted)),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Ana Sayfaya Dön"),
              )
            ],
          ),
        ),
      );
    }

    final currentWord = _words[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: Text("${widget.mode == 'review' ? '🔄 Tekrar' : '🚀 Yeni'} - ${_currentIndex + 1} / ${_words.length}"),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // 3D Flip Card
            GestureDetector(
              onTap: _toggleFlip,
              // basic swipe detection
              onPanEnd: (details) {
                if (details.velocity.pixelsPerSecond.dx > 500) {
                  _handleAnswer(true); // Swipe Right
                } else if (details.velocity.pixelsPerSecond.dx < -500) {
                  _handleAnswer(false); // Swipe Left
                }
              },
              child: AnimatedBuilder(
                animation: _flipAnimation,
                builder: (context, child) {
                  final angle = _flipAnimation.value;
                  final isUnder = angle > pi / 2;
                  
                  return Transform(
                    transform: Matrix4.identity()
                      ..setEntry(3, 2, 0.001)
                      ..rotateY(angle),
                    alignment: Alignment.center,
                    child: Container(
                      width: double.infinity,
                      height: 400,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: isUnder 
                            ? [const Color(0xFF1e293b), const Color(0xFF2563eb)] // Back gradient
                            : [const Color(0xFF1e293b), const Color(0xFF0f172a)], // Front gradient
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: AppTheme.cardBorder, width: isUnder ? 1.5 : 1),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))
                        ],
                      ),
                      child: isUnder
                        ? Transform(
                            transform: Matrix4.identity()..rotateY(pi),
                            alignment: Alignment.center,
                            child: _buildCardContent(currentWord['meaning'], "Geri dönmek için tıkla"),
                          )
                        : Stack(
                            children: [
                              _buildCardContent(currentWord['word'], "Anlamını görmek için tıkla"),
                              Positioned(
                                top: 16, right: 16,
                                child: InkWell(
                                  onTap: () {
                                    // Prevent flip if clicked on the button
                                    _fetchAiExamples();
                                  },
                                  child: CircleAvatar(
                                    backgroundColor: AppTheme.cardBg,
                                    radius: 20,
                                    child: _loadingAi 
                                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) 
                                      : const Text("❓", style: TextStyle(fontSize: 18)),
                                  ),
                                ),
                              )
                            ],
                          ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 32),
            
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _handleAnswer(false),
                    icon: const Icon(Icons.close),
                    label: const Text("Bilmiyorum"),
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.dangerColor, padding: const EdgeInsets.symmetric(vertical: 20)),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _handleAnswer(true),
                    icon: const Icon(Icons.check),
                    label: const Text("Biliyorum"),
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.successColor, padding: const EdgeInsets.symmetric(vertical: 20)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // AI Panel
            if (_aiError != null)
              Text(_aiError!, style: const TextStyle(color: AppTheme.dangerColor)),
              
            if (_aiData != null)
              Container(
                decoration: AppTheme.glassDecoration,
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("🤖 Örnek Cümleler", style: TextStyle(color: AppTheme.primaryColor, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    ...List.generate((_aiData!['sentences'] as List).length, (index) {
                      final s = _aiData!['sentences'][index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.black12, borderRadius: BorderRadius.circular(8)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _renderMarkdownBold(s['english'], AppTheme.primaryColor),
                            const SizedBox(height: 4),
                            _renderMarkdownBold(s['turkish'], AppTheme.dangerColor),
                          ],
                        ),
                      );
                    }),
                    const Divider(color: AppTheme.cardBorder, height: 32),
                    const Text("Eş Anlamlılar", style: TextStyle(color: AppTheme.successColor, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8, runSpacing: 8,
                      children: (_aiData!['synonyms'] as List).map((e) => Chip(
                        label: Text(e.toString(), style: const TextStyle(color: AppTheme.successColor)),
                        backgroundColor: AppTheme.successColor.withOpacity(0.1),
                        side: BorderSide(color: AppTheme.successColor.withOpacity(0.2)),
                      )).toList(),
                    ),
                    const SizedBox(height: 16),
                    const Text("Zıt Anlamlılar", style: TextStyle(color: AppTheme.dangerColor, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8, runSpacing: 8,
                      children: (_aiData!['antonyms'] as List).map((e) => Chip(
                        label: Text(e.toString(), style: const TextStyle(color: AppTheme.dangerColor)),
                        backgroundColor: AppTheme.dangerColor.withOpacity(0.1),
                        side: BorderSide(color: AppTheme.dangerColor.withOpacity(0.2)),
                      )).toList(),
                    ),
                  ],
                ),
              )
          ],
        ),
      ),
    );
  }

  Widget _buildCardContent(String mainText, String hint) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Text(
              mainText,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 24),
          Text(hint, style: const TextStyle(color: AppTheme.textMuted)),
        ],
      ),
    );
  }

  Widget _renderMarkdownBold(String text, Color boldColor) {
    final RegExp exp = RegExp(r'\*\*(.*?)\*\*');
    final Iterable<RegExpMatch> matches = exp.allMatches(text);
    
    if (matches.isEmpty) return Text(text);

    int lastMatchEnd = 0;
    List<TextSpan> spans = [];

    for (final match in matches) {
      if (match.start > lastMatchEnd) {
        spans.add(TextSpan(text: text.substring(lastMatchEnd, match.start)));
      }
      spans.add(TextSpan(
        text: match.group(1),
        style: TextStyle(fontWeight: FontWeight.bold, color: boldColor),
      ));
      lastMatchEnd = match.end;
    }
    
    if (lastMatchEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastMatchEnd)));
    }

    return RichText(text: TextSpan(style: const TextStyle(color: AppTheme.textMain), children: spans));
  }
}
