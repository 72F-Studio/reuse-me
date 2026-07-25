import 'package:flutter/material.dart';

class HomePage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        padding: EdgeInsets.all(16),
        child: Text('Home', style: TextStyle(color: Color(0xFF3B82F6))),
      ),
    );
  }
}
