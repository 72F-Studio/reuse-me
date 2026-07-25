import SwiftUI

struct HomeView: View {
    var body: some View {
        ScrollView {
            VStack {
                Text("Home").foregroundColor(Color(hex: "#3B82F6"))
                Divider()
            }
            .padding(16)
        }
    }
}
