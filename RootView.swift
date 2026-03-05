
import SwiftUI
import FirebaseAuth

struct RootView: View {
    
    @State private var logged = Auth.auth().currentUser != nil
    
    var body: some View {
        NavigationStack {
            if logged {
                MainTabView()
            } else {
                LoginView(logged: $logged)
            }
        }
    }
}
