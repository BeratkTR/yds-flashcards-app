import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'utils/theme.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/stats_screen.dart';

void main() {
  runApp(const YDSFlashcardApp());
}

class YDSFlashcardApp extends StatelessWidget {
  const YDSFlashcardApp({Key? key}) : super(key: key);

  Future<bool> _checkAuth() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') != null;
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'YDS Flashcards',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: FutureBuilder<bool>(
        future: _checkAuth(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          final isAuthenticated = snapshot.data ?? false;
          if (isAuthenticated) {
            return const StatsScreen();
          }
          return const LoginScreen();
        },
      ),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/stats': (context) => const StatsScreen(),
      },
    );
  }
}
