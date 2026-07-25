package ui.components

@Composable
fun PrimaryButton(label: String) {
    Button(onClick = {}) {
        Text(text = label, color = Color(0xFF3B82F6))
        Spacer(modifier = Modifier.width(8.dp))
    }
}
