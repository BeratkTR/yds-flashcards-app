import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Core Colors
  static const Color bgColor = Color(0xFF0f172a);
  static const Color cardBg = Color(0xFF1e293b);
  static const Color primaryColor = Color(0xFF3b82f6);
  static const Color primaryHover = Color(0xFF2563eb);
  static const Color successColor = Color(0xFF10b981);
  static const Color dangerColor = Color(0xFFef4444);
  static const Color textMain = Color(0xFFf8fafc);
  static const Color textMuted = Color(0xFF94a3b8);
  static const Color cardBorder = Color(0xFF334155);

  // Glassmorphism Decoration
  static BoxDecoration glassDecoration = BoxDecoration(
    color: cardBg.withOpacity(0.8),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(color: cardBorder, width: 1),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.2),
        blurRadius: 20,
        offset: const Offset(0, 10),
      ),
    ],
  );

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: bgColor,
      primaryColor: primaryColor,
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).apply(
        bodyColor: textMain,
        displayColor: textMain,
      ),
      colorScheme: const ColorScheme.dark(
        primary: primaryColor,
        secondary: primaryHover,
        surface: cardBg,
        error: dangerColor,
        onPrimary: Colors.white,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bgColor,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        labelStyle: const TextStyle(color: textMuted),
        hintStyle: const TextStyle(color: textMuted),
      ),
    );
  }
}
