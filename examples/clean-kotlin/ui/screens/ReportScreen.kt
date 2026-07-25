package ui.screens

@Composable
fun ReportScreen() {
    LazyColumn {
        Chart(data = emptyList())
        Legend()
    }
}
